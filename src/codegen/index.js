import generators from '../../codeGenerators.config.js';

export { generators };

/**
 * Generate code for a given language.
 * @param {Function} GeneratorClass - The generator class to use
 * @param {string} catalogHref - The STAC API endpoint URL
 * @param {Object} filters - The search filter parameters
 * @returns {string} The generated code
 */
export function generateCode(GeneratorClass, catalogHref, filters) {
  const generator = new GeneratorClass(catalogHref, filters);
  return generator.generate();
}
