# Frontend

This section provides helpful commands for working within the frontend development container.

### Useful NPM Scripts

- `npm run build` - Build the application for production.
- `npm run test` - Run the test suite with Vitest.
- `npm run test <path_to_file>` - Run a specific test suite with Vitest.
- `npm run coverage` - Run tests and generate a code coverage report in the `coverage/` folder.
- `npm run lint` - Run ESLint to find potential issues in the codebase.

### Troubleshooting and Notes

- **Development Server**: You do not need to run `npm run dev` manually if you are using the development container; it starts the dev server for you.
- **HMR Issues**: If you are not seeing Hot Module Replacement (HMR) updates, ensure the repository is located within a WSL directory. HMR is not supported when the project is stored in a Windows directory.
