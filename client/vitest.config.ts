import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        setupFiles: './src/setupTests.ts',
        globals: true,
        coverage: {
            exclude: [
                ...coverageConfigDefaults.exclude,
                'src/routeTree.gen.ts',
            ],
        },
    },
});
