#!/bin/bash

set -e # fail on any error
set -u # treat unset variables as error

cd dist/
cp Parity\ UI-$VER.pkg Parity-UI.pkg
echo "__________Sign Package__________"
productsign --sign 'Developer ID Installer: PARITY TECHNOLOGIES LIMITED (P2PX3JU8FT)' Parity-UI.pkg Parity-UI-signed.pkg
mv Parity-UI-signed.pkg "parity-ui_"$VERSION"_macos_x86_64.pkg"

echo "_____ Calculating checksums _____"
rhash --md5 "parity_"$VERSION"_macos_x86_64.pkg" >> "parity_"$VERSION"_macos_x86_64.pkg.md5"
rhash --sha256 "parity_"$VERSION"_macos_x86_64.pkg" >> "parity_"$VERSION"_macos_x86_64.pkg.sha256"
