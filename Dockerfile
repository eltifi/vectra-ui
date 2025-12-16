FROM node:lts-alpine
LABEL org.opencontainers.image.authors="Walid Eltifi <eltifi@users.noreply.github.com>"
LABEL org.opencontainers.image.source="https://github.com/eltifi/vectra"

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

# Build for production
RUN npm run build

CMD ["npm", "start"]
