import { LitElement, html, css } from 'https://esm.archive.org/lit'

import './play8/play8.js'
import Player from  './player.js'
import { log } from './util/log.js'
import ios from './util/ios.js'


/* eslint-disable-next-line import/prefer-default-export */
export class DetailsPage extends LitElement {
  constructor() {
    super()
    this.mdapi = null
  }

  /**
   * Handles vaadin router lifecycle event, where /details/id got parsed for us
   *
   * @see https://vaadin.github.io/vaadin-router/vaadin-router/demo/#vaadin-router-lifecycle-callbacks-demos
   *
   * @param {object} location
   */
  onAfterEnter(location) {
    const { id } = location.params
    if (id === undefined)
      return

    this.id = id

    // Setup a <slot> outside of shadow DOM (into light DOM) since `<div id="jw6">` is needed
    // by jwplayer to be in (light) DOM
    const rootTextEl = document.createElement('div')
    rootTextEl.setAttribute('id', 'jw6')
    this.appendChild(rootTextEl) // NOTE: `this` === custom element root
  }


  static get properties() {
    return {
      id: { type: String },
      mdapi: { type: Array },
    }
  }

  static get styles() {
    return css`
#theatre-ia-wrap {
  background-color: black;
  min-height: 75vh;
}
#theatre-ia {
  margin: auto;
}
#jw6 {
  margin: 0 auto;
}
.width-max {
  width: 100% !important;
  margin: 0 !important;
  max-width: initial;
}


#metadata {
  max-width: 800px;
  margin: 25px auto;
}

table {
  margin-top: 25px;
}
`
  }

  async updated(props) {
    if (props.has('id')) {
      this.mdapi = await this.mdapi_xhr()

      const player = new Player(this.mdapi)

      // log(this.shadowRoot.getElementById('jw6'))
      if (player.showing === 'movies'  ||  player.showing === 'audio') {
        // const config = { height: document.getElementById('theatre-ia').clientHeight }
        const config = { // xxx
          audio: player.showing === 'audio',
          responsive: true, //        => (!$this->embed  &&  !$this->oneday), // xxx
          identifier: this.id,
          collection: this.mdapi.metadata.collection,
        }
        const poster = []
        const playlist = player.jwplaylist(config, ios, poster)
        log(playlist)

        if (player.showing === 'audio') {
          const body = document.getElementsByTagName('body')[0]
          body.setAttribute('class', `${body.getAttribute('class')} jwaudio`)

          if (config) // xxx !$this->embed  &&  poster.length)
            config.waveformer = 'jw-holder'
        }

        // add in IA-specific CSS overrides and additions to stock jwplayer
        const link  = document.createElement('link')
        link.rel  = 'stylesheet'
        link.type = 'text/css'
        link.href = '/css/av-player.css?v=1'
        document.getElementsByTagName('head')[0].appendChild(link)

        setTimeout(() => globalThis.Play('jw6', playlist, config), 1000) // xxx embarassing ;)
      } else {
        this.mdapi.files.forEach((fi) => {
          // sigh use slot since this.shadowRoot.getElementById('theatre-ia') stopped working :(
          const theatre = document.getElementById('jw6')
          if (!theatre || theatre.innerHTML.trim() !== '')
            return

          for (const kind of ['derivative', 'original']) {
            if (fi.name.match(/\.(jpg|png|gif)$/i)  &&  fi.source === kind) {
              theatre.innerHTML =
                `<img style="max-width:100%; height: 75vh; display:block; margin:auto;"
                  src="https://archive.org/download/${this.id}/${fi.name}"/>`
              break
            }
          }
        })
      }
    }
  }

  async mdapi_xhr() {
    this.mdapi = null

    const url = `https://archive.org/metadata/${this.id}`

    const response = await fetch(globalThis.navigator.onLine === false
      ? `http://localhost:5555/json/${this.id}.json`
      : url)
    return response.json()
  }


  render() {
    // log(this.mdapi)
    if (this.mdapi === null)
      return html`<div style="font-style:italic"><center>fetching...</center></div>`

    const collex = (typeof this.mdapi.metadata.collection === 'string'
      ? [this.mdapi.metadata.collection]
      : this.mdapi.metadata.collection
    )


    return html`
<script src="https://archive.org/jw/8/jwplayer.js"></script>

<link href="https://esm.archive.org/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" type="text/css"/>

<div class="container container-ia"></div>
<div id="theatre-ia-wrap" class="container container-ia width-max">
  <div id="theatre-ia">
    <slot></slot>
  </div>
</div>
<div id="metadata">
  <h1>
    ${this.mdapi.metadata.title}
  </h1>
  <div>
    ${this.mdapi.metadata.description}
  </div>
  <table>


    ${Object.values(collex).map(
    (val) => DetailsPage.keyval('collection', html`<a href="/details/${val}">${val}</a>`),
  )}

    ${Object.keys(this.mdapi.metadata).map((k) => {
    if (['description', 'title', 'identifier', 'backup_location', 'uploader', 'collection'].indexOf(k) >= 0)
      return ''

    return DetailsPage.keyval(k, this.mdapi.metadata[k])
  })}
  </table>
</div>`
  }

  static keyval(key, val) {
    return html`
<tr>
  <td>
    <b>${key}</b>
  </td>
  <td>
    ${val}
  </td>
</tr>`
  }
}

customElements.define('details-page', DetailsPage)
