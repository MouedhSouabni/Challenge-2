import { resolveMx } from 'dns'


/*

5
14
2
5
6

*/
 function hasValidMxRecord(domain) {
     
    return new Promise((resolve, reject)=> {

        return resolveMx(domain, (err, addresses) => {
            
            let nominatedPriority = 0
            let exchange
    
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

 export { hasValidMxRecord }