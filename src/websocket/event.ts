export type WsEvent =
  | { type: "USER_JOINED"; payload: { userId: string; name: string; email: string; role: string } }
  | { type: "PLAN_UPGRADED"; payload: { from: string; to: string; upgradedAt: string } }
  | { type: "BROADCAST_MESSAGE"; payload: { message: string; sentBy: string; sentAt: string } }
  | { type: "USER_REMOVED"; payload: { userId: string; removedBy: string } }
