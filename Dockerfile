# Start with 'nginx' docker image (debian OS) - builds out to ~281MB.
# We use 'nginx' instead of 'node' because we need nginx > 1.16.1 for http2 CVE fix
# (node:buster-slim also has http2 CVE fixes in)
FROM nginx
# ^^ 126MB

# xxx utf8/locales..
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get -yqq update  && \
    apt-get -yqq --no-install-recommends install $(echo ' \
# for sanity:
procps \
zsh \
wget \
\
# for inflated /tmp/chromium binary: \
libnspr4 \
libnss3 \
\
# for https: \
ca-certificates \
' |fgrep -v '#')  && \
    wget -qO- https://deb.nodesource.com/setup_13.x |bash -  && \
    apt-get -yqq --no-install-recommends install nodejs  && \
    npm cache clean --force
# ^^ 170MB before node/npm setup
# ^^ 206MB before node/npm install
# ^^ 309MB after  node/npm install


# to save nearly 500MB, we're going to download a massively compressed/optimized chromium instead...
ENV  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


# Bleah, skip 100MB of _dependencies_ when we just need the JS for this one pkg. 🦀
WORKDIR /tmp
RUN  npm i rendertron  &&  \
     mv node_modules/rendertron .  &&  \
     find node_modules -delete  &&  \
     npm cache clean --force


COPY .   /app
WORKDIR  /app
# ^^ 320MB

RUN npm i  &&  npm run postinstall  &&  cd docker  &&  npm i  &&  npm cache clean --force


# NOW slide in our chromium version instead
RUN ln -s /app/node_modules/puppeteer-core  /app/node_modules/puppeteer  &&  \
    mv /tmp/rendertron  /app/node_modules/rendertron  &&  \
    sed -i 's=puppeteer.launch({=puppeteer.launch({executablePath:"/tmp/chromium",=' \
      /app/node_modules/rendertron/build/rendertron.js
# ^^ 374MB


RUN rm -rfv          /usr/share/nginx/html  &&  \
    ln -s  /app/www  /usr/share/nginx/html  &&  \
    sed -i 's/user  nginx/user  www-data/'  /etc/nginx/nginx.conf  &&  \
    for i in $(find etc -type f); do set -x; ln -sf /app/$i /$i; set +x; done  &&  \
    ln -s  /app/docker/zshrc         /root/.zshrc  &&  \
    ln -s  /app/docker/aliases       /root/.aliases

CMD [ "/app/docker/superv" ]
# NOTE: was 268MB Feb25, 2020
# ^^ 369MB
