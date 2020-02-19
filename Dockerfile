# Start with 'nginx' docker image (debian OS) - builds out to ~281MB.
# We use 'nginx' instead of 'node' because we need nginx > 1.16.1 for http2 CVE fix
FROM nginx
# ^^ 126MB

# xxx utf8/locales..
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get -yqq update  && \
    apt-get -yqq --no-install-recommends install $(echo ' \
# for sanity:
procps \
zsh \
\
# for inflated /tmp/chromium binary: \
libnspr4 \
libnss3 \
\
# for yarn: \
ca-certificates \
gnupg \
wget \
' |fgrep -v '#')  && \
    wget -qO- https://dl.yarnpkg.com/debian/pubkey.gpg |apt-key add -  && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" |tee /etc/apt/sources.list.d/yarn.list  && \
    apt-get -yqq update  && \
    apt-get -yqq --no-install-recommends install yarn nodejs
# ^^ 204MB


# to save nearly 500MB, we're going to download a massively compressed/optimized chromium instead...
ENV  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true


# Bleah, skip 100MB of _dependencies_ when we just need the JS for this one pkg. 🦀
# Use `yarn cache dir` to find cache dir to wipe.
WORKDIR /tmp
RUN  yarn add rendertron  &&  \
     mv node_modules/rendertron .  &&  \
     find node_modules -delete  &&  \
     find /usr/local/share/.cache/yarn -delete


COPY .   /app
WORKDIR  /app


RUN yarn  &&  cd docker  &&  yarn  &&  find /usr/local/share/.cache/yarn -delete
# ^^ 349MB (60MB just for eslint)


# NOW slide in our chromium version instead
RUN ln -s /app/node_modules/puppeteer-core  /app/node_modules/puppeteer  &&  \
    mv /tmp/rendertron  /app/node_modules/rendertron  &&  \
    sed -i 's=puppeteer.launch({=puppeteer.launch({executablePath:"/tmp/chromium",=' \
      /app/node_modules/rendertron/build/rendertron.js


RUN rm -rfv          /usr/share/nginx/html  &&  \
    ln -s  /app/www  /usr/share/nginx/html  &&  \
    sed -i 's/user  nginx/user  www-data/'  /etc/nginx/nginx.conf  &&  \
    for i in $(find etc -type f); do set -x; ln -sf /app/$i /$i; set +x; done  &&  \
    ln -s  /app/docker/zshrc         /root/.zshrc  &&  \
    ln -s  /app/docker/aliases       /root/.aliases

CMD [ "/app/docker/superv" ]
# ^^ 349MB
