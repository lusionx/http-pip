#/bin/sh

VERSION=0.0.0
[ -n "$1" ] && VERSION=$1

sed -i "" "s/1.0.0/${VERSION}/" k8s/package.json
docker build -f k8s/Dockerfile -t hub.docker.admaster.co/tuice/hpip-jwt:${VERSION} .
git checkout k8s/package.json

# docker push hub.docker.admaster.co/tuice/tspp-egg:${VERSION}
