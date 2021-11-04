import { MxRecord, resolveMx } from 'dns'

function exchangeByDomainName(domain: string): Promise<string|undefined> {
     
    return new Promise((resolve, reject)=> {

        return resolveMx(domain, (err: unknown, addresses: MxRecord[]): void => {
            
            let nominatedPriority: number = 0
            let exchange: string = ''

            if ( !addresses?.length ) return resolve(undefined)
    
            for( let i = 0; i < addresses.length; i++) {
    
                if ( addresses[i].priority < nominatedPriority || nominatedPriority === 0) {
                    nominatedPriority = addresses[i].priority
                    exchange = addresses[i].exchange
                }

            }

            return resolve(exchange)
        })
    })

 }

 export { exchangeByDomainName }