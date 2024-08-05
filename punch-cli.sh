#!/bin/bash

set -e

COMMAND=$1
APP_NAME=$2
shift 2

OPTIONS="$@"

if [ "$COMMAND" = "create-app" ]; then
  node punch-cli.js create-app "$APP_NAME" $OPTIONS
elif [ "$COMMAND" = "create-service" ]; then
  node punch-cli.js create-service "$APP_NAME" $OPTIONS
elif [ "$COMMAND" = "list" ]; then
  node punch-cli.js list
elif [ "$COMMAND" = "remove" ]; then
  node punch-cli.js remove "$APP_NAME"
else
  echo "Unknown command: $COMMAND"
  exit 1
fi
