#!/bin/bash

# Build binaries with electron
if [ "$TRAVIS_BRANCH" == "ci-package" ]; then
  if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then npm run package; fi
  if [[ "$TRAVIS_OS_NAME" == "osx" ]]; then npm run package -- --mac --win; fi
fi
