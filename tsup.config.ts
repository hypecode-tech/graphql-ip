import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/types.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: false,
    sourcemap: true,
    treeshake: true,
    splitting: false,
    outDir: 'dist',
    external: ['@envelop/core', 'graphql'],
    banner: {
      js: '// @hypecode-tech/graphql-ip - MIT License',
    },
  },
])
