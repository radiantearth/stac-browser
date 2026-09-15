import { Registry, Helper } from '@radiantearth/stac-fields';
import config from './config.js';

// For details, please consult
// https://github.com/radiantearth/stac-browser/blob/main/docs/metadata.md

// ADD ADDITIONAL FIELDS AND EXTENSIONS HERE

// Registry.addExtension('osc', 'Open Science Catalogue');

// Registry.addMetadataField('themes', {
//     label: "Themes",
//     ext: "osc", 
//     formatter: value => {
//       if (!value) {
//         return "";
//       }
//       const formatConcept = (i) => {
//         if (!i) return "";
//         if (typeof i === 'object') {
//           return i.id || i.title || JSON.stringify(i);
//         }
//         return i;
//       };
//       if (Array.isArray(value)) {
//         const oscThemeObj = value.find(v => v && v.scheme === "OSC:SCHEME:THEMES");
//         if (oscThemeObj && Array.isArray(oscThemeObj.concepts)) {
//           return Helper.toList(oscThemeObj.concepts, true, formatConcept, false);
//         }
//         const themeWithConcepts = value.find(v => v && Array.isArray(v.concepts));
//         if (themeWithConcepts) {
//           return Helper.toList(themeWithConcepts.concepts, true, formatConcept, false);
//         }
//         return Helper.toList(value, true, formatConcept, false);
//       } else if (typeof value === 'object') {
//         if (Array.isArray(value.concepts)) {
//           return Helper.toList(value.concepts, true, formatConcept, false);
//         }
//         return formatConcept(value);
//       }
//       return String(value);
//     }
//   });

// Registry.addMetadataField('contacts', {
//     label: "Contacts",
//     ext: "osc",
// });

// const getPathPrefix = () => {
//   let prefix = config.pathPrefix || "/";
//   if (!prefix.startsWith("/")) {
//     prefix = "/" + prefix;
//   }
//   if (!prefix.endsWith("/")) {
//     prefix = prefix + "/";
//   }
//   return prefix;
// };

// const formatLink = (type, value, links, jsonName) => {
//   const link = links && Array.isArray(links) ? links.find(link => link.rel === 'related' && link.href && link.href.includes(value)) : null;
//   if (!link || !link.title) {
//     return value;
//   }
//   const parts = link.title.split(":");
//   const title = parts.length > 1 ? parts[1].trim() : link.title;
//   return Helper.toLink(`${getPathPrefix()}#/${type}/${value}/${jsonName}.json`, title, "", "_self");
// }

// Registry.addMetadataField('osc:project', {
//   label: "Project",
//   ext: "osc",
//   formatter: (value, field, spec, { links }) => {
//     return formatLink("projects", value, links, "collection")
//   }
// });

// Registry.addMetadataField('osc:themes', {
//   label: "Themes",
//   ext: "osc",
//   formatter: (value, field, spec, { links }) =>
//     value.map(theme => formatLink("themes", theme, links, "catalog")).join(", ")
// });

// Registry.addMetadataField('osc:variables', {
//   label: "Variables",
//   ext: "osc",
//   formatter: (value, field, spec, { links }) =>
//     value.map(variable => formatLink("variables", variable, links, "catalog")).join(", ")
// });

// Registry.addMetadataField('osc:missions', {
//   label: "Missions",
//   ext: "osc",
//   formatter: (value, field, spec, { links }) =>
//     value.map(mission => formatLink("eo-missions", mission, links, "catalog")).join(", ")
// });

Registry.fields.links.rel.mapping.vcs = "Version Control System";

// DEFINE FIELDS TO IGNORE IN METADATA RENDERING

/**
 * Function that can be used to change the ignored fields in the metadata rendering.
 * 
 * @type {function|null}
 * @param {STACObject|Object} object The entity for which the metadata is rendered.
 * @param {string[]} fields The fields ignored by default.
 * @param {string} type The type of the entity (e.g. `CatalogLike`, `Item`, `Asset`, `Link`, `Provider`).
 * @returns {string[]} The fields to ignore in the metadata rendering.
 */
const ignoreMetadata = (object, fields, type) => {
  if (type === 'CatalogLike' && object) {
    fields.push('access');
    Object.keys(object).forEach((key) => {
      if (key.startsWith("fair:") || key.startsWith("osc:")) {
        fields.push(key);
      }
    });
    fields.push('themes', 'variables', 'status', 'missions', 'region', 'project');
  }
  return fields;
};

export { ignoreMetadata };
