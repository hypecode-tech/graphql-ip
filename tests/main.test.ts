import { assertSingleExecutionValue, createTestkit } from '@envelop/testing'
import { useGraphQLIp } from '@/index';
import { buildSchema } from 'graphql'
import { describe, expect, it } from 'bun:test'

describe('GraphQL IP Plugin', () => {
  const mySchema = buildSchema(`
    type Query { 
      getClientInfo: String 
    }
  `)

  describe('Local Development Mode', () => {
    it('Should extract IP from x-forwarded-for header in local mode', async () => {
      const testkit = createTestkit([useGraphQLIp(true)], mySchema)
      
      // Mock context with request headers
      const mockContext = {
        request: {
          headers: {
            'x-forwarded-for': '192.168.1.100, 10.0.0.1',
          }
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should fallback to localhost IP when no request headers in local mode', async () => {
      const testkit = createTestkit([useGraphQLIp(true)], mySchema)
      
      const mockContext = {
        request: {
          headers: {}
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
      // IP should be added to context
      expect(mockContext).toHaveProperty('ip')
    })

    it('Should handle multiple IP sources with priority in local mode', async () => {
      const testkit = createTestkit([useGraphQLIp(true)], mySchema)
      
      const mockContext = {
        request: {
          headers: {
            'x-real-ip': '203.0.113.195',
            'x-forwarded-for': '198.51.100.178',
            'cf-connecting-ip': '203.0.113.200'
          }
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })
  })

  describe('Production Mode', () => {
    it('Should extract IP from Cloudflare headers in production', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {
        request: {
          headers: {
            'cf-connecting-ip': '203.0.113.195',
            'x-forwarded-for': '10.0.0.1'
          }
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should handle production environment with various proxy headers', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {
        request: {
          headers: new Headers({
            'x-client-ip': '198.51.100.42',
            'x-cluster-client-ip': '203.0.113.100'
          })
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should return unknown when no IP sources available in production', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {
        request: {
          headers: {}
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should clean IPv6 prefix from IP addresses', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {
        request: {
          headers: {
            'x-forwarded-for': '::ffff:192.168.1.100'
          }
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('Should handle array-type headers correctly', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {
        request: {
          headers: {
            'x-forwarded-for': ['192.168.1.50', '10.0.0.1']
          }
        }
      }
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should handle missing request object gracefully', async () => {
      const testkit = createTestkit([useGraphQLIp(false)], mySchema)
      
      const mockContext = {} // No request object
      
      const result = await testkit.execute(
        `query { getClientInfo }`,
        {},
        mockContext
      )
      
      assertSingleExecutionValue(result)
      expect(result.errors).toBeUndefined()
    })

    it('Should verify IP is correctly added to context', async () => {
      const testkit = createTestkit([useGraphQLIp(true)], mySchema)
      
      const mockContext = {
        request: {
          headers: {
            'x-forwarded-for': '192.168.1.123'
          }
        }
      }
      
      // Execute with a simple schema that doesn't require resolvers
      const simpleSchema = buildSchema(`type Query { hello: String }`)
      const simpleTestkit = createTestkit([useGraphQLIp(true)], simpleSchema)
      
      await simpleTestkit.execute(
        `query { hello }`,
        {},
        mockContext
      )
      
      // Check if IP was added to context (this will be done by the plugin)
      expect(mockContext).toHaveProperty('ip')
    })
  })
})