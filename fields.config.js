import { Registry, Helper } from '@radiantearth/stac-fields';

// Please consult https://github.com/radiantearth/stac-browser/blob/main/README.md#additional-metadata-fields for details.

// Registry.addExtension('radiant', 'Radiant Earth');
// Registry.addMetadataField('radiant:public_access', {
//     label: "Data Access",
//     formatter: value => value ? "Public" : "Private"
// });

Registry.addExtension('osc', 'Open Science Catalog');

Registry.addMetadataField('themes', {
    label: "Themes",
    ext: "osc", 
    formatter: value => Helper.toList(value.find(v => v.scheme === "OSC:SCHEME:THEMES").concepts, true, (i) => i.id, false)
    // check in value if thema is correct (themes)
  });

Registry.addMetadataField('contacts', {
    label: "Contacts",
    ext: "osc",
});