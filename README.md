# graphql-ip

[![npm version](https://img.shields.io/npm/v/graphql-ip.svg)](https://www.npmjs.com/package/graphql-ip)
[![npm downloads](https://img.shields.io/npm/dm/graphql-ip.svg)](https://www.npmjs.com/package/graphql-ip)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Seamlessly inject client IP address into your GraphQL resolvers with full TypeScript support.

## Features

- 🔒 **Type-safe**: Full TypeScript support with proper type definitions
- 🌐 **Comprehensive IP Detection**: Supports all major proxy headers and IP sources
- 🏠 **Development-friendly**: Special handling for local development environments
- ⚡ **Zero Dependencies**: Lightweight with minimal overhead
- 🔧 **Envelop Compatible**: Works seamlessly with the Envelop plugin system
- 📦 **Universal**: Works with GraphQL Yoga, Apollo Server, and any Envelop-based setup

## Installation

```bash
npm install graphql-ip
```

```bash
yarn add graphql-ip
```

```bash
pnpm add graphql-ip
```

```bash
bun add graphql-ip
```

## Quick Start

```typescript
import { useGraphQLIp } from 'graphql-ip'
import { envelop } from '@envelop/core'

const getEnveloped = envelop({
  plugins: [
    // ... other plugins
    useGraphQLIp(process.env.NODE_ENV === 'development'),
  ]
})
```

## Usage

### Basic Setup

```typescript
import { useGraphQLIp } from 'graphql-ip'
import { envelop } from '@envelop/core'

const getEnveloped = envelop({
  plugins: [
    // ... other plugins
    useGraphQLIp(false), // false for production, true for local development
  ]
})
```

### In Your Resolvers

```typescript
const resolvers = {
  Query: {
    getClientInfo: (parent, args, context) => {
      return `Client connected from: ${context.ip}`
    }
  }
}
```

### Development vs Production

```typescript
// Local development mode
useGraphQLIp(true)  // Provides fallback to 127.0.0.1 and console logging

// Production mode  
useGraphQLIp(false) // Strict IP detection without fallbacks
```

## Framework Examples

### GraphQL Yoga

```typescript
import { createYoga } from 'graphql-yoga'
import { useGraphQLIp } from 'graphql-ip'

const yoga = createYoga({
  plugins: [
    useGraphQLIp(process.env.NODE_ENV === 'development')
  ]
})
```

### Apollo Server with Envelop

```typescript
import { ApolloServer } from '@apollo/server'
import { envelop, useApolloTracing } from '@envelop/core'
import { useGraphQLIp } from 'graphql-ip'

const getEnveloped = envelop({
  plugins: [
    useApolloTracing(),
    useGraphQLIp(false)
  ]
})
```

## Supported IP Sources

The plugin checks for IP addresses in the following order of priority:

1. `x-forwarded-for` (first IP in comma-separated list)
2. `x-real-ip`
3. `x-client-ip`
4. `x-forwarded`
5. `x-cluster-client-ip`
6. `forwarded-for`
7. `forwarded`
8. `cf-connecting-ip` (Cloudflare)
9. `true-client-ip` (Cloudflare Enterprise)
10. `x-original-forwarded-for`
11. `request.ip`
12. `request.ips[0]`
13. `request.socket.remoteAddress`
14. `request.connection.remoteAddress`

## Advanced Features

- **IPv6 Prefix Cleaning**: Automatically removes `::ffff:` prefix from IPv4-mapped IPv6 addresses
- **Array Header Support**: Handles headers that come as arrays (takes first value)
- **Headers Object Support**: Works with both `Headers` instances and plain objects
- **Graceful Fallbacks**: Returns 'unknown' when no IP can be determined

## TypeScript Support

The plugin provides full TypeScript support with proper type definitions:

```typescript
import type { GraphQLContextWithIp } from 'graphql-ip'

// Your context will automatically include the 'ip' property
const resolver = (parent, args, context: GraphQLContextWithIp) => {
  console.log(context.ip) // TypeScript knows this exists
}
```

## API Reference

### `useGraphQLIp(isLocal?: boolean)`

Creates the GraphQL IP plugin.

**Parameters:**
- `isLocal` (optional): `boolean` - Enable development mode with console logging and localhost fallback

**Returns:** `Plugin` - Envelop plugin instance

### Types

```typescript
export interface GraphQLContextWithIp {
  ip: string
}

export interface RequestLike {
  headers: Headers | Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string }
  connection?: { remoteAddress?: string }
  ip?: string
  ips?: string[]
}

export interface ContextWithRequest {
  request?: RequestLike
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Kaan Mert Ağyol](https://github.com/hypecode-tech)
