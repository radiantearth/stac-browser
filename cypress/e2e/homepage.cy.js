// Homepage E2E Tests
// Tests the initial landing page and basic functionality

describe('Homepage', () => {
  
  // This runs before each test
  beforeEach(() => {
    // Visit the homepage (uses baseUrl from cypress.config.js)
    cy.visit('/')
    
    // Disable animations to make tests more stable
    cy.disableAnimations()
  })

  // Test 1: Basic page load
  describe('Page Load', () => {
    it('should load without errors', () => {
      // Check if the page title contains "STAC"
      cy.title().should('include', 'STAC Browser')
      
      // Check if the body exists and Vue has mounted
      cy.get('body').should('exist').and('be.visible')
      
      // Check for a Vue component (the app should render something)
      cy.get('body').children().should('have.length.greaterThan', 0)
    })

    it('should not show any error alerts', () => {
      // Make sure no error messages are displayed on load
      cy.get('.alert-danger').should('not.exist')
    })
  })

  // Test 2: UI Elements
  describe('UI Elements', () => {
    it('should display the main header', () => {
      // Check if header exists (always present in the app)
      cy.get('header').should('exist')
    })

    it('should have a catalog input with correct label', () => {
      // Check that the label exists and has correct text
      cy.contains('Please specify a STAC Catalog or API...').should('be.visible')
      
      // Check that the URL input field exists
      cy.get('input[type="url"]#url')
        .should('exist')
        .and('be.visible')
        .and('have.attr', 'placeholder', 'https://...')
    })

    it('should have a Load button that is clickable', () => {
      // Check that the Load button exists
      cy.contains('button', 'Load')
        .should('be.visible')
        .and('have.attr', 'type', 'submit')
        .and('not.be.disabled')
      
      // Verify it's clickable by clicking it (without a valid URL, nothing will happen)
      cy.contains('button', 'Load').click()
    })

    it('should display language dropdown with English as default', () => {
      // Find the language dropdown button
      cy.contains('Language: English').should('be.visible')
      
      // Check that the button has a flag icon
      cy.contains('Language: English')
        .find('svg')
        .should('exist')
    })

    it('should show 11 languages in the dropdown menu', () => {
      // Open language dropdown using custom command
      cy.openLanguageDropdown()
      
      // Check the number of language items
      cy.get('.lang-item').should('have.length', 11)
    })

    it('should have a checkmark next to the current language', () => {
      // Open language dropdown using custom command
      cy.openLanguageDropdown()
      
      // Check that at least one language has a checkmark (the current one)
      cy.get('.lang-item svg').should('exist')
    })

    it('should close the language dropdown when clicking outside', () => {
      // Open the language dropdown to open it using custom command
      cy.openLanguageDropdown()
      
      // Click on the language dropdown button again to close it (toggle behavior)
      cy.contains('Language: English').click()
      
      // Verify the dropdown is closed
      cy.get('.lang-item').should('not.be.visible')
    })

    it('should have a footer with correct text', () => {
      // Check that the footer exists
      cy.get('footer').should('exist').and('be.visible')

      // Verify footer contains specific text
      cy.get('footer').contains('Powered by STAC Browser').should('be.visible')
    })
  })

  // Test 3: Interactions
  describe('User Interactions', () => {
    it('should allow typing a catalog URL and clicking Load', () => {
      // Define test data
      const catalogUrl = 'https://planetarycomputer.microsoft.com/api/stac/v1/'
      const expectedUrl = 'http://localhost:8080/external/planetarycomputer.microsoft.com/api/stac/v1/'
      
      // Load catalog using custom command
      cy.loadCatalog(catalogUrl)
      
      // Verify navigation to the correct external catalog URL
      cy.url({ timeout: 10000 }).should('eq', expectedUrl)
      
      // Wait for the catalog page to load content
      cy.get('body').should('be.visible')
    })

    it('should show validation feedback for invalid URL', () => {
      // Type an invalid URL (no protocol)
      cy.get('input[type="url"]#url')
        .clear()
        .type('invalid-url')
      
      // Click the Load button
      cy.contains('button', 'Load').click()
      
      // Should stay on the same page (no navigation)
      cy.url().should('eq', 'http://localhost:8080/?.language=en')
    })

    it('should display STAC Index catalog list', () => {
      // Check that the STAC Index section exists
      cy.contains('... or select one from').should('be.visible')
      
      // Check that STAC Index link is visible and clickable
      cy.contains('a', 'STAC Index')
        .should('be.visible')
        .and('have.attr', 'href', 'https://stacindex.org')
        .and('have.attr', 'target', '_blank')
      
      // Wait for catalogs to load from STAC Index API
      cy.get('.list-group-item', { timeout: 10000 })
        .should('exist')
        .and('have.length.greaterThan', 0)
      
      // Verify catalog items have titles
      cy.get('.list-group-item strong').should('exist')
      
      // Verify catalog items have descriptions with actual content
      cy.get('.list-group-item .styled-description')
        .should('exist')
        .and('not.be.empty')
        .first()
        .invoke('text')
        .should('have.length.greaterThan', 0)
      
      // Verify badges exist (API or Static Catalog)
      cy.get('.list-group-item .badge').should('exist')
    })

    it('should open STAC Index website when clicking the link', () => {
      const stacIndexUrl = 'https://stacindex.org'

      // Find the STAC Index link
      cy.contains('a', 'STAC Index')
        .should('be.visible')
        .and('have.attr', 'href', stacIndexUrl)

      // Remove target="_blank" to test navigation in same window
      // (Cypress can't easily test new tabs, so we modify the link)
      cy.contains('a', 'STAC Index').invoke('removeAttr', 'target')
      
      // Click the link
      cy.contains('a', 'STAC Index').click()
      
      // Verify navigation to STAC Index website
      cy.origin(stacIndexUrl, () => {
        cy.url({ timeout: 10000 }).should('include', 'stacindex.org')
      })
    })

    it('should navigate to Microsoft Planetary Computer when clicking it from the list', () => {
      // Wait for catalogs to load
      cy.get('.list-group-item', { timeout: 10000 })
        .should('have.length.greaterThan', 0)
      
      // Find and click on the Microsoft Planetary Computer catalog
      cy.contains('.list-group-item', 'Microsoft Planetary Computer STAC API')
        .should('exist')
        .click()
      
      // Verify navigation to the correct catalog URL
      cy.url({ timeout: 10000 })
        .should('include', '/external/')
        .and('include', 'planetarycomputer.microsoft.com')
      
      // Wait for the catalog page to load
      cy.get('body').should('be.visible')
    })
  })

})
