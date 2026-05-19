FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ cairo-dev pango-dev

COPY package*.json ./

RUN npm install

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]