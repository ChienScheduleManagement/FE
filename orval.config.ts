import 'dotenv/config'

import { defineConfig } from 'orval'

const swaggerInput = process.env.ORVAL_INPUT ?? './swagger.json'

export default defineConfig({
  api: {
    input: swaggerInput,
    output: {
      target: './src/api/generated.ts',
      client: 'react-query',
      httpClient: 'axios',
      schemas: './src/api/model',
      override: {
        mutator: {
          path: './src/api/client.ts',
          name: 'apiOrvalClient',
        },
        zod: {
          generate: {
            body: true,
            response: true,
            param: true,
            query: true,
          },
        },
      },
    },
  },
  zod: {
    input: swaggerInput,
    output: {
      client: 'zod',
      target: './src/api/zod.ts',
      schemas: './src/api/model',
    },
  },
})
