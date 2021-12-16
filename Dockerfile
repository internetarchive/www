FROM denoland/deno:alpine

# needed for `env -S`
RUN apk add coreutils

WORKDIR /app
COPY . .

USER deno
CMD ./httpd.js -p 5000 --cors www
