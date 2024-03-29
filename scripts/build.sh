#!/bin/sh

set -e
set -x

export NODE_ENV="build"

CURRENT_DIR=`pwd`
PROJECT_DIR=`git rev-parse --show-toplevel`

cd $PROJECT_DIR

./scripts/clean.sh
./scripts/document.sh

mkdir build

cp package.json build/package.json
cp README.md build/README.md

./node_modules/.bin/tsc --emitDeclarationOnly

./node_modules/.bin/babel src \
    --out-dir build \
    --extensions ".ts" \
    --source-maps inline \
    --ignore "src/**/test.ts" \
    --ignore "src/**/*.test.ts" \
    --verbose \
    "$@"

