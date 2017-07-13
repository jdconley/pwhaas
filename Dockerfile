FROM node:6.11-alpine
MAINTAINER JD Conley <jd.conley@gmail.com>

USER root
ENV SERVICE_ROOT=/home/pwhaas

# Dependencies for building native components, and our user
# tini is used for proper node signal handling
RUN apk add --update --virtual .build-deps build-base python \
    && apk add --update tini \
    && adduser -u 1001 -D -h $SERVICE_ROOT -s /bin/false pwhaas

# Put everything in the home dir and give our user ownership
WORKDIR $SERVICE_ROOT
COPY package.json package.json

RUN npm install

COPY . $SERVICE_ROOT

# Build the app
# Temporarily pull in the dev dependencies to do the typescript build
RUN npm run prep \
    && rm -rf node_modules \
    && npm install --production \
    && npm cache clean \
    && apk del .build-deps \
    && rm -rf /var/cache/apk/* \
    && rm -rf $SERVICE_ROOT/src \
    && rm -rf $SERVICE_ROOT/bin \
    && rm -f $SERVICE_ROOT/tsconfig.json \
    && rm -f $SERVICE_ROOT/tslint.json \
    && chown -R pwhaas:pwhaas $SERVICE_ROOT

# Open our port and start the app
EXPOSE 3000
USER pwhaas
ENTRYPOINT ["/sbin/tini", "--"]
CMD [ "node", "dist/bin/www" ]