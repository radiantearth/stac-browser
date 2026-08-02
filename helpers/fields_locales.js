import Fields from '@radiantearth/stac-fields/fields-normalized.json' with { type: 'json' };
import HardCodedFields from './fields_locales.json' with { type: 'json' };
import fs from 'fs';

const translatable = ["label", "explain", "unit"];
const iterable = ["items", "properties"];
const dest_file = "src/locales/en/fields.json";

function ignore(text, path, otherPath) {
  if (path.endsWith(".unit")) {
    return true;
  }
  if (path.includes(".id.") || path.includes(".name.") || path.includes(".title.") || path.includes(".description.")) {
    return true;
  }
  if (path.includes(".href") || path.includes(".roles.")) {
    return true;
  }
  if (path.includes(".average.") || path.includes(".minimum.") || path.includes(".maximum.") || path.includes(".stddev.")) {
    return true;
  }
  if (path.includes("cube:") && otherPath.includes("cube:")) {
    return true;
  }
  if (path.includes("links.type.") && otherPath.includes("assets.type.")) {
    return true;
  }
  if (path.includes(".mgrs.")) {
    return true;
  }
  return false;
}

function addText(locales, text, path) {
  if (locales[text] && !ignore(text, path, locales[text])) {
    console.warn(`Potential conflict between '${path}' and '${locales[text]}'`);
  }
  locales[text] = path;
}

function findTexts(locales, fields, path) {
  for(let name in fields) {
    let field = fields[name];
    if (field.alias) {
      continue;
    }

    translatable.forEach(key => field[key] && addText(locales, field[key], `${path}.${name}.${key}`));
    iterable.forEach(key => field[key] && findTexts(locales, field[key], `${path}.${name}.${key}`));
    if (field.mapping) {
      Object.entries(field.mapping).forEach(([key, text]) => addText(locales, text, `${path}.${name}.mapping.${key}`));
    }
  }
}

function writeToFile(file, locales) {
  const data = {};
  Object.keys(locales).sort().forEach(key => data[key] = key);
  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(file, json + "\n");
}

function generateLocales() {
  const locales = {};
  HardCodedFields.forEach(text => addText(locales, text, "hardcoded"));
  const types = ["assets", "extensions", "links", "metadata"];
  types.forEach(type => findTexts(locales, Fields[type], type));
  writeToFile(dest_file, locales);
}

console.log(`Generating fields locale file`);
generateLocales();
console.log(`Saved fields locale file to ${dest_file}`);
