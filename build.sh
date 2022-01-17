#!/usr/bin/env bash

set -euo pipefail

COMMIT="d0a721dd61297a319f1847a0274accacf5a56f32"
PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g' \
  | tr -d '[[:space:]]')

cloneDst="pyroscope"

################
# Build Plugin #
################
rm -Rf dist/
rm -Rf "$cloneDst"

git clone https://github.com/pyroscope-io/pyroscope.git "$cloneDst"
git -C "$cloneDst" checkout "$COMMIT"



# https://github.com/typicode/husky/issues/851
# 'husky install' fails since there's no git
sed -i '/"prepare"/d' "$cloneDst/package.json"

# install dependencies
yarn --cwd "$cloneDst"


# build panel
export PYROSCOPE_PANEL_VERSION="$PACKAGE_VERSION"
yarn --cwd "$cloneDst" build:datasource

cp -r "$cloneDst/grafana-plugin/datasource/dist" dist

################
# Add metadata #
################
cp CHANGELOG.md dist/

