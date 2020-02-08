/* eslint-disable semi */

import './build/whatwg-fetch.js' // polyfill for 'fetch' for IE and oldsters..

/**
 * Fetches MDAPI REST API for an item and additionally tries to classify the page 'type'.
 */
class MDAPI {
  /**
   * Gets MDAPI for given @id and invokes @callback when MDAPI results return
   *
   * @param {string} id
   * @param {function} callback
   */
  constructor(id, callback) {
    this.id = id

    this.mdapi_xhr().then((mdapi) => {
      const type = (mdapi.metadata.mediatype === 'collection' ? 'collection' : 'item')
      callback(mdapi, type)
    })
  }

  async mdapi_xhr() {
    this.mdapi = null

    const url = `https://archive.org/metadata/${this.id}`

    // eslint-disable-next-line compat/compat
    const response = await fetch(window.navigator.onLine === false
      ? `http://localhost:8888/json/${this.id}.json`
      : url)
    return response.json()
  }
}


export { MDAPI as default }
