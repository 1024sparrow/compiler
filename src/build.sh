#!/bin/bash

tmp=$(dirname "$0")
pushd "$tmp" > /dev/null

rm ../compile.js
node scripts/cc.js pro &&  chmod +x ../compile.js

popd > /dev/null
