FROM debian:jessie

RUN useradd --create-home user

RUN apt-get update && apt-get install -yq curl rtorrent supervisor vim net-tools

RUN curl -sL https://deb.nodesource.com/setup_4.x | bash - && \
  apt-get install -yq nodejs rtorrent supervisor && \
  npm install -g npm@latest && \
  apt-get clean && \
  rm -rf /tmp/* /var/lib/apt/lists/* /var/tmp/*

RUN mkdir /home/user/flood
COPY . /home/user/flood
COPY config.template.js /home/user/flood/config.js
RUN cd /home/user/flood && npm install && ./node_modules/.bin/gulp dist

COPY supervisord.conf /etc/supervisor/conf.d/
COPY rtorrent.rc /home/user/.rtorrent.rc

RUN mkdir -p /folder/.session /folder/files /folder/torrents \
  && touch /folder/.rtorrent.rc \
  && chown -R user:user /home/user /folder

VOLUME /folder
EXPOSE 3000

CMD ["supervisord"]