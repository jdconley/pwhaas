FROM node:6.10-alpine
MAINTAINER JD Conley <jd.conley@gmail.com>

USER root
ENV HOME=/home/pwhaas

# Dependencies for building native components, and our user
# tini is used for proper node signal handling
RUN apk add --update --virtual .build-deps build-base python \
    && apk add --update tini \
    && adduser -u 1001 -D -h $HOME -s /bin/false pwhaas

# Put everything in the home dir and give our user ownership
COPY . $HOME
RUN chown -R pwhaas:pwhaas $HOME/*

# Build the app
# Temporarily pull in the dev dependencies to do the typescript build
USER pwhaas
WORKDIR $HOME
RUN npm install \
    && npm run prep \
    && npm run build \
    && rm -rf node-modules \
    && npm install --production \
    && npm cache clean

# Clean up the sources and build artifacts that aren't needed at runtime
USER root
RUN apk del .build-deps \
    && rm -rf /var/cache/apk/* \
    && rm -rf $HOME/src \
    && rm -rf $HOME/bin \
    && rm -f $HOME/tsconfig.json \
    && rm -f $HOME/tslint.json

# Open our port and start the app
EXPOSE 3000
USER pwhaas
ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "dist/bin/www" ]