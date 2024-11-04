import { Router } from 'https://esm.archive.org/@vaadin/router@^1'

import MDAPI from './mdapi.js'
import { log } from './util/log.js'


const routeFN = (mdapi = null, type = null) => {
  // looks at page url and route to this div top-level web component
  log({ mdapi, type })

  const routes = []
  if (type !== 'collection') {
    routes.push({
      path: '/details/:id',
      component: 'details-page',
      bundle: { module: '../js/details-page.js' }, // xxx pass mdapi to details-page and set/leverage other 'type's
      action: (ctx) => {
        // avoid SPA not actually making a page change in the nav, fix reload issues, etc.
        if (globalThis.location.pathname !== ctx.pathname)
          globalThis.location.pathname = ctx.pathname
      },
    })
  }

  routes.push({
    path: '(.*)',
    component: 'search-page',
    bundle: { module: '../js/search-page.js' },
    action: (ctx) => {
      // avoid SPA not actually making a page change in the nav, fix reload issues, etc.
      if (globalThis.location.pathname !== ctx.pathname)
        globalThis.location.pathname = ctx.pathname
    },
  })

  new Router(document.getElementById('outlet')).setRoutes(routes)
}


async function main() {
  // see if we're a /details/ page url -- because we need to MDAPI fetch _first_ before we know
  // exactly where we should route to
  const id = (location.pathname.match(/^\/details\/([^&?/]+)/) || ['', ''])[1]
  if (id !== '') {
    const mdapi = await MDAPI(id)
    const type = (mdapi.metadata.mediatype === 'collection' ? 'collection' : 'item')
    routeFN(mdapi, type)
  } else {
    // not /details/ page
    routeFN()
  }
}

// eslint-disable-next-line
void main()
