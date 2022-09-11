#!/usr/bin/env -S deno run --allow-net --allow-read --location=https://archive.org

// import a deno std. minimal webserver capable of static file serving, that's been lightly modified
// to _also_ be able to run JS code (since we need to handle /details/IDENTIFIER urls/paths).
import main from 'https://deno.land/x/file_server_plus/mod.ts'

import { warn } from './www/js/util/log.js'

// the static server will call this if it was about to otherwise 404
// eslint-disable-next-line no-undef
globalThis.finalHandler = (req) => {
  const headers = new Headers()
  headers.append('content-type', 'text/html')

  try {
    const parsed = new URL(req.url)

    // main website /details/IDENTIFIER logical rewrite
    if (parsed.pathname.startsWith('/details/')) {
      // main website
      return Promise.resolve(new Response(
        Deno.readTextFileSync('./www/index.html'),
        { status: 200, headers },
      ))
    }
  } catch (error) {
    warn({ error })
    return Promise.resolve(new Response(
      `Server Error: ${error.message}`,
      { status: 500, headers },
    ))
  }

  headers.append('content-type', 'text/html')
  return Promise.resolve(new Response(
    '<center><br><br><br><img src="/img/deno.png"><br><br><br>Not Found</center>',
    { status: 404, headers },
  ))
}

main()
