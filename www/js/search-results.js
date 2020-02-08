/* eslint-disable semi */
import { LitElement, html, css } from './build/lit-element.js'

import './item-tiles.js'

import './build/whatwg-fetch.js' // polyfill for 'fetch' for IE and oldsters..

// import log from './util/log.js'


// eslint-disable-next-line import/prefer-default-export
export class SearchResults extends LitElement {
  constructor() {
    super()

    this.fields = [
      'identifier',
      'title',
      'downloads',
      'collection',
      'mediatype',
      'creator',
      'num_reviews',
    ]

    this.query = ''
    this.hits = []
  }

  static get properties() {
    return {
      hits: { type: Array },
      query: { type: String },
    }
  }

  static get styles() {
    return css`
[class^="iconochive-"],[class*=" iconochive-"]{font-family:'Iconochive-Regular';speak:none;font-style:normal;font-weight:normal;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}.iconochive-Uplevel:before{content:"\\21b5"}.iconochive-search:before{content:"\\1f50d"}

form {
  max-width: 325px;
  margin: auto;
}
form > div {
  display: inline-block;
  font-size: 24px;
}
`
  }

  updated(props) {
    if (props.has('query')) {
      this.search().then((hits) => {
        this.hits = hits
      })
    }
  }

  async search() {
    // sets up 'loading...' message:
    this.hits = []

    const scrape = false

    // xxx www-tracey for CORS issues right now..
    if (scrape) {
      const url = `https://www-tracey.archive.org/services/search/v1/scrape?count=100&fields=${this.fields.join(',')}&q=${this.query}`

      // eslint-disable-next-line compat/compat
      const response = await fetch(url)
      const json = await response.json()
      return json.items
    }

    const url = `https://www-tracey.archive.org/advancedsearch.php?output=json&q=${this.query}&fl[]=${this.fields.join('&fl[]=')}`

    // eslint-disable-next-line compat/compat
    const response = await fetch(window.navigator.onLine === false
      ? 'http://localhost:8888/json/search.json'
      : url)
    const json = await response.json()
    return json.response.docs
  }

  submitted(evt) {
    try {
      this.query = evt.target.querySelector('input').value
    } catch (e) {
      // wallpaper over _whatever tf_ that was xxx
      this.query = this.shadowRoot.getElementById('query').value
    }

    this.search().then((hits) => {
      this.hits = hits
    })
  }

  render() {
    if (!this.hits.length) return html`<form>Searching...</form>`

    // SUBTLE!  pass on our item data to a web-component __as its property to it__
    return html`
<form
    @submit="${(evt) => this.submitted(evt)}"
    onsubmit="return false"
  >
  <div>
    Search: <input id="query" type="input" value="${this.query}"></input>
    <button type="button" @click="${this.submitted}">
      <span class="iconochive-search"></span>
    </button>
  </div>
</form>

<item-tiles .items=${this.hits}>
</item-tiles>
`
  }
}

customElements.define('search-results', SearchResults)
