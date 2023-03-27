#!/usr/bin/env -S deno run --allow-net --allow-read --location=https://archive.org

import httpd from 'https://deno.land/x/httpd/mod.js'


// eslint-disable-next-line consistent-return
httpd((req, headers) => {
  if (new URL(req.url).pathname.startsWith('/details/'))
    return new Response(Deno.readTextFileSync('index.html'), { headers })
})
