# archive.org website prototype - using only javascript static files

## live site / demo
https://archive-www.netlify.app


leverages native `web components` and lightweight `lit` helper

## Quickstart
```
git clone git@github.com:internetarchive/www
```


## Local/offline dev
```sh
./httpd.js -p5555
```
will run a local/minimal http file server at http://localhost:5555

## Offline with preseeded items
```sh
./get-mdapi-json.sh
```
- run `httpd.js` like above
- load the main page (and any mediatype example items you might want to work on from the list above)
  - that will pull down remote `https://esm.ext.archive.org/` (and similar) files that are `import`-ed
- soft reload pages during offline dev (ie: dont `hard reload` / clear your browser cache :-)
- requires: `zsh` and `jq` (for preseeding a selection of offline mode items)


## Currently working
- basic search
- playlist API ported PHP => JS
  - all A/V items working reasonably now
- other items currently look for 'original' imagery to display in theatre
