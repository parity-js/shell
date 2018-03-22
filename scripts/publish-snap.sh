#!/bin/bash

set -e # fail on any error
set -u # treat unset variables as error

case ${CI_COMMIT_REF_NAME} in
  master|*v1.11*|next) export CHANNEL="edge";;
  beta|*v1.10*) export CHANNEL="beta";;
  stable|*v0.1*|ci-package) export CHANNEL="stable";;
  *) echo "No release" exit 0;;
esac
echo "Release channel :" $CHANNEL " Branch/tag: " $CI_COMMIT_REF_NAME

echo $SNAPCRAFT_LOGIN_PARITY_BASE64 | base64 --decode > exported
snapcraft login --with exported
snapcraft push --release $CHANNEL "dist/parity-ui_"$VERSION"_"$BUILD_ARCH".snap" >> push.log
cat push.log
REVISION="$(grep -m 1 "Revision " push.log | awk '{print $2}')"
snapcraft list-revisions --arch $BUILD_ARCH parity-ui
snapcraft status parity-ui
snapcraft logout
