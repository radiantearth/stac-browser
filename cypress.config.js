const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    // Your app runs on localhost:8080 when you do `npm start`
    baseUrl: 'http://localhost:8080',
    
    // Where Cypress looks for test files
    specPattern: 'cypress/e2e/**/*.cy.{js,ts}',
    
    // Support file with helper commands
    supportFile: 'cypress/support/e2e.js',
    
    // Browser window size for tests
    viewportWidth: 1280,
    viewportHeight: 800,
    
    // Retry failed tests in CI (helpful for flaky tests)
    retries: {
      runMode: 2,    // retry twice when running `cypress run`
      openMode: 0    // don't retry in interactive mode
    },
    
    // How long to wait for elements to appear
    defaultCommandTimeout: 8000,
    
    setupNodeEvents(on, config) {
      // You can add plugins here later
      return config
    }
  }
})
