FROM node:alpine

# xxx utf8/locales..
ENV DEBIAN_FRONTEND=noninteractive

# for sanity:
RUN apk add  procps  zsh  wget

COPY .   /app
WORKDIR  /app

RUN npm i  &&  npm run postinstall  &&  npm cache clean --force


RUN rm -rfv          /usr/share/nginx/html  &&  \
    ln -s  /app/www  /usr/share/nginx/html  &&  \
    sed -i 's/user  nginx/user  www-data/'  /etc/nginx/nginx.conf  &&  \
    for i in $(find etc -type f); do set -x; ln -sf /app/$i /$i; set +x; done  &&  \
    ln -s  /app/docker/zshrc         /root/.zshrc  &&  \
    ln -s  /app/docker/aliases       /root/.aliases

CMD [ "nginx", "-g", "'daemon off;'" ]
