FROM denoland/deno:alpine

# `coreutils` for `env -S`
RUN apk add zsh coreutils

WORKDIR /app
COPY . .

USER deno
RUN deno cache ../httpd.js
CMD cd www  && ../httpd.js
