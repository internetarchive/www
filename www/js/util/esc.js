/* eslint-disable semi */

/**
 * Escapes characters (to html entities) in JS template strings that can come from user input and
 * have XSS risk.
 * This is a 'tagged template' for JS template strings - @see
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#Tagged_templates
 *
 * Use like:
 *   const user = 'something <script>alert("not good")</script>'
 *   esc`hi ${user}`
 * Returns:
 *   "hi something &lt;script&gt;alert(&quote;not good&quote;)&lt;/script&gt;"
 *
 * @param {*} template
 * @param {...any} subs
 */
function esc(template, ...subs) {
  // console.log(template, subs)

  let ret = template[0]
  for (let i = 0; i < subs.length; i++) {
    // Escape special chars in the substitution
    ret += String(subs[i])
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quote;')

    ret += template[i + 1]
  }
  return ret
}

export { esc as default }
