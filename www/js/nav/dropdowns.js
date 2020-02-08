/* eslint-disable semi */
/**
 * `dropdown` singleton. Adds event bindings to either the body element to
 * close any opened dropdowns via `attachCloseToBody` or to a jQuery object
 * collection to toggle dropdowns via `bindTo`.
 */
export default {
  /**
   * Binds click event to body to close any opened dropdowns. Should only
   * be called once per page load
   */
  attachCloseToBody() {
    $(document.body).on('click', (e) => {
      const $dropdowns = $('.dropdown-ia')
      const opened_class = 'open'
      const { target } = e

      if (!$dropdowns.is(target)
          && $dropdowns.has(target).length === 0
          && $(`.${opened_class}`).has(target).length === 0
      )
        $dropdowns.removeClass(opened_class)
    })
  },

  /**
   * Binds click event to a jQuery collection to toggle dropdowns.
   * @param {object} $el - a jQuery collection of elements
   */
  bindTo($el) {
    $el.on('click', () => {
      $el.parent().toggleClass('open')
      return false
    })
  },
}
