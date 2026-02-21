import { Context } from "hono"
import { ContentfulStatusCode } from "hono/utils/http-status"

export const sendSuccess = <T>(c: Context, message: string, data: T, statusCode: ContentfulStatusCode = 200) => {
  return c.json({
    success: true,
    message,
    data
  }, statusCode)
}

export const sendError = (c: Context, message: string, statusCode: ContentfulStatusCode = 400) => {
  return c.json({
    success: false,
    message,
    data: null
  }, statusCode)
}
