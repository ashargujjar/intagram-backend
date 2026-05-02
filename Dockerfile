FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
# FROM node:20.19-alpine
# WORKDIR /app

# COPY package*.json ./
# RUN npm ci

# COPY . .

# RUN npm run build

# CMD ["node", "dist/app.js"]