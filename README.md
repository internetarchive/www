# archive.org website prototype - using only javascript static files

## live site / demo
https://internetarchive-www.dev.archive.org


## quickstart
```
git clone git@gitlab.com:internetarchive/www
```


## local/offline dev
```./httpd.js -p 5000 --cors www```
will run a local/minimal http file server at http://localhost:5000

## offline with preseeded items
```
./get-mdapi-json.sh
```
- run `httpd.js` like above
- load the main page (and any mediatype example items you might want to work on from the list above)
  - that will pull down remote `https://esm.archive.org/` (and similar) files that are `import`-ed
- soft reload pages during offline dev (ie: dont `hard reload` / clear your browser cache :-)
- `zsh` and `jq` (for preseeding a selection of offline mode items)


## working
- basic search
- playlist API ported PHP => JS
  - all A/V items working reasonably now
- other items currently look for 'original' imagery to display in theatre
