FROM node:lts

RUN mkdir -p /app
WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm install --legacy-peer-deps

COPY --chown=node:node . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
