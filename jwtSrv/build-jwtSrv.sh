#/bin/sh

VERSION=0.0.0
[ -n "$1" ] && VERSION=$1

CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o jwt-srv main.go

docker build -t someone/jwt-srv:${VERSION} .
