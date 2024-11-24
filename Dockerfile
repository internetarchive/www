FROM caddy:alpine

WORKDIR /usr/share/caddy/

# setup single `rewrite` rule in std. caddy config:
#   rewrite  /details/*  /index.html
RUN sed -i 's/file_server/file_server\n  rewrite \/details\/* \/index.html/' /etc/caddy/Caddyfile

COPY . .

# pick some non-root user that `caddy` will run as
USER ftp
