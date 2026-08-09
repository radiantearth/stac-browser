import { STAC } from 'stac-js';
import { hasText, isObject } from 'stac-js/src/utils.js';
import { toAbsolute } from 'stac-js/src/http.js';
import BrowserStorage from '../browser-store';
import { getDisplayTitle } from '../models/stac';

const STORAGE_KEY = 'favorites';
const TYPES = ['Catalog', 'Collection', 'Item'];
const CSV_FIELDS = ['href', 'title', 'type'];

// Normalizes a STAC entity or a plain object (e.g. from an imported file)
// into a favorite entry. Returns null for invalid input.
export function toFavorite(source) {
  if (source instanceof STAC) {
    let type = 'Catalog';
    if (source.isCollection) {
      type = 'Collection';
    }
    else if (source.isItem) {
      type = 'Item';
    }
    return {
      href: source.getAbsoluteUrl(),
      title: getDisplayTitle(source),
      type
    };
  }
  else if (isObject(source) && hasText(source.href)) {
    return {
      href: source.href,
      title: hasText(source.title) ? source.title : null,
      type: TYPES.includes(source.type) ? source.type : 'Catalog'
    };
  }
  return null;
}

// Serializes the favorites to CSV (RFC 4180) with a header row.
// Use the separator ; for a file that Excel can open by default.
export function toCsv(favorites, separator = ',') {
  const escape = value => {
    value = hasText(value) ? value : '';
    if (value.includes(separator) || /["\r\n]/.test(value)) {
      value = `"${value.replaceAll('"', '""')}"`;
    }
    return value;
  };
  const rows = [CSV_FIELDS].concat(
    favorites.map(favorite => CSV_FIELDS.map(field => favorite[field]))
  );
  return rows.map(row => row.map(escape).join(separator)).join('\r\n');
}

// Serializes the favorites to a STAC Catalog that links to them.
export function toStacCatalog(favorites, title, description = null) {
  return {
    type: 'Catalog',
    stac_version: '1.1.0',
    id: 'stac-browser-favorites',
    title,
    description: hasText(description) ? description : title,
    links: favorites.map(favorite => {
      const isItem = favorite.type === 'Item';
      const link = {
        rel: isItem ? 'item' : 'child',
        href: favorite.href,
        type: isItem ? 'application/geo+json' : 'application/json'
      };
      if (!isItem) {
        // child links don't distinguish between catalogs and collections
        link.stac_type = favorite.type;
      }
      if (hasText(favorite.title)) {
        link.title = favorite.title;
      }
      return link;
    })
  };
}

// Parses CSV (RFC 4180) into an array of rows (arrays of strings).
function parseCsvRows(text, separator) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      }
      else if (char === '"') {
        inQuotes = false;
      }
      else {
        field += char;
      }
    }
    else if (char === '"') {
      inQuotes = true;
    }
    else if (char === separator) {
      row.push(field);
      field = '';
    }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
    }
    else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Converts CSV with a header row into favorite entries.
// The separator (e.g. ; for Excel exports) is detected from the header row.
function fromCsv(text) {
  const firstRow = text.split(/[\r\n]/, 1)[0];
  const count = char => firstRow.split(char).length - 1;
  const separator = count(';') > count(',') ? ';' : ',';
  const rows = parseCsvRows(text, separator);
  const header = rows.shift()?.map(cell => cell.trim().toLowerCase());
  if (!header || !header.includes('href')) {
    throw new Error('CSV must have a header row with a href column');
  }
  return rows
    .filter(row => row.some(cell => cell.length > 0))
    .map(row => {
      const entry = {};
      header.forEach((key, i) => {
        entry[key] = row[i];
      });
      return entry;
    });
}

// Converts the links of a STAC Catalog (or Collection) into favorite entries.
function fromStacLinks(data) {
  if (!isObject(data) || !Array.isArray(data.links)) {
    return null;
  }
  // Resolve relative links against the self link, e.g. for catalogs
  // that were not exported from STAC Browser.
  const self = data.links.find(link => isObject(link) && link.rel === 'self' && hasText(link.href));
  return data.links
    .filter(link => isObject(link) && ['child', 'item'].includes(link.rel) && hasText(link.href))
    .map(link => {
      let type = 'Catalog';
      if (link.rel === 'item') {
        type = 'Item';
      }
      else if (link.stac_type === 'Collection') {
        type = 'Collection';
      }
      return {
        href: self ? toAbsolute(link.href, self.href) : link.href,
        title: link.title,
        type
      };
    });
}

// Parses an imported file (JSON, STAC Catalog or CSV) into favorite entries.
// Throws an error if the content is not in any of the supported formats.
export function parseImport(text) {
  if (text.charCodeAt(0) === 0xFEFF) { // Remove the BOM, e.g. from Excel exports
    text = text.slice(1);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return fromCsv(text);
  }
  if (Array.isArray(data)) {
    return data;
  }
  const favorites = fromStacLinks(data);
  if (!favorites) {
    throw new Error('JSON is neither a list of favorites nor a STAC Catalog');
  }
  return favorites;
}

function loadFromStorage() {
  const storage = new BrowserStorage();
  const data = storage.get(STORAGE_KEY);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map(toFavorite).filter(Boolean);
}

function persist(favorites) {
  const storage = new BrowserStorage();
  storage.set(STORAGE_KEY, favorites);
}

export default {
  namespaced: true,
  state: {
    favorites: loadFromStorage()
  },
  getters: {
    isFavorite: state => source => {
      const favorite = toFavorite(source);
      return Boolean(favorite) && state.favorites.some(other => other.href === favorite.href);
    }
  },
  mutations: {
    add(state, favorite) {
      state.favorites.push(favorite);
      persist(state.favorites);
    },
    remove(state, href) {
      state.favorites = state.favorites.filter(favorite => favorite.href !== href);
      persist(state.favorites);
    },
    set(state, favorites) {
      state.favorites = favorites;
      persist(state.favorites);
    }
  },
  actions: {
    toggle(cx, source) {
      const favorite = toFavorite(source);
      if (!favorite) {
        return;
      }
      if (cx.getters.isFavorite(source)) {
        cx.commit('remove', favorite.href);
      }
      else {
        cx.commit('add', favorite);
      }
    },
    // Merges the given list (e.g. from an exported file) into the existing
    // favorites and returns the number of newly added entries.
    import(cx, data) {
      if (!Array.isArray(data)) {
        throw new Error('Invalid data');
      }
      const merged = cx.state.favorites.slice(0);
      let added = 0;
      for (const entry of data) {
        const favorite = toFavorite(entry);
        if (favorite && !merged.some(other => other.href === favorite.href)) {
          merged.push(favorite);
          added++;
        }
      }
      if (added > 0) {
        cx.commit('set', merged);
      }
      return added;
    }
  }
};
