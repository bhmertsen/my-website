# Server Dockerfile for Site1 (Express + Mongoose)
FROM node:18-alpine

# create app directory
WORKDIR /usr/src/app

# copy package metadata first for better caching
COPY package*.json ./

# install dependencies (production)
RUN npm ci --only=production

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
