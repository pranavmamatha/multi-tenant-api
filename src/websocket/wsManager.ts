import { ServerWebSocket } from "bun"
import { WsEvent } from "./event"

// Map of organisationId → Set of connected websockets
const orgRooms = new Map<string, Set<ServerWebSocket<WsData>>>()

export type WsData = {
  userId: string
  organisationId: string
  role: string
}

export const wsManager = {
  // add a connection to an org room
  join(organisationId: string, ws: ServerWebSocket<WsData>) {
    if (!orgRooms.has(organisationId)) {
      orgRooms.set(organisationId, new Set())
    }
    orgRooms.get(organisationId)!.add(ws)
    console.log(`WS: user joined org room ${organisationId}`)
  },

  // remove a connection from an org room
  leave(organisationId: string, ws: ServerWebSocket<WsData>) {
    orgRooms.get(organisationId)?.delete(ws)
    console.log(`WS: user left org room ${organisationId}`)
  },

  // broadcast an event to all connections in an org room
  broadcast(organisationId: string, event: WsEvent) {
    const room = orgRooms.get(organisationId)
    if (!room || room.size === 0) return

    const message = JSON.stringify(event)
    room.forEach(ws => ws.send(message))
    console.log(`WS: broadcasted ${event.type} to org ${organisationId} (${room.size} clients)`)
  },

  // get number of connected clients in an org
  getRoomSize(organisationId: string): number {
    return orgRooms.get(organisationId)?.size ?? 0
  }
}
