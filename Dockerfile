FROM node:alpine

# xxx utf8/locales..
ENV DEBIAN_FRONTEND=noninteractive

RUN apk add  \
    # needs:
    nginx  zsh  \
    # for sanity:
    procps  wget

COPY .   /app
WORKDIR  /app

RUN npm i  &&  npm run postinstall  &&  npm cache clean --force


RUN for i in $(find etc -type f); do ( set -x; ln -sf /app/$i /$i ); done  &&  \
    ln -s  /app/docker/zshrc     /root/.zshrc  &&  \
    ln -s  /app/docker/aliases   /root/.aliases  \
    # bizarre missing subdir from nginx pkg:
    mkdir -m777 /run/nginx

CMD [ "/usr/sbin/nginx", "-g", "'daemon off;'" ]
