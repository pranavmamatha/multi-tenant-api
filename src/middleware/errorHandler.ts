import { Context } from "hono"
import { ApiError } from "../utils/ApiError"
import { sendError } from "../utils/response"
import { ContentfulStatusCode } from "hono/utils/http-status"

export const errorHandler = (err: Error, c: Context) => {
  if (err instanceof ApiError) {
    return sendError(c, err.message, err.statusCode as ContentfulStatusCode)
  }
  console.error(err)
  return sendError(c, "Internal server error", 500)
}
