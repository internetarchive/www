/* eslint-disable semi */
/**
 * console.log() utility -- production ignores 'log()' JS calls; dev invokes 'console.log()'
 */
const log = (
  location.hostname === 'localhost'  ||
  location.host.substr(0,  4) === 'www-'  ||
  location.host.substr(0,  4) === 'cat-'  ||
  location.host.substr(0, 18) === 'ia-petabox-review-'  ||
  location.host.substr(0, 10) === '58-review-'
    // eslint-disable-next-line no-console
    ? console.log.bind(console) // convenient, no?  Stateless function
    : () => {}
)

export { log as default }
