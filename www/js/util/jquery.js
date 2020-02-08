/* eslint-disable semi */

/**
 * ES Module wrapper for jQuery
 */

/*
  We would _like_ to something like this when:
    - all our JS is using components
    - no <script> inline blocks or JS/onclicks (etc.) using global `$' anymore in PHP emitted markup
  but we can't do this _now_ because jQuery is already loaded as a global across all IA pages
  in the <head> and we have to avoid _two_ jQuery loading on page.
  Otherwise, among other things, doing extensions like `$.center()` will get messed up,
  assigning to one but not the other.  (Additionally, jQuery gets unhappy fast w/ 2+ on page..)
*/
// import '../../includes/jquery-1.10.2.min.js'

const { $, jQuery } = window // so simply point to the known global where jQuery is

export { $, jQuery as default }
