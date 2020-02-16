# archive.org evolving website - using only javascript static files (Project "Offshoot")

## live site / demo
https://internetarchive-www.dev.archive.org

## uses rendertron for SEO / crawlers

## working
- basic search
- playlist API ported PHP => JS
  - all A/V items working reasonably now
- other items currently look for 'original' imagery to display in theatre


## quickstart
- `git clone git@gitlab.com:internetarchive/www`
- `cd www  &&  yarn  &&  yarn serve`


## local/offline dev
- `yarn serve` is the typical way to run a local/minimal http file server at http://localhost:8888
- Other http servers do fine too, but need to send urls (that don't map to files) to `/index.html` (single page application)
- Alternatively, this `chrome extension` is convenient
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


## helpful links
- https://github.com/GoogleChrome/rendertron
- https://github.com/GoogleChrome/rendertron/tree/master/middleware
- https://medium.com/@abdelrhman.elgreatly/angular-single-page-app-seo-friendly-using-rendertron-24592fa731b6
- https://zeit.co/blog/serverless-chrome


## See differential loading - browser
Simply add `?render=1` CGI arg to force the rendertron path.

Compare these two urls (not in IE11):
- http://internetarchive-www.dev.archive.org/details/commute
- http://internetarchive-www.dev.archive.org/details/commute?render=1

## See differential loading - command line
Pass a user-agent header into `wget`/`curl` self-identifying with a crawler pattern.

Compare these two responses:
```bash
wget -qO- http://internetarchive-www.dev.archive.org/details/commute
wget -qO- http://internetarchive-www.dev.archive.org/details/commute --head='User-agent: Googlebot'
```

## Use rendertron inside webapp/container
```bash
wget -qO- localhost:3000/render/http://internetarchive-www.dev.archive.org/details/commute
```

## update copied `petabox/components/` subdirs
- these are mostly implicit dependencies due to `AJS` being tangled into most things, including the `play8.js` and A/V player ;-)
- `cd www/js  &&  for i in $(find . -maxdepth 1 -mindepth 1 -type d); do rsync -Pav /petabox/components/$i ./; done`

## xxx other stuff to consider?
- https://itnext.io/using-rendertron-in-kubernetes-for-spa-seo-39055567c745
- append to /render/ url `?wc-inject-shadydom=true` ?
- `resolver kube-dns.kube-system.svc.cluster.local valid=5s;`
- `proxy_pass http://$prerender.default.svc.cluster.local/render/$scheme://$host$request_uri?wc-inject-shadydom=true;`


