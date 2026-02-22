FROM oven/bun:1 AS base
WORKDIR /app

# install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# copy source and migrations
COPY . .

# run migrations and start server
CMD bunx drizzle-kit migrate && bun run src/index.ts
