FROM node:22-alpine AS compilacao
WORKDIR /aplicacao
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vendas?schema=public
ENV DIRECT_URL=postgresql://postgres:postgres@localhost:5432/vendas?schema=public
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run compilar

FROM node:22-alpine
WORKDIR /aplicacao
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=compilacao /aplicacao/node_modules/.prisma ./node_modules/.prisma
COPY --from=compilacao /aplicacao/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "iniciar"]
