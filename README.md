# Punch

Punch is a CLI tool for creating, listing, deploying, and removing microservices and additional components based on a template. This tool is designed to simplify the creation and management of microservices-based applications using Docker and Kubernetes.

## Features

- Create microservices based on predefined templates.
- Automatically deploy microservices using Docker and Kubernetes.
- Support for creating Redux files for state management in the frontend.
- Management of additional components like gateways, service discovery, logging, monitoring, and more.

## Requirements

- Node.js v14.x or higher.
- Docker.
- Kubernetes (optional, for deployments in a cluster).

## Installation

Clone this repository and navigate to the root directory:

```bash
git clone https://github.com/LSP20xx/punch.git
cd punch
```

Install any necessary dependencies (if any) and set up your environment.

## Usage

### Create a New Application

To create a new microservices-based application:

```bash
./punch-cli.sh create-app <app-name> [options]
```

#### Options:

- `-d, --deploy`: Automatically deploy the microservice after creating it.
- `-x, --exclude <components>`: Comma-separated list of components to exclude.
- `-r, --redux`: Create Redux files for the service.
- `-a, --author <author>`: Specify the author's name.
- `-l, --license <license>`: Specify the license type.
- `-s, --services <services>`: Comma-separated list of services to create.

### Create a New Service

To add a new service to the existing application:

```bash
./punch-cli.sh create-service <service-name> [options]
```

#### Options:

- `-d, --deploy`: Automatically deploy the service after creating it.
- `-r, --redux`: Create Redux files for the service.
- `-a, --author <author>`: Specify the author's name.
- `-l, --license <license>`: Specify the license type.
- `-s, --services <services>`: Comma-separated list of services to create.

### List Microservices and Components

To list all existing microservices and components:

```bash
./punch-cli.sh list
```

### Remove a Microservice or Component

To remove an existing microservice or component:

```bash
./punch-cli.sh remove <name>
```

## Project Structure

- **auth-service/**: Authentication and authorization service.
- **frontend/**: Frontend source code.
- **gateway/**: API Gateway to route requests to microservices.
- **logging/**: Centralized logging service with Fluentd.
- **monitoring/**: Monitoring service with Prometheus.
- **service-discovery/**: Service discovery with Consul.
- **service-template/**: Base template for creating new microservices.
- **config-service/**: Configuration service for centralizing environment variables.

## Contributing

Contributions are welcome! If you have ideas for improving this project, feel free to submit a pull request or open an issue.

## License

This project is licensed under the ISC license.
