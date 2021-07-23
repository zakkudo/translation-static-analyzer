#!/bin/sh

set -e

export NODE_ENV="document"

CURRENT_DIR=$(pwd)
PROJECT_DIR=$(git rev-parse --show-toplevel)
BIN_DIR=$(npm bin)
TYPEDOC="$BIN_DIR/typedoc"

cd $PROJECT_DIR

$TYPEDOC --out documentation src --exclude "**/*test.ts" --excludeInternal
cp src/README.md documentation

./node_modules/.bin/concat-md --toc --decrease-title-levels --file-name-as-title --dir-name-as-title documentation > README.md
