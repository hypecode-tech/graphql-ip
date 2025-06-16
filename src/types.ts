import type { YogaInitialContext } from "graphql-yoga"

// Type definitions for GraphQL context extension
export type GraphQLContextWithIp = YogaInitialContext & {
  ip: string
}

// Type definitions for request objects
export interface RequestLike {
  headers: Headers | Record<string, string | string[] | undefined>
  socket?: {
    remoteAddress?: string
  }
  connection?: {
    remoteAddress?: string
  }
  ip?: string
  ips?: string[]
}

export interface ContextWithRequest {
  request?: RequestLike
}
