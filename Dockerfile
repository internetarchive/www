FROM denoland/deno:alpine

# `coreutils` for `env -S`
RUN apk add zsh coreutils  && \

WORKDIR /app
COPY . .

USER deno
CMD ./httpd.js -p 5000 --cors www
