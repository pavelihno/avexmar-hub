FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# CMD ["npm", "run", "prod"]
CMD ["npm", "run", "dev"]