ARG NODE_IMAGE=node:12.11-alpine
ARG WORKDIR=/usr/src/app/

FROM ${NODE_IMAGE} as nodebuild
ARG WORKDIR

ARG FLOOD_BASE_URI=/
ENV FLOOD_BASE_URI $FLOOD_BASE_URI

WORKDIR $WORKDIR

# Generate node_modules
COPY package.json \
    package-lock.json \
    .babelrc \
    .eslintrc.js \
    .eslintignore \
    .prettierrc \
    ABOUT.md \
    $WORKDIR

RUN apk add --no-cache --virtual=build-dependencies \
    python build-base && \
    npm install && \
    apk del --purge build-dependencies

# Build static assets and remove devDependencies.
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY scripts ./scripts
COPY config.docker.js ./config.js
RUN npm run build && \
    npm prune --production

# Now get the clean image without any dependencies and copy compiled app
FROM ${NODE_IMAGE} as flood
ARG WORKDIR

WORKDIR $WORKDIR

# Install runtime dependencies.
RUN apk --no-cache add \
    mediainfo

# Add user to run the application
RUN addgroup -S flood
RUN adduser -S flood -G flood
RUN mkdir /data
RUN chown flood:flood /data

USER flood

COPY --from=nodebuild --chown=flood:flood $WORKDIR $WORKDIR

# Hints for consumers of the container.
EXPOSE 3000 
VOLUME ["/data"]

# Start application.
CMD [ "npm", "start" ]
