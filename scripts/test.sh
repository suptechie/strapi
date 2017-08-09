#!/bin/sh
set -e

if [ -z "$TEST_GREP" ]; then
   TEST_GREP=""
fi

node node_modules/mocha/bin/_mocha `scripts/_get-test-directories.sh` --opts test/mocha.opts --grep "$TEST_GREP"

# Test `strapi-admin`
cd packages/strapi-admin
npm run test

# Test `strapi-plugin-settings-manager`
cd ../strapi-plugin-settings-manager
npm run test
