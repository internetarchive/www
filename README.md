# JS-based archive.org web components prototype

## live site / demo
https://www-www.dev.archive.org

## uses rendertron for SEO / crawlers

## working
- basic search
- playlist API ported PHP => JS
  - all A/V items working reasonably now
- other items currently look for 'original' imagery to display in theatre


## quickstart
- `git clone git@git.archive.org:www/www`
- `cd www  &&  yarn  &&  yarn serve`


## local/offline dev
- `yarn serve` is the typical way to run a local/minimal http file server at http://localhost:8888
- Alternatively, this `chrome extension` seems really nice
  - https://chrome.google.com/webstore/detail/web-server-for-chrome/ofhbbkphhbklhfoeikjpcbhemlocgigb
  - serves files on http://localhost:8888 including usable MIME types and avoids CORS issues with ES Modules
  - allows for single regexp rewrite (eg: /details/ => /index.html)
  - ... umm.... and **it serves in safari/firefox/cmd-line, too** (!)
  - suggested options:
    - [CHOOSE FOLDER] => `$HOME/dev/www/www` (ie: subdir `www` of repo - wherever you cloned to)
    - [✅] Run in background
    - [✅] Start on login
    - Enter Port [8888] (easier to remember than 8887 - YMMV)
    - [✅] Enable mod-rewrite (for SPA)
      - Regular Expression: `\.(css|gif|ico|js|json|map|md|png|txt)$`
      - [✅] Negate Regexp
      - Rewrite To: /index.html
- Other simple http servers do fine too, but you need something to auto-map urls starting with `/details/..` to `/index.html` (like the above extension does), eg:
-   - maybe some way to run auto-rewrites for these or similar:
-   - `python3 -m http.server --cgi 8888`
-   - `ruby -run -e httpd . -p 8888`


## some sample items
- [commute](http://www-www.dev.archive.org/details/commute)
- [stairs](http://www-www.dev.archive.org/details/stairs)
- [ellepurr](http://www-www.dev.archive.org/details/elleurr)
- [gd77-05-08.sbd.hicks.4982.sbeok.shnf](http://www-www.dev.archive.org/details/gd77-05-08.sbd.hicks.4982.sbeok.shnf)
- [Sita_Sings_the_Blues](http://www-www.dev.archive.org/details/Sita_Sings_the_Blues)

## helpful links
- https://github.com/GoogleChrome/rendertron
- https://github.com/GoogleChrome/rendertron/tree/master/middleware
- https://medium.com/@abdelrhman.elgreatly/angular-single-page-app-seo-friendly-using-rendertron-24592fa731b6
- https://zeit.co/blog/serverless-chrome


## See differential loading - browser
Simply add `?render=1` CGI arg to force the rendertron path.

Compare these two urls (not in IE11):
- http://www-www.dev.archive.org/details/commute
- http://www-www.dev.archive.org/details/commute?render=1

## See differential loading - command line
Pass a user-agent header into `wget`/`curl` self-identifying with a crawler pattern.

Compare these two responses:
```bash
wget -qO- http://www-www.dev.archive.org/details/commute
wget -qO- http://www-www.dev.archive.org/details/commute --head='User-agent: Googlebot'
```

## Use rendertron inside webapp/container
```bash
wget -qO- localhost:3000/render/http://archive.org/details/commute
```

## update copied `petabox/components/` subdirs
- these are mostly implicit dependencies due to `AJS` being tangled into most things, including the `play8.js` and A/V player ;-)
- `cd www/js  &&  for i in $(find . -maxdepth 1 -mindepth 1 -type d); do rsync -Pav /petabox/components/$i ./; done`

## xxx other stuff to consider?
- https://itnext.io/using-rendertron-in-kubernetes-for-spa-seo-39055567c745
- append to /render/ url `?wc-inject-shadydom=true` ?
- `resolver kube-dns.kube-system.svc.cluster.local valid=5s;`
- `proxy_pass http://$prerender.default.svc.cluster.local/render/$scheme://$host$request_uri?wc-inject-shadydom=true;`


