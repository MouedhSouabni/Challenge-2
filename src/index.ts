// Importing "readfile" function to read the file // "isValidDomain" function to validate the domain // "hasValidMxRecord" function to validate Mx record
import { readFile, writeFile  } from 'fs'
import { isValidDomain } from './validate-domain'
import { hasValidMxRecord } from './mx-record-validator'
import { validateSMTP } from './validate-SMTP'



;(() => {
    // Reading the file. 'utf8' to read text file.
    readFile('./test/index.txt', 'utf8', async (err, data) => {

        try {

            if (err) {
                console.error(err)
                return
            }
            // Splits the list
            const processedData = data.split('\r\n').map(x => {

                const [fullName, emailAddress] = x.split(', ')

                return {
                    fullName,
                    emailAddress
                } // Splits into names and addresses

            })

            let exchangeValidated = []
            let smtpValidated = []

            processedData.forEach(x => {

                exchangeValidated.push(new Promise((resolve, reject) => {

                    if (!/^\w*\.?\w+\@\w+\.\w+$/gm.test(x.emailAddress)) return resolve(false)


                    // Filters using domain name validity
                    if (!isValidDomain(x.emailAddress?.split('@')[1])) return resolve(false)


                    // wait until mx record is retrieved
                    return hasValidMxRecord(x.emailAddress?.split('@')[1])
                        .then(exchange =>
                            resolve({
                                ...x,
                                exchange
                            }))
                        .catch(e =>
                            reject(e))


                }))

            })


            // when all exchange validated do the following
            const validEmailsWithExchange = await Promise.all(exchangeValidated)
            const filteredEmailsWithExchange = validEmailsWithExchange.filter(a=> a != false)

        
            !!filteredEmailsWithExchange?.length && filteredEmailsWithExchange.forEach(x=> 
                smtpValidated.push(
                    new Promise((resolve, reject)=>

                        validateSMTP(x.exchange, x.emailAddress)
                            .then(isResolved=> 
                                resolve({ ...x, isResolved }))
                            .catch(e=> 
                                reject(e))

                    )
                ))

            
            // when all smtp validated do the following
            const smtpValidatedEmails = await Promise.all(smtpValidated)
            const content = smtpValidatedEmails
                .filter(x=> !!x.isResolved)
                .map(x=> x.fullName + ', ' + x.emailAddress)
                .join('\r\n')

            console.log( 'smpt validated emails ', smtpValidatedEmails )

            return writeFile('./output.txt', content, 'utf8', ()=> console.log('Files created'))

        } catch (e) {
            console.log('caught error ', e)
        }

    })

})()