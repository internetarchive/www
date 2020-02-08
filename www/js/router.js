/* eslint-disable semi */

import { Router } from './build/@vaadin/router.js'
import MDAPI from './mdapi.js'
import log from './util/log.js'


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
        if (window.location.pathname !== ctx.pathname)
          window.location.pathname = ctx.pathname
      },
    })
  }

  routes.push({
    path: '(.*)',
    component: 'search-page',
    bundle: { module: '../js/search-page.js' },
    action: (ctx) => {
      // avoid SPA not actually making a page change in the nav, fix reload issues, etc.
      if (window.location.pathname !== ctx.pathname)
        window.location.pathname = ctx.pathname
    },
  })

  new Router(document.getElementById('outlet')).setRoutes(routes)
}


// see if we're a /details/ page url -- because we need to MDAPI fetch _first_ before we know
// exactly where we should route to
const id = (location.pathname.match(/^\/details\/([^&?/]+)/) || ['', ''])[1]
if (id !== '') {
  // eslint-disable-next-line no-new
  new MDAPI(id, routeFN)
} else {
  // not /details/ page
  routeFN()
}
