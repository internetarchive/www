#!/bin/zsh -e

mydir=${0:a:h}

cd $mydir/..
AVHO=$(pwd)

find coverage -delete 2>/dev/null || echo ''

deno test -A --coverage=$AVHO/coverage --unstable --location=https://archive.org --no-check --ignore=test.js "$@"

deno coverage coverage --exclude=no-exclusions --lcov >| coverage/lcov.lcov

lcov --derive-func-data                               -l coverage/lcov.lcov
