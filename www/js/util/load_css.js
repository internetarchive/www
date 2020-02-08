/* eslint-disable semi */
/**
 * CSS helper methods
 */


/**
 * Loads CSS, via a string, into the DOM and current page
 * @param {string} str - CSS to load
 */
function load_css(str) {
  const obj = document.createElement('style')
  obj.setAttribute('type', 'text/css')
  if (obj.styleSheet)
    obj.styleSheet.cssText = str // MSIE
  else
    obj.appendChild(document.createTextNode(str)) // other browsers

  const headobj = document.getElementsByTagName('head')[0]
  headobj.appendChild(obj)
}


export { load_css as default }
