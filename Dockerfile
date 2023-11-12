FROM node:18

# prevent user interaction requests
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD [ "npm", "run", "start" ]