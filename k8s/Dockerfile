FROM node:10.15-alpine
# 根正式 可以访问https
RUN apk --no-cache add ca-certificates
# fix /etc/hosts 失效
RUN echo "hosts: files dns" > /etc/nsswitch.conf

WORKDIR /srv/

# ADD node_modules /srv/node_modules
RUN npm --registry=https://registry.npm.taobao.org install tv4@1.3 axios@0.18

COPY *.js /srv/
COPY config*json /srv/
COPY k8s/package.json /srv/
