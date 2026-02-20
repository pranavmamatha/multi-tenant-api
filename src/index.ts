import { Hono } from 'hono'
const app = new Hono()

app.get('/health', (c) => {
  return c.text('Health OK')
})

export default {
  port: 3000,
  fetch: app.fetch
} 
