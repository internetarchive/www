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


RUN for i in $(find etc -type f); do set -x; ln -sf /app/$i /$i; set +x; done  &&  \
    ln -s  /app/docker/zshrc         /root/.zshrc  &&  \
    ln -s  /app/docker/aliases       /root/.aliases

CMD [ "nginx", "-g", "'daemon off;'" ]
