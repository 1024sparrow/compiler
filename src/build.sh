#!/bin/bash

rm ../compile.js
node scripts/cc.js pro && rm -r ../compiled && chmod +x ../compile.js
