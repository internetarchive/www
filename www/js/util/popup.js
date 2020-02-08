/* eslint-disable semi */
// eslint-disable-next-line import/no-named-as-default
import $ from './jquery.js'
import log from './log.js'


class Popup {
  /**
   * Returns CSV-type key-value pairs for window.open() 3rd arg
   * @param int width
   * @param int height
   */
  static params(width, height) {
    const params = {
      height,
      width,
      scrollbars: 'yes',
      resizable: 'yes',
      toolbar: 'no',
      directories: 'no',
      location: 'yes',
      menubar: 'no',
      status: 'yes',
    }

    // Options must be expressed as comma-separated key-value pairs.
    return Object.keys(params)
      .filter((key) => params[key])
      .reduce((paramPairs, key) => paramPairs.concat(`${key}=${params[key]}`), [])
      .join(',')
  }


  /**
   * Returns markup link that opens its href in a popup instead of the same window.
   * Height and width of the popup can be customized via arguments.
   */
  static renderPopupLink({
    linkText, href, height, width, title,
  } = {}) {
    // Include href for semantics.
    return `
      <a href="${href}" title="${title}"
        onclick="window.open('${href}', 'popup', '${Popup.params(width, height)}'); return false"
      >${linkText}</a>`
  }


  /**
   * Sets up data-popup-links
   */
  static setupPopupLink() {
    const attributeName = 'popup-link'
    const widthAttribute = 'popup-link-width'
    const heightAttribute = 'popup-link-height'

    log('popup setup')

    $(document.body).off('click.PopupLink').on('click.PopupLink', `[data-${attributeName}]`, (event) => {
      event.preventDefault()
      const currentTarget = $(event.currentTarget)
      const w = currentTarget.data(widthAttribute) || 500
      const h = currentTarget.data(heightAttribute) || 500
      window.open(event.currentTarget.href, 'popup', Popup.params(w, h))
    })
  }
}


$(Popup.setupPopupLink)


export { Popup as default }
