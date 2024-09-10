# fragments

Repository for Cloud computing for programmers - DPS955 - Fall 2024

## SCRIPTS

### 1. Lint

```powershell
npm run lint
```

This command will run ESLint(tool used to identify and fix problems in the code) on all js files in the ./src. When we run this command, it will output any linting warnings or errors found in the codebase.

### 2. start

```powershell
npm run start
```

This command will start the application in production mode.

### 3. dev

```powershell
npm run dev
```

This command will start the application in development mode. Its useful during development to enable live reloading of the application and to get detailed debug output and helpful in testing and debugging as we make changes to the code.

### 4. debug

```powershell
npm run debug
```

Use this command to debug the application for in-depth code analysis and inspect its internal state by adding breakpoints and evaluating variables.

##### NOTE: The dev command uses nodemon to restart the server on file changes, while the debug command uses nodemon with the --inspect flag to enable debugging capabilities.
