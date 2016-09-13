FROM xataz/node:4.5
MAINTAINER xataz <https://github.com/xataz>

ENV UID=991 \
    GID=991 \
    RTORRENT_HOST=torrent \
    RTORRENT_PORT=5000 \
    RTORRENT_SOCKET=false \
    RTORRENT_SOCKET_PATH=/tmp/rtorrent.sock \
    FLOOD_SECRET=flood \
    FLOOD_START=production

LABEL description="flood nodejs alternative to rutorrent" 

COPY . /usr/app/src

RUN BUILD_DEPS="make gcc g++ python linux-headers" \
    && apk add -U ${BUILD_DEPS} \
    && cd /usr/app/src \
    && npm run preinstall \
    && npm install \
    && apk del ${BUILD_DEPS} \
    && rm -rf /var/cache/apk/*

COPY startup /usr/local/bin/startup
RUN chmod +x /usr/local/bin/startup

VOLUME /usr/app/src/server/db
WORKDIR /usr/app/src

ENTRYPOINT ["tini", "--"]
CMD ["startup"]