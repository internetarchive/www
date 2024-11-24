import { LitElement, html, css } from 'https://esm.archive.org/lit'

customElements.define('blank-blank', class BlankBlank extends LitElement {
  static get properties() {
    return {
      str: { type: String },
    }
  }

  constructor() {
    super()
    this.str = '[blank]'
  }

  static get styles() {
    return css`
  `
  }

  render() {
    return html`
<div>${this.str}</div>
    `
  }
})
