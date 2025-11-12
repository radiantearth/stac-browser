// This file runs before each test file

// Import custom commands (we'll add them later)
import './commands'

// Ignore certain uncaught exceptions from third-party libraries
// (prevents tests from failing on non-critical errors)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the test from failing
  // You can add specific error messages to ignore if needed
  return false
})

// Custom command to disable animations (makes tests more reliable)
Cypress.Commands.add('disableAnimations', () => {
  cy.document().then((doc) => {
    const style = doc.createElement('style')
    style.innerHTML = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
      }
    `
    doc.head.appendChild(style)
  })
})
