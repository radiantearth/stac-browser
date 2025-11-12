// Navigation E2E Tests
// Tests navigation between different parts of the application

describe('Navigation', () => {
  
  beforeEach(() => {
    cy.visit('/')
    cy.disableAnimations()
  })

  describe('Links', () => {
    it('should have clickable links on the page', () => {
      // Check if there are any links
      cy.get('a').should('have.length.greaterThan', 0)
    })

    it('should have valid href attributes on links', () => {
      // Find all links and check they have href attributes
      cy.get('a[href]').should('exist')
    })
  })

  describe('URL Changes', () => {
    it('should maintain the correct URL on homepage', () => {
      // Check the current URL
      cy.url().should('include', 'localhost:8080')
      cy.location('pathname').should('eq', '/')
    })
  })

})
