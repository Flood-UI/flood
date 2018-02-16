FROM node:7.8.0-alpine as nodebuild

# Generate node_modules.
WORKDIR /tmp
COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN apk --no-cache add python build-base
RUN npm install

# bcrypt needs to be rebuilt for musl
RUN npm rebuild bcrypt --build-from-source

################################################################################
FROM node:7.8.0-alpine

# Install runtime dependencies.
RUN apk --no-cache \
       --repository http://dl-cdn.alpinelinux.org/alpine/v3.7/community \
       add mediainfo

# Create app working directory.
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copy application files.
COPY package.json /usr/src/app/package.json
COPY --from=nodebuild /tmp/node_modules /usr/src/app/node_modules
COPY client /usr/src/app/client
COPY server /usr/src/app/server
copy shared /usr/src/app/shared

# Copy docker configuration file. This allows for specifying common configs with
# just environment variables.
COPY config.docker.js /usr/src/app/config.js

# Build static assets.
RUN npm run build

# Hints for consumers of the container.
EXPOSE 3000
VOLUME ["/data"]

# Start application.
CMD [ "npm", "start" ]
