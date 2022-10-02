FROM node:18-slim AS base

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY package-lock.json ./

RUN npm install --omit=dev


FROM base AS assets

COPY frontend frontend
COPY vite.config.js ./

RUN npm install --include=dev
RUN npm run build


FROM base AS final

COPY server.js Gruntfile.js ./
COPY server server
COPY public public
COPY scripts scripts
COPY tasks tasks
COPY --from=assets /app/dist dist

CMD node server
