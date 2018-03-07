#!/bin/bash

BRANCH=$CI_BUILD_REF_NAME

# Build binaries with electron
if [ "$BRANCH" == "next" ]; then
  if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then npm run package; fi
  if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then npm run package -- --mac --win; fi
fi
