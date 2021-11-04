// Importing "readfile" function to read the file // "isValidDomain" function to validate the domain // "hasValidMxRecord" function to validate Mx record
import { readFile, writeFile } from 'fs'
import { isValidDomain } from './validate-domain'
import { exchangeByDomainName } from './mx-record-validator'
import { validateSMTP } from './validate-SMTP'
import { ContactRecord } from './types'

;(() => {
    // Reading the file. 'utf8' to read text file.
    readFile('./test/index.txt', 'utf8', async ( err: unknown, data: string ) => {

        try {

            if (err) {
                console.error(err)
                return
            }

            // Splits the list
            const processedData: ContactRecord[] = data.split('\n').map((x: string): ContactRecord => {

                const [fullName, emailAddress] = x.split(', ')

                return {
                    fullName,
                    emailAddress
                } // Splits into names and addresses

            })

            let exchangeValidated: Array<Promise<boolean|ContactRecord>> = []
            let smtpValidated: Array<Promise<boolean|ContactRecord>> = []

            processedData.forEach((x: any) => {

                    exchangeValidated.push(new Promise((resolve, reject) => {

                        if (!/^\w*\.?\w+\@\w+\.\w+$/gm.test(x.emailAddress))
                            return resolve(false);


                        // Filters using domain name validity
                        if (!isValidDomain(x.emailAddress?.split('@')[1]))
                            return resolve(false);


                        // wait until mx record is retrieved
                        return exchangeByDomainName(x.emailAddress?.split('@')[1])
                            .then((exchange) => resolve({
                                ...x,
                                exchange
                            }))
                            .catch((e: unknown) => reject(e));


                    }));

                })


            // when all exchange validated do the following
            const validEmailsWithExchange: Array<boolean|ContactRecord> = await Promise.all(exchangeValidated)
            const filteredEmailsWithExchange: Array<boolean|ContactRecord> = validEmailsWithExchange.filter((a: any)=> a != false)

        
            !!filteredEmailsWithExchange?.length && filteredEmailsWithExchange.forEach((x: any)=> 
                smtpValidated.push(
                    new Promise((resolve, reject)=>

                        validateSMTP(x.exchange, x.emailAddress)
                            .then((isResolved: boolean) => resolve({ ...x, isResolved }))
                            .catch(e=> 
                                reject(e))

                    )
                ))

            
            // when all smtp validated do the following
            const smtpValidatedEmails: Array<boolean|ContactRecord> = await Promise.all(smtpValidated)
            const content: string = smtpValidatedEmails
                .map((x: any)=> x.fullName + ', ' + x.emailAddress)
                .join('\r\n')

            // console.log( 'smpt validated emails ', smtpValidatedEmails )

            return writeFile('./output.txt', content, 'utf8', ()=> console.log('Files created'))

        } catch (e: unknown) {
            console.log('caught error ', e)
        }

    })

})()