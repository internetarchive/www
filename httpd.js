#!/usr/bin/env -S deno run --allow-net --allow-read --location=https://archive.org

import main from 'https://raw.githubusercontent.com/traceypooh/deno_std/main/http/file_server.ts'

import { warn } from './www/js/util/log.js'

async function handler(req) {
  const headers = new Headers()
  try {
    const parsed = new URL(req.url)

    // main website /details/IDENTIFIER logical rewrite
    if (parsed.pathname.startsWith('/details/')) {
      // main website
      const main_page = Deno.readTextFileSync('./www/index.html')
      headers.append('content-type', 'text/html')
      return Promise.resolve(new Response(
        main_page,
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

main(handler)
