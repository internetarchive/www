#!/bin/zsh -e

# gets a bunch of item MDAPI JSON - esp. for offline testing

mydir=${0:a:h}
cd $mydir/..

[ -e /.dockerenv ]  &&  exit 0  # don't need to run this in CI/CD and don't need in production

mkdir -p www/json

for ID in \
  commute  gd77-05-08.sbd.hicks.4982.sbeok.shnf  AboutBan1935   goodytwoshoes00newyiala  \
  movies  audio  software  image  texts  tv  etree  \
  prelinger  librivoxaudio  internetarcade  poohBot  \
  fav-tracey_pooh  @brewster
do
  FI=www/json/$ID.json
  [ -e $FI ]  ||  (
    echo fetching metadata/$ID
    wget -qO- https://archive.org/metadata/$ID | (jq . || cat) >| $FI
  )
done


# now get all the identifiers (in www/json/) search results basic info -
# so we can show all the item tiles in a faked offline search results page

Q="identifier:commute"
for ID in $(cd www/json; /bin/ls *.json |fgrep -v search.json |perl -pe 's/\.json$//')
do
  Q="identifier:$ID OR $Q"
done

set -x
wget -qO- "https://archive.org/advancedsearch.php?output=json&fl[]=identifier&fl[]=title&fl[]=downloads&fl[]=collection&fl[]=mediatype&fl[]=creator&fl[]=num_reviews&q=$Q" | (jq . || cat) >| www/json/search.json
