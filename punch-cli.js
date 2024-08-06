const { program } = require("commander");
const fs = require("fs-extra");
const path = require("path");
const ejs = require("ejs");
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
  const configFileContent = fs.readFileSync(configPath, "utf-8").trim();
  if (configFileContent) {
    config = JSON.parse(configFileContent);
  }
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

export const get<%= serviceName %>ById = createAsyncThunk('<%= serviceName %>/getById', async (id) => {
  const response = await axios.get('/<%= serviceName %>/:id');
  return response.data;
});

export const create<%= serviceName %> = createAsyncThunk('<%= serviceName %>/create', async (<%= serviceName %>Data) => {
  const response = await axios.post('/<%= serviceName %>', <%= serviceName %>Data);
  return response.data;
});

export const update<%= serviceName %> = createAsyncThunk('<%= serviceName %>/update', async ({ id, <%= serviceName %>Data }) => {
  const response = await axios.put('/<%= serviceName %>/:id', <%= serviceName %>Data);
  return response.data;
});

export const delete<%= serviceName %> = createAsyncThunk('<%= serviceName %>/delete', async (id) => {
  await axios.delete('/<%= serviceName %>/:id');
  return id;
});

export const list<%= serviceName %>s = createAsyncThunk('<%= serviceName %>/list', async () => {
  const response = await axios.get('/<%= serviceName %>');
  return response.data;
});

