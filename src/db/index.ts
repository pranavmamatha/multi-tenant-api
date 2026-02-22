import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"
import { env } from "../config/env"

const client = postgres(env.databaseUrl!)

export const db = drizzle(client, { schema })
