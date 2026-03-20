# Metadata fields <!-- omit in toc -->

- [Adding custom fields](#adding-custom-fields)
  - [Example](#example)
  - [Translation](#translation)

The metadata that STAC Browser renders is rendered primarily through the library [`stac-fields`](https://www.npmjs.com/package/@radiantearth/stac-fields).
It contains a lot of rules for rendering [many existing STAC extensions](https://github.com/stac-utils/stac-fields/blob/main/fields.json) in a human-friendly way.

## Adding custom fields

If you use custom extensions to the STAC specification you may want to register your own rendering rules for the new fields.
This can be accomplished by customizing the file [`fields.config.js`](../fields.config.js).
It uses a Registry defined in stac-fields to add more extensions and fields to stac-fields and STAC Browser.

To add your own fields, please consult the documentation for the [Registry](https://github.com/stac-utils/stac-fields/blob/main/README.md#registry).

### Example

If you have a custom extension with the title "Radiant Earth" that uses the prefix `radiant:` you can add the extension as such:

```js
Registry.addExtension("radiant", "Radiant Earth");
```

If this extension has a boolean field `radiant:public_access` that describes whether an entity can be accessed publicly or not, this could be described as follows:

```js
Registry.addMetadataField("radiant:public_access", {
  label: "Data Access",
  formatter: (value) => (value ? "Public" : "Private"),
});
```

This displays the field (with a value of `true`) in STAC Browser as follows: `Data Access: Public`.

The first parameter is the field name, the second parameter describes the field using a ["field specification"](https://github.com/stac-utils/stac-fields/blob/main/README.md#fieldsjson).
Please check the field specification for available options.

### Translation

STAC Browser supports [multiple languages](../README.md#languages).
If you use more than one language, you likely want to also translate the phrases that you've added above (in the example `Data Access`, `Public` and `Private`, assuming that `Radiant Earth` is a name and doesn't need to be translated).
All new phrases should be added to the [active languages](./options.md#supportedlocales).
To add the phrases mentioned above you need to go through the folders in `src/locales` and in the folders of the active languages update the file `custom.json` as described in the section that describes [adding custom phrases](./localization.md#custom-phrases).
All new phrases must be added to the property `fields`.

Below you can find an example of an updated `custom.json` for the German language (folder `de`). It also includes the `authConfig`, which is contained in the file by default for [other purposes](./options.md#authconfig).

```json
{
  "authConfig": {
    "description": ""
  },
  "fields": {
    "Data Access": "Zugriff auf die Daten",
    "Public": "Öffentlich",
    "Private": "Privat"
  }
}
```
