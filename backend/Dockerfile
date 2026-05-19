FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev pkgconfig

COPY package*.json ./

RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]