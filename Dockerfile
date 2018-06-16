ARG NODE_IMAGE=node:10.1-alpine

FROM ${NODE_IMAGE} as nodebuild

# Generate node_modules.
WORKDIR /tmp
COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json
RUN apk --no-cache add python build-base && \
    npm install

################################################################################

FROM ${NODE_IMAGE}

WORKDIR /usr/src/app

# Copy application files.
COPY package.json /usr/src/app/package.json
COPY --from=nodebuild /tmp/node_modules /usr/src/app/node_modules
COPY client /usr/src/app/client
COPY server /usr/src/app/server
COPY shared /usr/src/app/shared

# Copy docker configuration file. This allows for specifying common configs with
# just environment variables.
COPY config.docker.js /usr/src/app/config.js

# Install runtime dependencies.
RUN apk --no-cache add \
       mediainfo \
    && \
    npm run build

# Hints for consumers of the container.
EXPOSE 3000
VOLUME ["/data"]

# Start application.
CMD [ "npm", "start" ]
