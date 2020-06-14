
/* eslint-disable semi */
import { LitElement, html, css } from '../build/lit-element.js'

// eslint-disable-next-line import/prefer-default-export
export class ManageItems extends LitElement {
  static get properties() {
    return {
      str: { type: String },
    }
  }

  constructor() {
    super()
    this.str = ''
  }

  static get styles() {
    return css``
  }

  render() {
    return html`${this.str}`
  }
}

customElements.define('manage-items', ManageItems)
