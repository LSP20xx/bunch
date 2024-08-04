FROM node:14

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Copiar common-utils desde el host
COPY ../../common-utils /app/common-utils

EXPOSE 3000
CMD ["node", "index.js"]