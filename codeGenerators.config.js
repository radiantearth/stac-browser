import PythonGenerator from './src/codegen/PythonGenerator.js';
import JavaScriptGenerator from './src/codegen/JavaScriptGenerator.js';
import RGenerator from './src/codegen/RGenerator.js';
import CSharpGenerator from './src/codegen/CSharpGenerator.js';
import JavaGenerator from './src/codegen/JavaGenerator.js';
import RustGenerator from './src/codegen/RustGenerator.js';

/**
 * All available code generators, ordered by display preference.
 * Python is first as the most common STAC client language.
 */
export default [
  CSharpGenerator,
  JavaGenerator,
  JavaScriptGenerator,
  PythonGenerator,
  RGenerator,
  RustGenerator
];

export const defaultGenerator = PythonGenerator;
