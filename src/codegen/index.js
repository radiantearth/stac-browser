import PythonGenerator from './PythonGenerator.js';
import JavaScriptGenerator from './JavaScriptGenerator.js';
import RGenerator from './RGenerator.js';
import CSharpGenerator from './CSharpGenerator.js';
import JavaGenerator from './JavaGenerator.js';
import RustGenerator from './RustGenerator.js';

/**
 * All available code generators, ordered by display preference.
 * Python is first as the most common STAC client language.
 */
export const generators = [
  PythonGenerator,
  JavaScriptGenerator,
  RGenerator,
  CSharpGenerator,
  JavaGenerator,
  RustGenerator
];

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
