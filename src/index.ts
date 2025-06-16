import { type Plugin } from '@envelop/core'
import { type YogaInitialContext } from 'graphql-yoga'
// Type definitions for the context
interface RequestLike {
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

interface ContextWithRequest {
  request?: RequestLike
}

// Export types for external use
export type GraphQLContextWithIp = YogaInitialContext & {
  ip: string
}

export type { RequestLike, ContextWithRequest }

// Function to extract IP from various header possibilities
function extractIpFromRequest(request: RequestLike): string {
  const headers = request.headers

  // Try to get headers as a Headers object or plain object
  const getHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) || undefined
    }
    
    const headerValue = headers[name] || headers[name.toLowerCase()]
    if (Array.isArray(headerValue)) {
      return headerValue[0]
    }
    return headerValue as string | undefined
  }

  // Priority order for IP detection
  const ipSources = [
    () => getHeader('x-forwarded-for')?.split(',')[0]?.trim(),
    () => getHeader('x-real-ip'),
    () => getHeader('x-client-ip'),
    () => getHeader('x-forwarded'),
    () => getHeader('x-cluster-client-ip'),
    () => getHeader('forwarded-for'),
    () => getHeader('forwarded'),
    () => getHeader('cf-connecting-ip'), // Cloudflare
    () => getHeader('true-client-ip'), // Cloudflare Enterprise
    () => getHeader('x-original-forwarded-for'),
    () => request.ip,
    () => request.ips?.[0],
    () => request.socket?.remoteAddress,
    () => request.connection?.remoteAddress,
  ]

  for (const getIp of ipSources) {
    const ip = getIp()
    if (ip && ip !== 'unknown') {
      // Clean IPv6 prefix if present
      return ip.replace(/^::ffff:/, '')
    }
  }

  return 'unknown'
}

export const useGraphQLIp = (isLocal: boolean = false): Plugin => {
  return {
    onExecute({ context, extendContext }) {
      const typedContext = context as ContextWithRequest
      let clientIp = 'unknown'

      if (typedContext.request) {
        clientIp = extractIpFromRequest(typedContext.request)
      }

      // For local development, we might want to use a default local IP
      if (isLocal && clientIp === 'unknown') {
        clientIp = '127.0.0.1'
      }

      extendContext({
        ip: clientIp,
      })

      if (isLocal) {
        console.log('GraphQL IP Plugin - Client IP:', clientIp)
        return {
          onExecuteDone: ({ result }) => {
            console.log('GraphQL IP Plugin - Execution completed')
          }
        }
      }
    }
  }
}
 