FROM denoland/deno:alpine

# `coreutils` for `env -S`
RUN apk add zsh coreutils

WORKDIR /app
COPY . .

USER deno
CMD cd www && ../httpd.js
