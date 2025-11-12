// Custom Cypress commands for STAC Browser tests

// Command to open the language dropdown
Cypress.Commands.add('openLanguageDropdown', () => {
  cy.contains('Language: English').click()
  cy.get('.lang-item').should('be.visible')
})

// Command to load a catalog by typing URL and clicking Load
Cypress.Commands.add('loadCatalog', (catalogUrl) => {
  cy.get('input[type="url"]#url')
    .clear()
    .type(catalogUrl)
    .should('have.value', catalogUrl)
  cy.contains('button', 'Load').click()
})

// Command to wait for STAC Index catalogs to load
Cypress.Commands.add('waitForStacIndexCatalogs', () => {
  cy.get('.list-group-item', { timeout: 10000 })
    .should('exist')
    .and('have.length.greaterThan', 0)
})

// Example of other useful commands you could add:
// 
// Cypress.Commands.add('selectLanguage', (language) => {
//   cy.openLanguageDropdown()
//   cy.contains('.lang-item', language).click()
// })
//
// Cypress.Commands.add('selectCatalogFromIndex', (catalogTitle) => {
//   cy.waitForStacIndexCatalogs()
//   cy.contains('.list-group-item', catalogTitle).click()
// })
