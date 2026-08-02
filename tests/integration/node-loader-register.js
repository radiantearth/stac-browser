/**
 * Registration entry point for the custom Node.js loader hooks.
 *
 * Usage:  node --import ./node-loader-register.js ./generate-snippets.js
 */
import { register } from 'node:module';

register('./node-loader.js', import.meta.url);
