import { LitElement, html, css } from 'https://esm.ext.archive.org/lit@3.2.1'

import './item-tile.js'

/* eslint-disable-next-line import/prefer-default-export */
export class ItemTiles extends LitElement {
  static get properties() {
    return {
      items: { type: Array },
    }
  }

  static get styles() {
    return css`
item-tile {
  /* technically only needed for MSIE11 - other browsers will use CSS Grid and override */
  display: inline-block;
  vertical-align: top;
}
@supports not (-ms-high-contrast: none) /* mediaquery for all _but_ MSIE */ {
  :host {
    display: grid;
    grid-gap: 18px;
    grid-template-columns: repeat(auto-fill, 180px);
    justify-content: center;

    margin-top: 20px;
  }
}`
  }

  render() {
    /* eslint-disable-next-line no-console */
    console.log(this.items)
    return html`
${this.items.map((item) => html`
  <item-tile
    .item="${item}"
    identifier="${item.identifier}"
    title="${item.title}"
    downloads="${item.downloads}"
    mediatype="${item.mediatype}"
    reviews="${item.num_reviews ? item.num_reviews : 0}"
  >
  </item-tile>
`)}`
  }
}

customElements.define('item-tiles', ItemTiles)
