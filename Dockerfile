FROM caddy:alpine

WORKDIR /usr/share/caddy/

# setup single `rewrite` rule in std. caddy config
RUN sed -i 's/file_server/file_server\n  rewrite \/details\/ index.html/' /etc/caddy/Caddyfile

RUN cat /etc/caddy/Caddyfile

COPY . .
