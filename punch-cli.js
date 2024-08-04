const { program } = require("commander");
const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

const templatePath = path.join(__dirname, "service-template");
const components = [
  "gateway",
  "service-discovery",
  "logging",
  "monitoring",
  "auth-service",
  "config-service",
];
const configPath = path.join(__dirname, "config.json");
let config = { basePort: 3000, services: {}, components: {} };

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
} else {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

const createPackageJson = async (servicePath, serviceName, author, license) => {
  const packageJson = `
  {
    "name": "${serviceName}",
    "version": "1.0.0",
    "description": "${serviceName} service",
    "main": "index.js",
    "scripts": {
      "start": "node index.js",
      "dev": "nodemon index.js"
    },
    "dependencies": {
      "express": "^4.17.1",
      "mongoose": "^5.10.7",
      "amqplib": "^0.5.6",
      "redis": "^4.0.1",
      "dotenv": "^8.2.0",
      "helmet": "^4.6.0",
      "csurf": "^1.11.0",
      "xss-clean": "^0.1.1",
      "cookie-parser": "^1.4.5",
      "joi": "^17.3.0",
      "express-validator": "^6.10.0",
      "express-rate-limit": "^5.1.3",
      "cors": "^2.8.5",
      "jsonwebtoken": "^8.5.1"
    },
    "devDependencies": {
      "nodemon": "^2.0.4"
    },
    "author": "${author}",
    "license": "${license}"
  }
  `;

  await fs.writeFile(path.join(servicePath, "package.json"), packageJson);
};

const createReduxFiles = async (servicePath, serviceName) => {
  const reduxPath = path.join(__dirname, "frontend");
  const slicesPath = path.join(reduxPath, "slices");
  const selectorsPath = path.join(reduxPath, "selectors");

  const sliceContent = `
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetch${serviceName}ById = createAsyncThunk('${serviceName}/fetchById', async (id) => {
  const response = await axios.get('/${serviceName}/${id}');
  return response.data;
});

export const create${serviceName} = createAsyncThunk('${serviceName}/create', async (${serviceName}Data) => {
  const response = await axios.post('/${serviceName}', ${serviceName}Data);
  return response.data;
});

export const update${serviceName} = createAsyncThunk('${serviceName}/update', async ({ id, ${serviceName}Data }) => {
  const response = await axios.put('/${serviceName}/${id}', ${serviceName}Data);
  return response.data;
});

export const delete${serviceName} = createAsyncThunk('${serviceName}/delete', async (id) => {
  await axios.delete('/${serviceName}/${id}');
  return id;
});

export const list${serviceName}s = createAsyncThunk('${serviceName}/list', async () => {
  const response = await axios.get('/${serviceName}');
  return response.data;
});

const ${serviceName}Slice = createSlice({
  name: '${serviceName}',
  initialState: {
    ${serviceName}s: [],
    ${serviceName}: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetch${serviceName}ById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetch${serviceName}ById.fulfilled, (state, action) => {
        state.loading = false;
        state.${serviceName} = action.payload;
      })
      .addCase(fetch${serviceName}ById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(create${serviceName}.pending, (state) => {
        state.loading = true;
      })
      .addCase(create${serviceName}.fulfilled, (state, action) => {
        state.loading = false;
        state.${serviceName}s.push(action.payload);
      })
      .addCase(create${serviceName}.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(update${serviceName}.pending, (state) => {
        state.loading = true;
      })
      .addCase(update${serviceName}.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.${serviceName}s.findIndex(${serviceName} => ${serviceName}._id === action.payload._id);
        if (index !== -1) {
          state.${serviceName}s[index] = action.payload;
        }
      })
      .addCase(update${serviceName}.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(delete${serviceName}.pending, (state) => {
        state.loading = true;
      })
      .addCase(delete${serviceName}.fulfilled, (state, action) => {
        state.loading = false;
        state.${serviceName}s = state.${serviceName}s.filter(${serviceName} => ${serviceName}._id !== action.payload);
      })
      .addCase(delete${serviceName}.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(list${serviceName}s.pending, (state) => {
        state.loading = true;
      })
      .addCase(list${serviceName}s.fulfilled, (state, action) => {
        state.loading = false;
        state.${serviceName}s = action.payload;
      })
      .addCase(list${serviceName}s.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default ${serviceName}Slice.reducer;
`;

  const selectorContent = `
export const select${serviceName}State = (state) => state.${serviceName};
export const selectAll${serviceName}s = (state) => state.${serviceName}.${serviceName}s;
export const select${serviceName}ById = (state, id) => state.${serviceName}.${serviceName}s.find(${serviceName} => ${serviceName}._id === id);
export const select${serviceName}Loading = (state) => state.${serviceName}.loading;
export const select${serviceName}Error = (state) => state.${serviceName}.error;
`;

  await fs.writeFile(
    path.join(slicesPath, `${serviceName}Slice.js`),
    sliceContent
  );
  await fs.writeFile(
    path.join(selectorsPath, `${serviceName}Selectors.js`),
    selectorContent
  );
};

program
  .version("1.0.0")
  .description(
    "CLI to create, list, deploy, and remove microservices and additional components based on a template"
  );

program
  .command("create-app <name>")
  .description("Create a new microservice and deploy all components by default")
  .option("-d, --deploy", "Build and deploy the microservice")
  .option(
    "-x, --exclude <components>",
    "Comma-separated list of components to exclude",
    (val) => val.split(",")
  )
  .option("-r, --redux", "Create Redux files for the service")
  .option("-a, --author <author>", "Specify the author name")
  .option("-l, --license <license>", "Specify the license type")
  .action(async (name, options) => {
    const newServicePath = path.join(__dirname, "services", name);
    const excludeComponents = options.exclude || [];
    const author = options.author || "Unknown";
    const license = options.license || "ISC";

    try {
      // Assign a unique port
      const port = config.basePort + Object.keys(config.services).length;
      config.services[name] = port;

      // Copy the microservice template to the new directory
      await fs.copy(templatePath, newServicePath);

      // Rename files and adjust content
      const filesToRename = [
        "models/serviceModel.js",
        "services/serviceService.js",
        "controllers/serviceController.js",
        "routes/serviceRoutes.js",
      ];

      for (const file of filesToRename) {
        const newFilePath = path.join(
          newServicePath,
          file.replace("service", name)
        );
        await fs.move(path.join(newServicePath, file), newFilePath);
      }

      // Update content of index.js and other files
      const replaceInFile = async (filePath, replacements) => {
        let content = await fs.readFile(filePath, "utf-8");
        for (const [searchValue, replaceValue] of replacements) {
          content = content.split(searchValue).join(replaceValue);
        }
        await fs.writeFile(filePath, content);
      };

      const replacements = [
        [/service-template/g, name],
        [/service/g, name],
        [3000, port],
      ];

      await replaceInFile(path.join(newServicePath, "index.js"), replacements);
      await replaceInFile(
        path.join(newServicePath, "controllers", `${name}Controller.js`),
        replacements
      );
      await replaceInFile(
        path.join(newServicePath, "services", `${name}Service.js`),
        replacements
      );
      await replaceInFile(
        path.join(newServicePath, "routes", `${name}Routes.js`),
        replacements
      );

      // Create Dockerfile
      const dockerfileContent = `
FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy common-utils
COPY ../../common-utils /app/common-utils

EXPOSE ${port}
CMD ["node", "index.js"]
      `;
      await fs.writeFile(
        path.join(newServicePath, "Dockerfile"),
        dockerfileContent
      );

      // Create Kubernetes files
      const k8sDeploymentContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
        - name: ${name}
          image: ${name}:latest
          ports:
            - containerPort: ${port}
          env:
            - name: MONGO_URL
              value: mongodb://mongo/${name}
      `;
      await fs.writeFile(
        path.join(newServicePath, "k8s-deployment.yaml"),
        k8sDeploymentContent
      );

      const k8sServiceContent = `
apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
    - protocol: TCP
      port: ${port}
      targetPort: ${port}
  type: ClusterIP
      `;
      await fs.writeFile(
        path.join(newServicePath, "k8s-service.yaml"),
        k8sServiceContent
      );

      // Create package.json
      await createPackageJson(newServicePath, name, author, license);

      // Create .env file
      const envContent = `
PORT=${port}
MONGO_URL=mongodb://mongo/${name}
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=supersecret
      `;
      await fs.writeFile(path.join(newServicePath, ".env"), envContent);

      // Save the updated configuration
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      console.log(
        `Microservice ${name} created successfully in ${newServicePath} with port ${port}`
      );

      if (options.redux) {
        await createReduxFiles(newServicePath, name);
        console.log(`Redux files for ${name} created successfully.`);
      }

      if (options.deploy) {
        // Build the Docker image for the new microservice
        console.log(`Building Docker image for ${name}...`);
        execSync(
          `docker build -t ${name}:latest -f ${newServicePath}/Dockerfile .`,
          { stdio: "inherit" }
        );

        // Update docker-compose.yml to include the new service
        console.log(`Adding ${name} to docker-compose.yml...`);
        const composeContent = `
  ${name}:
    build:
      context: ./services/${name}
    ports:
      - "${port}:${port}"
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    environment:
      - MONGO_URL=mongodb://mongodb:27017/${name}
        `;
        fs.appendFileSync("docker-compose.yml", composeContent);

        // Run Docker Compose
        console.log(`Running Docker Compose...`);
        execSync("docker-compose up -d", { stdio: "inherit" });

        // Deploy to Kubernetes
        console.log(`Deploying ${name} to Kubernetes...`);
        execSync(`kubectl apply -f ${newServicePath}/k8s-deployment.yaml`, {
          stdio: "inherit",
        });
        execSync(`kubectl apply -f ${newServicePath}/k8s-service.yaml`, {
          stdio: "inherit",
        });

        console.log(`Microservice ${name} created and deployed successfully.`);
      }

      // Deploy additional components
      for (const component of components) {
        if (!excludeComponents.includes(component)) {
          console.log(`Creating and deploying component ${component}...`);
          const componentPath = path.join(__dirname, component);

          // Copy the component template to the new directory
          await fs.copy(component, componentPath);

          // Create package.json
          await createPackageJson(componentPath, component, author, license);

          // Build the Docker image for the component
          console.log(`Building Docker image for ${component}...`);
          execSync(
            `docker build -t ${component}:latest -f ${componentPath}/Dockerfile .`,
            { stdio: "inherit" }
          );

          // Add the component to docker-compose.yml
          console.log(`Adding ${component} to docker-compose.yml...`);
          let componentComposeContent;
          if (component === "gateway") {
            componentComposeContent = `
  ${component}:
    build:
      context: ./${component}
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    networks:
      - mynetwork
            `;
          } else {
            componentComposeContent = `
  ${component}:
    build:
      context: ./${component}
    networks:
      - mynetwork
            `;
          }
          fs.appendFileSync("docker-compose.yml", componentComposeContent);

          // Run Docker Compose
          console.log(`Running Docker Compose...`);
          execSync("docker-compose up -d", { stdio: "inherit" });

          // Save the updated configuration
          config.components[component] = true;
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

          console.log(
            `Component ${component} created and deployed successfully.`
          );
        }
      }
    } catch (error) {
      console.error("Error creating the microservice or components:", error);
    }
  });

program
  .command("create-service <name>")
  .description("Create a new service and add it to the existing application")
  .option("-d, --deploy", "Build and deploy the service")
  .option("-r, --redux", "Create Redux files for the service")
  .action(async (name, options) => {
    const newServicePath = path.join(__dirname, "services", name);

    try {
      // Assign a unique port
      const port = config.basePort + Object.keys(config.services).length;
      config.services[name] = port;

      // Copy the microservice template to the new directory
      await fs.copy(templatePath, newServicePath);

      // Rename files and adjust content
      const filesToRename = [
        "models/serviceModel.js",
        "services/serviceService.js",
        "controllers/serviceController.js",
        "routes/serviceRoutes.js",
      ];

      for (const file of filesToRename) {
        const newFilePath = path.join(
          newServicePath,
          file.replace("service", name)
        );
        await fs.move(path.join(newServicePath, file), newFilePath);
      }

      // Update content of index.js and other files
      const replaceInFile = async (filePath, replacements) => {
        let content = await fs.readFile(filePath, "utf-8");
        for (const [searchValue, replaceValue] of replacements) {
          content = content.split(searchValue).join(replaceValue);
        }
        await fs.writeFile(filePath, content);
      };

      const replacements = [
        [/service-template/g, name],
        [/service/g, name],
        [3000, port],
      ];

      await replaceInFile(path.join(newServicePath, "index.js"), replacements);
      await replaceInFile(
        path.join(newServicePath, "controllers", `${name}Controller.js`),
        replacements
      );
      await replaceInFile(
        path.join(newServicePath, "services", `${name}Service.js`),
        replacements
      );
      await replaceInFile(
        path.join(newServicePath, "routes", `${name}Routes.js`),
        replacements
      );

      // Create Dockerfile
      const dockerfileContent = `
FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copy common-utils
COPY ../../common-utils /app/common-utils

EXPOSE ${port}
CMD ["node", "index.js"]
      `;
      await fs.writeFile(
        path.join(newServicePath, "Dockerfile"),
        dockerfileContent
      );

      // Create Kubernetes files
      const k8sDeploymentContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
        - name: ${name}
          image: ${name}:latest
          ports:
            - containerPort: ${port}
          env:
            - name: MONGO_URL
              value: mongodb://mongo/${name}
      `;
      await fs.writeFile(
        path.join(newServicePath, "k8s-deployment.yaml"),
        k8sDeploymentContent
      );

      const k8sServiceContent = `
apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
    - protocol: TCP
      port: ${port}
      targetPort: ${port}
  type: ClusterIP
      `;
      await fs.writeFile(
        path.join(newServicePath, "k8s-service.yaml"),
        k8sServiceContent
      );

      // Create package.json
      await createPackageJson(
        newServicePath,
        name,
        config.author,
        config.license
      );

      // Create .env file
      const envContent = `
PORT=${port}
MONGO_URL=mongodb://mongo/${name}
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=supersecret
      `;
      await fs.writeFile(path.join(newServicePath, ".env"), envContent);

      // Save the updated configuration
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      console.log(
        `Service ${name} created successfully in ${newServicePath} with port ${port}`
      );

      if (options.redux) {
        await createReduxFiles(newServicePath, name);
        console.log(`Redux files for ${name} created successfully.`);
      }

      if (options.deploy) {
        // Build the Docker image for the new service
        console.log(`Building Docker image for ${name}...`);
        execSync(
          `docker build -t ${name}:latest -f ${newServicePath}/Dockerfile .`,
          { stdio: "inherit" }
        );

        // Update docker-compose.yml to include the new service
        console.log(`Adding ${name} to docker-compose.yml...`);
        const composeContent = `
  ${name}:
    build:
      context: ./services/${name}
    ports:
      - "${port}:${port}"
    depends_on:
      - mongodb
      - rabbitmq
      - redis
    environment:
      - MONGO_URL=mongodb://mongodb:27017/${name}
        `;
        fs.appendFileSync("docker-compose.yml", composeContent);

        // Run Docker Compose
        console.log(`Running Docker Compose...`);
        execSync("docker-compose up -d", { stdio: "inherit" });

        // Deploy to Kubernetes
        console.log(`Deploying ${name} to Kubernetes...`);
        execSync(`kubectl apply -f ${newServicePath}/k8s-deployment.yaml`, {
          stdio: "inherit",
        });
        execSync(`kubectl apply -f ${newServicePath}/k8s-service.yaml`, {
          stdio: "inherit",
        });

        console.log(`Service ${name} created and deployed successfully.`);
      }
    } catch (error) {
      console.error("Error creating the service:", error);
    }
  });

program
  .command("list")
  .description("List all existing microservices and components")
  .action(() => {
    const services = Object.keys(config.services);
    const components = Object.keys(config.components);

    if (services.length === 0 && components.length === 0) {
      console.log("No microservices or components created.");
    } else {
      if (services.length > 0) {
        console.log("Existing microservices:");
        services.forEach((service) => {
          console.log(`- ${service}: port ${config.services[service]}`);
        });
      }
      if (components.length > 0) {
        console.log("Existing components:");
        components.forEach((component) => {
          console.log(`- ${component}`);
        });
      }
    }
  });

program
  .command("remove <name>")
  .description("Remove an existing microservice or component")
  .action((name) => {
    const isComponent = components.includes(name);

    if (isComponent && !config.components[name]) {
      console.log(`Component ${name} does not exist.`);
      return;
    }

    if (!isComponent && !config.services[name]) {
      console.log(`Microservice ${name} does not exist.`);
      return;
    }

    // Remove Kubernetes resources
    if (!isComponent) {
      console.log(`Removing Kubernetes resources for ${name}...`);
      try {
        execSync(`kubectl delete -f services/${name}/k8s-deployment.yaml`, {
          stdio: "inherit",
        });
        execSync(`kubectl delete -f services/${name}/k8s-service.yaml`, {
          stdio: "inherit",
        });
      } catch (error) {
        console.error(
          `Error removing Kubernetes resources for ${name}:`,
          error
        );
      }
    }

    // Remove Docker image
    console.log(`Removing Docker image for ${name}...`);
    try {
      execSync(`docker rmi ${name}:latest`, { stdio: "inherit" });
    } catch (error) {
      console.error(`Error removing Docker image for ${name}:`, error);
    }

    // Remove entry from docker-compose.yml
    console.log(`Removing ${name} entry from docker-compose.yml...`);
    const composeFile = path.join(__dirname, "docker-compose.yml");
    const composeContent = fs.readFileSync(composeFile, "utf-8");
    const updatedComposeContent = composeContent.replace(
      new RegExp(`\n\\s*${name}:.*?\\n(?=\\s*\\w|$)`, "gs"),
      ""
    );
    fs.writeFileSync(composeFile, updatedComposeContent);

    // Remove service or component directory
    if (!isComponent) {
      console.log(`Removing directory for ${name}...`);
      fs.removeSync(path.join(__dirname, "services", name));
      delete config.services[name];
    } else {
      console.log(`Removing directory for ${name}...`);
      fs.removeSync(path.join(__dirname, name));
      delete config.components[name];
    }

    // Save the updated configuration
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(
      `${
        isComponent ? "Component" : "Microservice"
      } ${name} removed successfully.`
    );
  });

program.parse(process.argv);
