FROM alpine:3.9.3
# 根正式 可以访问https
RUN apk --no-cache add ca-certificates
# fix /etc/hosts 失效
RUN echo "hosts: files dns" > /etc/nsswitch.conf

COPY jwt-srv /usr/local/bin/
EXPOSE 4011
