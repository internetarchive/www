/* eslint-disable semi */
// eslint-disable-next-line import/no-named-as-default
import $ from '../util/jquery.js'
import Message from '../util/message.js'
import Tiles from '../tiles/tiles.js'
import ScrollProximityHandler from '../util/scroll-proximity-handler.js';

class Related {
  /**
   * Processing to get related item using new API, Get response and Render
   */
  static setup() {
    const $related = $('#js-related')
    if (!$related.length)
      return

    // GET top offset of #also-found(related item section) and executing ajax call accordingly
    const alsoFound    = $('#also-found')

    this.scrollProximityHandler = new ScrollProximityHandler(
      'related_items',
      alsoFound,
      // eslint-disable-next-line consistent-return
      () => {
        if (!$related.text()) {
          alsoFound.find('.tilebars').show()
          $related.html(Message.LoadingMessage({ message: 'Fetching items' }))
          return Related.doWhenScrolledToRelatedSection();
        }
      },
    );

    this.scrollProximityHandler.startListener();
  }


  /**
   * Get API response from Related.getRelatedItems() after #js-related scrolled and
   * render response
   *
   * @return {Promise}
   */
  static doWhenScrolledToRelatedSection() {
    const identifier = $('#also-found').data('identifier')
    const $related = $('#js-related')

    return Related.getRelatedItems(identifier)
      .then((response) => {
        // write response HTML markup to related items section
        $related.html(response)

        // Set visibility:hidden of tiles for 2nd+ row esp. for narrower pages
        Tiles.tilebars()
      })
      .catch((error) => {
        $('#playplayset').hide() // Hide playset

        // Show the related items section, so we can display error
        $related.html(Message.ErrorMessage({ errorMessage: error.message })).show()
      })
  }


  /**
   * API call to get related item and return response using Promise
   *
   * @param  {String} identifier item identifier
   * @param  {Boolean} json truthy to return JSON instead of markup HTM
   * @return {Promise<Array|String>}
   */
  static getRelatedItems(identifier, json) {
    return new Promise((resolve, reject) => {
      const relatedUrl = `/details/${encodeURIComponent(identifier)}?RelatedItemsGet=${(json ? 'json' : 1)}`

      $.get(relatedUrl, (response) => {
        if (response === '')
          reject(new Error('No similar items found.'))
        resolve(response) // Return related items hashData using Promise
      }).error(() => {
        reject(new Error('Temporarily unable to access similar items. Please try again later.')) // Return error message to Promise when any error found
      })
    })
  }
}

$(() => Related.setup())

export { Related as default }
