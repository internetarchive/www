#!/bin/zsh -e

mydir=${0:a:h}

cd $mydir/..
TOP=$(pwd)

find coverage -delete 2>/dev/null || echo ''

deno test -A --coverage=$TOP/coverage --unstable --location=https://archive.org --no-check --ignore=test.js "$@"

deno coverage coverage --exclude=no-exclusions --lcov >| coverage/lcov.lcov

lcov --derive-func-data                               -l coverage/lcov.lcov
