export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Multi-Tenant SaaS API",
    version: "1.0.0",
    description: "Multi-tenant subscription-based SaaS backend with real-time WebSocket notifications"
  },
  servers: [
    { url: "http://localhost:3000", description: "Development server" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { type: "object" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          data: { type: "null" }
        }
      }
    }
  },
  paths: {
    // ─────────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────────
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user and organisation",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password", "organisationName"],
                properties: {
                  name: { type: "string", example: "Pranav" },
                  email: { type: "string", example: "pranav@gmail.com" },
                  password: { type: "string", example: "123456" },
                  organisationName: { type: "string", example: "Tech Gajana" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Registration successful" },
          409: { description: "Email already in use" },
          422: { description: "Validation error" }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "pranav@gmail.com" },
                  password: { type: "string", example: "123456" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Token refreshed" },
          401: { description: "Invalid or expired refresh token" }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and revoke refresh token",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Logged out successfully" },
          401: { description: "Unauthorized" }
        }
      }
    },

    // ─────────────────────────────────────────
    // ORGANISATIONS
    // ─────────────────────────────────────────
    "/api/organisations": {
      get: {
        tags: ["Organisations"],
        summary: "Get current organisation details",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Organisation fetched" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/api/organisations/subscription": {
      patch: {
        tags: ["Organisations"],
        summary: "Upgrade subscription plan (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["plan"],
                properties: {
                  plan: {
                    type: "string",
                    enum: ["FREE", "PRO", "ENTERPRISE"],
                    example: "PRO"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Plan upgraded" },
          400: { description: "Already on this plan" },
          403: { description: "Forbidden — Admin only" }
        }
      }
    },
    "/api/organisations/broadcast": {
      post: {
        tags: ["Organisations"],
        summary: "Broadcast message to all org members (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: { type: "string", example: "Server maintenance at 10PM" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Message broadcasted" },
          403: { description: "Forbidden — Admin only" }
        }
      }
    },

    // ─────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "Get all users in organisation (Admin only)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Users fetched" },
          403: { description: "Forbidden — Admin only" }
        }
      }
    },
    "/api/users/invite": {
      post: {
        tags: ["Users"],
        summary: "Invite a user to the organisation (Admin only)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", example: "john@gmail.com" },
                  role: {
                    type: "string",
                    enum: ["ADMIN", "MEMBER"],
                    default: "MEMBER"
                  }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Invite sent" },
          403: { description: "Member limit reached" },
          409: { description: "User already exists or invite already sent" }
        }
      }
    },
    "/api/users/accept-invite": {
      post: {
        tags: ["Users"],
        summary: "Accept an organisation invite",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "name", "password"],
                properties: {
                  token: { type: "string" },
                  name: { type: "string", example: "John" },
                  password: { type: "string", example: "123456" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Invite accepted" },
          404: { description: "Invalid or used token" },
          410: { description: "Invite expired" }
        }
      }
    },
    "/api/users/{id}": {
      delete: {
        tags: ["Users"],
        summary: "Remove a user from organisation (Admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "User ID to remove"
          }
        ],
        responses: {
          200: { description: "User removed" },
          400: { description: "Cannot remove yourself" },
          403: { description: "Cannot remove an admin" },
          404: { description: "User not found" }
        }
      }
    },

    // ─────────────────────────────────────────
    // ACTIVITIES
    // ─────────────────────────────────────────
    "/api/activities": {
      get: {
        tags: ["Activities"],
        summary: "Get organisation activity feed",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Activities fetched" },
          401: { description: "Unauthorized" }
        }
      }
    },

    // ─────────────────────────────────────────
    // WEBSOCKET
    // ─────────────────────────────────────────
    "/ws": {
      get: {
        tags: ["WebSocket"],
        summary: "Connect to real-time WebSocket channel",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: "Valid JWT access token"
          }
        ],
        responses: {
          101: { description: "WebSocket connection established" },
          401: { description: "Invalid or missing token" }
        }
      }
    }
  }
}
