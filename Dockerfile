FROM denoland/deno:alpine

# `coreutils` for `env -S`
RUN apk add zsh coreutils  && \
    # `lcov` for CI [test] coverage
    apk add --no-cache -X http://dl-cdn.alpinelinux.org/alpine/edge/testing  lcov

WORKDIR /app
COPY . .

USER deno
CMD ./httpd.js -p 5000 --cors www