const <%= serviceName %>Slice = createSlice({
  name: '<%= serviceName %>',
  initialState: {
    <%= serviceName %>s: [],
    <%= serviceName %>: null,
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(get<%= serviceName %>ById.pending, (state) => {
        state.loading = true;
      })
      .addCase(get<%= serviceName %>ById.fulfilled, (state, action) => {
        state.loading = false;
        state.<%= serviceName %> = action.payload;
      })
      .addCase(get<%= serviceName %>ById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(create<%= serviceName %>.pending, (state) => {
        state.loading = true;
      })
      .addCase(create<%= serviceName %>.fulfilled, (state, action) => {
        state.loading = false;
        state.<%= serviceName %>s.push(action.payload);
      })
      .addCase(create<%= serviceName %>.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(update<%= serviceName %>.pending, (state) => {
        state.loading = true;
      })
      .addCase(update<%= serviceName %>.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.<%= serviceName %>s.findIndex(<%= serviceName %> => <%= serviceName %>._id === action.payload._id);
        if (index !== -1) {
          state.<%= serviceName %>s[index] = action.payload;
        }
      })
      .addCase(update<%= serviceName %>.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(delete<%= serviceName %>.pending, (state) => {
        state.loading = true;
      })
      .addCase(delete<%= serviceName %>.fulfilled, (state, action) => {
        state.loading = false;
        state.<%= serviceName %>s = state.<%= serviceName %>s.filter(<%= serviceName %> => <%= serviceName %>._id !== action.payload);
      })
      .addCase(delete<%= serviceName %>.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(list<%= serviceName %>s.pending, (state) => {
        state.loading = true;
      })
      .addCase(list<%= serviceName %>s.fulfilled, (state, action) => {
        state.loading = false;
        state.<%= serviceName %>s = action.payload;
      })
      .addCase(list<%= serviceName %>s.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default <%= serviceName %>Slice.reducer;
`;

  const selectorContent = `
export const select<%= serviceName %>State = (state) => state.<%= serviceName %>;
export const selectAll<%= serviceName %>s = (state) => state.<%= serviceName %>.<%= serviceName %>s;
export const select<%= serviceName %>ById = (state, id) => state.<%= serviceName %>.<%= serviceName %>s.find(<%= serviceName %> => <%= serviceName %>._id === id);
export const select<%= serviceName %>Loading = (state) => state.<%= serviceName %>.loading;
export const select<%= serviceName %>Error = (state) => state.<%= serviceName %>.error;
`;

  await fs.writeFile(
    path.join(slicesPath, `${serviceName}Slice.js`),
    ejs.render(sliceContent, { serviceName })
  );
  await fs.writeFile(
    path.join(selectorsPath, `${serviceName}Selectors.js`),
    ejs.render(selectorContent, { serviceName })
  );
};

const replaceInFile = async (filePath, replacements) => {
  let content = await fs.readFile(filePath, "utf-8");
  for (const [searchValue, replaceValue] of replacements) {
    content = content.split(searchValue).join(replaceValue);
  }
  await fs.writeFile(filePath, content);
};

const addToComposeFile = (serviceName, port, composeFilePath) => {
  const composeFileContent = fs.readFileSync(composeFilePath, "utf-8");

  if (!composeFileContent.includes(`  ${serviceName}:`)) {
    const serviceCompose = port
      ? `  ${serviceName}:\n    image: ${serviceName}:latest\n    ports:\n      - "${port}:${port}"\n    environment:\n      - MONGO_URL=mongodb://mongodb:27017/${serviceName}\n    networks:\n      - mynetwork\n`
      : `  ${serviceName}:\n    image: ${serviceName}:latest\n    networks:\n      - mynetwork\n`;
    const updatedComposeContent = composeFileContent.replace(
      /services:/,
      `services:\n${serviceCompose}`
    );
    fs.writeFileSync(composeFilePath, updatedComposeContent);
  } else {
    console.log(`Service ${serviceName} is already in docker-compose.yml.`);
  }
};

const createConfigJson = async (gatewayPath, routes) => {
  const configContent = {
    routes: routes.map((route) => ({
      path: `/${route}`,
      target: `http://${route}:${config.services[route]}`,
    })),
  };

  await fs.writeFile(
    path.join(gatewayPath, "config.json"),
    JSON.stringify(configContent, null, 2)
  );
};

const createService = async (name, serviceName, options) => {
  const newServicePath = path.join(__dirname, "microservices", serviceName);
  const port = config.basePort + Object.keys(config.services).length;
  config.services[serviceName] = port;

  await fs.copy(templatePath, newServicePath);

  const filesToRename = [
    "models/serviceModel.js",
    "handlers/serviceHandler.js",
    "controllers/serviceController.js",
    "routes/serviceRoutes.js",
  ];

  for (const file of filesToRename) {
    const newFilePath = path.join(
      newServicePath,
      file.replace("service", serviceName)
    );
    await fs.move(path.join(newServicePath, file), newFilePath);
  }

  const replacements = [
    [/service-template/g, serviceName],
    [/service/g, serviceName],
    [3000, port],
  ];

  await replaceInFile(path.join(newServicePath, "index.js"), replacements);
  await replaceInFile(
    path.join(newServicePath, "controllers", `${serviceName}Controller.js`),
    replacements
  );
  await replaceInFile(
    path.join(newServicePath, "handlers", `${serviceName}Handler.js`),
    replacements
  );
  await replaceInFile(
    path.join(newServicePath, "routes", `${serviceName}Routes.js`),
    replacements
  );

  const dockerfileContent = `
FROM node:14

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY common-utils /app/microservices/${serviceName}/common-utils

WORKDIR /app/microservices/${serviceName}

COPY ./microservices/${serviceName}/package*.json ./

RUN npm install

COPY ./microservices/${serviceName} .

EXPOSE ${port}

CMD ["node", "index.js"]
  `;
  await fs.writeFile(
    path.join(newServicePath, "Dockerfile"),
    dockerfileContent
  );

  const k8sDeploymentContent = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${serviceName}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${serviceName}
  template:
    metadata:
      labels:
        app: ${serviceName}
    spec:
      containers:
        - name: ${serviceName}
          image: ${serviceName}:latest
          ports:
            - containerPort: ${port}
          env:
            - name: MONGO_URL
              value: mongodb://mongo/${serviceName}
  `;
  await fs.writeFile(
    path.join(newServicePath, "k8s-deployment.yaml"),
    k8sDeploymentContent
  );

  const k8sServiceContent = `
apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}
spec:
  selector:
    app: ${serviceName}
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

  await createPackageJson(
    newServicePath,
    serviceName,
    options.author,
    options.license
  );

  const envContent = `
PORT=${port}
MONGO_URL=mongodb://mongo/${serviceName}
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
JWT_SECRET=supersecret
  `;
  await fs.writeFile(path.join(newServicePath, ".env"), envContent);

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(
    `Service ${serviceName} created successfully in ${newServicePath} with port ${port}`
  );

  if (options.redux) {
    await createReduxFiles(newServicePath, serviceName);
    console.log(`Redux files for ${serviceName} created successfully.`);
  }

  if (options.deploy) {
    console.log(`Building Docker image for ${serviceName}...`);
    execSync(
      `docker build -t ${serviceName}:latest -f ${newServicePath}/Dockerfile .`,
      { stdio: "inherit" }
    );

    console.log(`Adding ${serviceName} to docker network...`);
    const composeFilePath = path.join(__dirname, "docker-compose.yml");
    addToComposeFile(serviceName, port, composeFilePath);

    console.log(`Running Docker...`);
    execSync("docker compose up -d", { stdio: "inherit" });

    console.log(`Deploying ${serviceName} to Kubernetes...`);
    execSync(
      `kubectl apply -f ${newServicePath}/k8s-deployment.yaml --validate=false`,
      {
        stdio: "inherit",
      }
    );
    execSync(
      `kubectl apply -f ${newServicePath}/k8s-service.yaml --validate=false`,
      {
        stdio: "inherit",
      }
    );

    console.log(`Service ${serviceName} created and deployed successfully.`);
  }

  if (serviceName === "gateway") {
    const gatewayPath = path.join(__dirname, "components", "gateway");
    await createConfigJson(gatewayPath, Object.keys(config.services));
  }
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
  .option(
    "-s, --services <services>",
    "Comma-separated list of services to create",
    (val) => val.split(",")
  )
  .action(async (name, options) => {
    const services = options.services || [];
    const author = options.author || "Unknown";
    const license = options.license || "ISC";

    try {
      for (const service of services) {
        await createService(name, service, options);
      }

      // Deploy additional components
      for (const component of components) {
        if (!options.exclude || !options.exclude.includes(component)) {
          console.log(`Creating and deploying component ${component}...`);
          const componentPath = path.join(__dirname, "components", component);

          await fs.copy(path.join(__dirname, component), componentPath);

          await createPackageJson(componentPath, component, author, license);

          console.log(`Building Docker image for ${component}...`);

          execSync(
            `docker build -t ${component}:latest -f ${componentPath}/Dockerfile ${component}`,
            { stdio: "inherit" }
          );
          console.log(`Adding ${component} to docker network...`);
          const composeFilePath = path.join(__dirname, "docker-compose.yml");
          addToComposeFile(component, null, composeFilePath);

          console.log(`Running Docker...`);
          execSync("docker compose up -d", { stdio: "inherit" });

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
  .option("-a, --author <author>", "Specify the author name")
  .option("-l, --license <license>", "Specify the license type")
  .option(
    "-s, --services <services>",
    "Comma-separated list of services to create",
    (val) => val.split(",")
  )
  .action(async (name, options) => {
    const services = options.services || [];

    try {
      for (const service of services) {
        await createService(name, service, options);
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
        execSync(
          `kubectl delete -f microservices/${name}/k8s-deployment.yaml --validate=false`,
          { stdio: "inherit" }
        );
        execSync(
          `kubectl delete -f microservices/${name}/k8s-service.yaml --validate=false`,
          {
            stdio: "inherit",
          }
        );
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
      fs.removeSync(path.join(__dirname, "microservices", name));
      delete config.services[name];
    } else {
      console.log(`Removing directory for ${name}...`);
      fs.removeSync(path.join(__dirname, name));
      delete config.components[name];
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(
      `${
        isComponent ? "Component" : "Microservice"
      } ${name} removed successfully.`
    );
  });

program.parse(process.argv);
