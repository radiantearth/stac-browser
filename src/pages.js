import { hasText, isObject } from 'stac-js/src/utils.js';
import { getBest } from 'stac-js/src/locales';
import pagesConfig from '../pages.config';

export const PAGE_PATH_PREFIX = '/pages/';

export function mergePages(runtimePages) {
  const pages = Object.assign({}, isObject(runtimePages) ? runtimePages : {});
  const buildPages = isObject(pagesConfig?.pages) ? pagesConfig.pages : {};
  for (const id in buildPages) {
    if (pages[id]) {
      console.warn(`The page '${id}' is defined in pages.config.js and in the pages option, using the one from pages.config.js.`);
    }
    pages[id] = buildPages[id];
  }
  for (const id in pages) {
    if (!isObject(pages[id])) {
      console.error(`The page '${id}' is not an object and is not shown.`);
      delete pages[id];
    }
  }
  return pages;
}

// Returns the value for the given locale from a string or an object keyed by locale
export function getLocalizedValue(value, locale, fallbackLocale) {
  if (!isObject(value)) {
    return value;
  }
  const locales = Object.keys(value);
  if (locales.length === 0) {
    return undefined;
  }
  const best = getBest(locales, locale, fallbackLocale);
  return value[best] ?? value[locales[0]];
}

export function isPageVisible(id, page, state, getters) {
  if (typeof page.condition !== 'function') {
    return true;
  }
  try {
    return Boolean(page.condition({ state, getters }));
  } catch (error) {
    console.error(`Condition for page '${id}' failed:`, error);
    return false;
  }
}

export function getPageTitle(page, id, locale, fallbackLocale) {
  const title = getLocalizedValue(page.title, locale, fallbackLocale);
  return hasText(title) ? title : id;
}
