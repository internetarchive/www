# archive.org website prototype - using only javascript static files

## live site / demo
https://internetarchive-www.dev.archive.org


## quickstart
- `git clone git@gitlab.com:internetarchive/www`
- `cd www  &&  npm i  &&  npm run serve`


## requirements
- `zsh` and `jq` (for preseeding a selection of offline mode items)


## local/offline dev
- `npm run serve` is the typical way to run a local/minimal http file server at http://localhost:8888
- Other http servers do fine too, but need to send urls (that don't map to files) to `/index.html` (single page application)


## working
- basic search
- playlist API ported PHP => JS
  - all A/V items working reasonably now
- other items currently look for 'original' imagery to display in theatre
