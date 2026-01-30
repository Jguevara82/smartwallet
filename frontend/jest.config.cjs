module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|react-router|react-router-dom|@remix-run)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: 'http://localhost:3000',
      },
    },
  },
};
