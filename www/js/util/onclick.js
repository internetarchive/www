/* eslint-disable semi */
/**
 * onclick handling utility -- esp. removes repeated copy/paste for preventing default
 */

/**
 * Attaches a click handler to a jQuery selector
 *
 * @param {string} selector
 * @param {function} callback
 * @param {string} retval - 'false' to always return false (and prevent Default);
 *                          'callback' to return whatever callback returns;
 *                          'default' to do whatever clickee would normally do after callback
 * @param {string} children_selector - (optional) apply click _only_ to these children of the
 *                                     first selector.  nicely works for _future_ children, too
 *
 * @return {boolean} yes or no to default behaviour after callback (eg: link clicked/button pressed)
 */
function onclick(selector, callback, retval = 'false', children_selector = null) {
  if (typeof selector !== 'string')
    throw new Error('first arg should be a string')

  $(selector).on('click', children_selector, (evt) => {
    const ret = callback(evt)
    if (retval === 'callback'  &&  ret)
      return ret

    if (retval === 'default')
      return true

    // eslint-disable-next-line no-unused-expressions
    evt && evt.preventDefault  && evt.preventDefault()
    // eslint-disable-next-line no-unused-expressions
    evt && evt.stopPropagation && evt.stopPropagation()
    return false
  })
}

export { onclick as default }
