import { disposableDomainList } from './disposable-domains' // Imports list of disposable domains

const processedDisposableDomains = new Set(disposableDomainList) // Duplicates the list then sets it to the new version to avoid repetition
function isValidDomain(domain) {

    return !processedDisposableDomains.has(domain) // Returns addresses with valid domains only
}          // Meaning returns addresses that do not have domains matching any of those in the disposable domains list

export { isValidDomain } // Exports function