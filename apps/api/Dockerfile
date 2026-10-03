FROM node:22.23.3-slim
WORKDIR /app
RUN corepack enable
COPY . .
RUN corepack pnpm install --frozen-lockfile && corepack pnpm --filter @fernleaf/api exec prisma generate && corepack pnpm --filter @fernleaf/api build
ENV TZ=UTC
CMD ["node", "--import", "tsx", "apps/api/src/main.ts"]
