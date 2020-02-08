/* eslint-disable semi */
class Tiles {
  /**
   * function that finds alternate (non-AJS.tiler()) sets of item tiles,
   * that are laid out in strips/columns and will hide entire columns
   * if they fall off the right side, in terms of fitting to browser/page width
   */
  static tilebars() {
    // iterate over all row classes that have at least 1 .tilebars .results div in them...
    $('.row .tilebars').find('.results').parents('.row').each((k, row) => {
      let first = false
      $(row).find('.results').each((key, val) => {
        $(val).show().css({ visibility: 'hidden' })
        if (!first)
          first = $(val).offset()
        if ($(val).offset().top !== first.top)
          $(val).hide()
        else
          $(val).css({ visibility: 'visible' })
      })
      // if (first) $(row).find('.tilebars > h4').css({'padding-left':first.left+10})
    })
  }
}


export { Tiles as default }
