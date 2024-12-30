import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'

import './search-results.js'
import cgiarg from './util/cgiarg.js'

// eslint-disable-next-line import/prefer-default-export
export class SearchPage extends LitElement {
  constructor() {
    super()

    // see if we are on a collection page, like `/details/prelinger`
    const id = (location.pathname.match(/^\/details\/([^&?/]+)/) || ['', ''])[1]

    this.query = (id === ''
      ? cgiarg('q')  ||  cgiarg('query')  ||  'NASA'
      : `collection:${id}` // on collection page, search for items in this collection
    )
  }

  static get properties() {
    return {
      query: { type: String },
    }
  }

  static get styles() {
    return css``
  }

  render() {
    return html`
<a href="https://github.com/internetarchive/www">
  <img style="float:right; height:75px; width:75px; border-radius:38px" src="/img/ia3.gif"/>
</a>
<h1 style="text-align:center"> archive.org JS Single Page App using web components </h1>

<small style="position:absolute; right:10px; bottom:10px">
  <i><a href="https://github.com/internetarchive/www">repo</a></i>
</small>

<search-results query="${this.query}"></search-results>
    `
  }
}

customElements.define('search-page', SearchPage)
