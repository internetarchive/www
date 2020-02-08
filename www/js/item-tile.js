/* eslint-disable semi */
import { LitElement, html, css } from './build/lit-element.js'

import './item-stat.js'

// eslint-disable-next-line import/prefer-default-export
export class ItemTile extends LitElement {
  static get properties() {
    return {
      identifier:  { type: String },
      title:       { type: String },
      mediatype:   { type: String },
      downloads:   { type: Number },
      reviews:     { type: Number },
      src:         { type: String },
      item:        { type: Object },
    }
  }


  constructor() {
    super()
    this.src = ''
    this.reviews = 0
    this.downloads = 0
  }


  static get styles() {
    return css`
:host {
  /* css variables */
  --gray-bento: #e9e9e9;
  --tile-img-encroach: 1px;
  --TILE-WIDTH: 180px;

  min-height: 50px;
  margin-bottom: 25px;
}
:host, img {
  max-width: var(--TILE-WIDTH);
  width: var(--TILE-WIDTH);
}
:host > div {
  padding-bottom: 3px;
  border: var(--tile-img-encroach) solid var(--gray-bento);
}
:host img {
  display: block;
  height: var(--TILE-WIDTH);
  max-height: var(--TILE-WIDTH);
  object-fit: contain;
  background-color: black;
}
a {
  text-decoration: none;
  color: black !important;
}
item-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr; /* xxx want this more automatic.. */
  grid-template-rows: auto;
  justify-content: space-between;
  text-align: center;
  padding: 5px 0;
}
.by, .ttl {
  padding: 0 4px;
}
.ttl {
  /* vars */
  --pad-top: 10px;
  --font-size: 14px;
  --line-ht: 1.2;
  /* ~2 lines - current box model already includes top padding */
  --max-ht: calc(2 * var(--font-size) * var(--line-ht)); // + var(--pad-top));

  font-size: var(--font-size);
  padding-top: var(--pad-top);
  line-height: var(--line-ht);
  max-height: var(--max-ht);
  overflow-y: hidden;
  word-wrap: break-word !important;
}
.by {
  --font-size: 10px;
  --line-ht: 1.2;
  --max-ht: calc(2 * var(--font-size) * var(--line-ht)); /* ~2 lines */

  color: #979797;
  font-size: var(--font-size);
  line-height: var(--line-ht);

  max-height: var(--max-ht);
  overflow-y:hidden;
  word-wrap: break-word !important;
}
`
  }

  mediatype_to_glyph() {
    return this.mediatype // xxx
  }

  num_favorites() {
    return (
      this.item.collection && this.item.collection.length
        ? this.item.collection.filter((c) => c.startsWith('fav-')).length
        : 0
    )
  }

  creator() {
    let { creator } = this.item

    // if array - use first creator
    if (typeof this.item.creator === 'object'/* array */  &&  this.item.creator.length) [creator] = this.item.creator

    if (typeof creator === 'string') return (creator.length ? `by ${creator}` : '')

    return ''
  }

  render() {
    return html`
<div>
<a href="/details/${this.identifier}">
  <img src="https://archive.org/services/img/${this.identifier}"/>
  <div class="ttl">
    ${this.title}
  </div>
  <div class="by">
    ${this.creator()}
  </div>
  <item-stats>
    <item-stat glyph="${this.mediatype_to_glyph()}" style="font-size:150%"></item-stat>
    <item-stat glyph="eye" stat="${this.downloads}"></item-stat>
    <item-stat glyph="favorite" stat="${this.num_favorites()}"></item-stat>
    <item-stat glyph="comment" stat="${this.reviews}" style="border:0"></item-stat>
  </item-stats>
</a>
</div>
`
  }
}

customElements.define('item-tile', ItemTile)
