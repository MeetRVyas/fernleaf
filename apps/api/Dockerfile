FROM node:22.23.3-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY . .
RUN corepack pnpm install --frozen-lockfile
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build corepack pnpm --filter @fernleaf/api exec prisma generate
RUN corepack pnpm --filter @fernleaf/api build
ENV TZ=UTC
CMD ["corepack", "pnpm", "--filter", "@fernleaf/api", "exec", "tsx", "src/main.ts"]
