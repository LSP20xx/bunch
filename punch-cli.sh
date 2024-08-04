#!/bin/bash

COMMAND=$1
NAME=$2
DEPLOY=false
REDUX=false
EXCLUDE=""
AUTHOR=""
LICENSE=""

# Check if --deploy, --redux, --exclude, --author, or --license arguments are passed
for arg in "$@"
do
  if [ "$arg" == "--deploy" ] || [ "$arg" == "--d" ]; then
    DEPLOY=true
  fi
  if [ "$arg" == "--redux" ] || [ "$arg" == "--r" ]; then
    REDUX=true
  fi
  if [[ "$arg" == --exclude=* ]]; then
    EXCLUDE="${arg#*=}"
  fi
  if [[ "$arg" == --author=* ]]; then
    AUTHOR="${arg#*=}"
  fi
  if [[ "$arg" == --license=* ]]; then
    LICENSE="${arg#*=}"
  fi
done

if [ "$COMMAND" == "create-app" ]; then
  if [ -z "$NAME" ]; then
    echo "Usage: $0 create-app <app-name> [--deploy | --d] [--redux | --r] [--exclude=component1,component2] [--author=author] [--license=license]"
    exit 1
  fi

  # Create the new application using the CLI
  echo "Creating the application $NAME..."
  node punch-cli.js create-app $NAME --exclude $EXCLUDE --author $AUTHOR --license $LICENSE

  if [ "$DEPLOY" = true ]; then
    echo "Deploying the application $NAME..."
    docker-compose up -d
    echo "Application $NAME created and deployed successfully."
  else
    echo "Application $NAME created successfully without deployment."
  fi

elif [ "$COMMAND" == "create-service" ]; then
  if [ -z "$NAME" ]; then
    echo "Usage: $0 create-service <service-name> [--deploy | --d] [--redux | --r]"
    exit 1
  fi

  # Create the new service using the CLI
  echo "Creating the service $NAME..."
  node punch-cli.js create-service $NAME --redux $REDUX

  if [ "$DEPLOY" = true ]; then
    # Build the Docker image for the new service
    echo "Building Docker image for $NAME..."
    docker build -t $NAME:latest -f services/$NAME/Dockerfile .

    # Port assigned to the new service
    PORT=$(jq -r ".services.\"$NAME\"" config.json)

    # Update docker-compose.yml to include the new service
    echo "Adding $NAME to docker-compose.yml..."
    cat <<EOL >> docker-compose.yml

  $NAME:
    build:
      context: ./services/$NAME
    ports:
      - "$PORT:$PORT"
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    environment:
      - MONGO_URL=mongodb://mongodb:27017/$NAME
EOL

    # Run Docker Compose
    echo "Running Docker Compose..."
    docker-compose up -d

    # Deploy to Kubernetes
    echo "Deploying $NAME to Kubernetes..."
    kubectl apply -f services/$NAME/k8s-deployment.yaml
    kubectl apply -f services/$NAME/k8s-service.yaml

    echo "Service $NAME created and deployed successfully."
  else
    echo "Service $NAME created successfully without deployment."
  fi

elif [ "$COMMAND" == "list" ]; then
  # List existing microservices and components
  node punch-cli.js list
elif [ "$COMMAND" == "remove" ]; then
  if [ -z "$NAME" ]; then
    echo "Usage: $0 remove <name>"
    exit 1
  fi

  # Remove the microservice or component using the CLI
  echo "Removing $NAME..."
  node punch-cli.js remove $NAME
else
  echo "Usage: $0 <create-app|create-service|list|remove> <name> [--deploy | --d] [--redux | --r] [--exclude=component1,component2] [--author=author] [--license=license]"
  exit 1
fi
