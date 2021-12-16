FROM denoland/deno:alpine

# `coreutils` for `env -S`;  `lcov` for CI [test] coverage
RUN apk add zsh coreutils lcov

WORKDIR /app
COPY . .

USER deno
CMD ./httpd.js -p 5000 --cors www
