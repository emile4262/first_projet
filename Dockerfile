FROM node:18.20.3-alpine

WORKDIR /first_projet

COPY package*.json ./
RUN npm install

COPY . .

# Si pas d'étape de build, commente celle-ci :
# RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
