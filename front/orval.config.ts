import { defineConfig } from 'orval';

export default defineConfig({
    api: {
        input: '../tsp/tsp-output/api.yaml',
        output: {
            target: './src/api/generated.ts',
            client: 'axios',
            mode: 'single',
        },
    },
});
