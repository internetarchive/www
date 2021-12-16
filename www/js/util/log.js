
/**
 * console.log() utility -- production ignores 'log()' JS calls; dev invokes 'console.log()'
 */
const log = (
  typeof Deno !== 'undefined'  ||
  typeof location === 'undefined'  ||
  location.host === 'localhost'  ||
  location.host.substr(0,  4) === 'www-'  ||
  location.host.substr(0,  4) === 'cat-'  ||
  location.host === 'av.dev.archive.org'
    /* eslint-disable-next-line no-console */
    ? console.log.bind(console) // convenient, no?  Stateless function
    : () => {}
)

/* eslint-disable-next-line no-console */
const warn = console.error.bind(console)


/**
 * Writes msg to stderr and quits process (default) or throws exception (IFF $FATAL_THROW env set)
 * @param {...any} str  string(s) or object(s) to write to stderr
 */
function fatal(...str) {
  warn('FATAL ERROR:', ...str)
  if ((typeof window  !== 'undefined' &&        window.FATAL_THROW) ||
      (typeof Deno    !== 'undefined' && Deno.env.get('FATAL_THROW'))) {
    throw Error(`FATAL ERROR: ${str[0]}`)
  } else {
    Deno.exit(1)
  }
}


/**
 * Writes msg to stderr w/o truncation long/deep nested objects
 * @param  {...any} args  string(s) or object(s) to write to stderr
 */
function warnfull(...args) {
  // warn(util.inspect(e, false, null, true /* enable colors */)) // doesn't work for webapps :(
  warn(JSON.stringify(args, null, 2))
}


export default log
export {
  log, fatal, warn, warnfull,
}
