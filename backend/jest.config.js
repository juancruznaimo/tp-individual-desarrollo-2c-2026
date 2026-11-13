export default {
  testEnvironment: 'node',
  transform: {},
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageThreshold: {
    './src/domain/': { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
};
