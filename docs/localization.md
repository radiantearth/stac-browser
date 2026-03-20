# Localization <!-- omit in toc -->

- [Overview](#overview)
- [Adding a new language](#adding-a-new-language)
- [Custom phrases](#custom-phrases)

## Overview

STAC Browser can be translated into other languages and can localize number formats, date formats etc.

You need to change the [`locale`](./options.md#locale) and [`supportedLocales`](./options.md#supportedlocales) settings to select the default language and the languages available to users.

The following languages are currently supported:

- Arabic `ar`
- German `de` (Germany `de`, Switzerland `de-CH`)
- Spanish `es`
- English `en` (International `en`, US `en-US`, UK `en-GB`)
- French `fr` (Canada `fr-CA`, France `fr`, Switzerland `fr-CH`)
- Indonesian `id`
- Italian `it` (Italy `it`, Switzerland `it-CH`)
- Romanian `ro`
- Japanese `ja`
- Portuguese `pt` (Brazil `pt-BR`, Portugal `pt`)
- Polish `pl`

We manage the translations in Crowdin, please see <https://crowdin.com/project/stac-browser/> for details.

To add your own language, please follow the guide below: [Adding a new language](#adding-a-new-language)

The following contributors kindly provide the translations:

- [@jfbourgon](https://github.com/jfbourgon): `fr`, `fr-CA`
- [@jtreska](https://github.com/jtreska): `pl`
- [@amrirasyidi](https://github.com/amrirasyidi): `id`
- [@mneagul](https://github.com/mneagul): `ro`
- [@m-mohr](https://github.com/m-mohr): `de`, `en`, `en-GB`, `en-US`
- [@p1d1d1](https://github.com/p1d1d1): `de-CH`, `fr-CH`, `it`, `it-CH`
- [@psacra](https://github.com/psacra): `pt`
- [@randa-11295](https://github.com/randa-11295): `ar`
- [@rnanclares](https://github.com/rnanclares): `es`
- [@uba](https://github.com/uba): `pt-BR`

## Adding a new language

You can translate STAC Browser into other languages.
You can also use one of the existing languages and provide an alternate version for a specifc country, e.g. a Australian English (en-AU) version of the US-English language pack (en).

The following guide helps you to get started:

- Copy the `en` folder (or any other language without a country code that you want to base the translation on).
  - Note: If you start with the `en` folder, you have to remove the leading `//` from the line `// { fields: require('./fields.json') }` in the file `default.js`.
- Name the new folder according to [RFC5646](https://www.rfc-editor.org/rfc/rfc5646).
- Add the language to the list of supported locales ([`supportedLocales`](./options.md#supportedLocales)) in the `config.js` file.
- Add the language to the [list of languages in this file](#overview).
- Add yourself to the list of code owners (`.github/CODEOWNERS`) for this language (we'll invite you to this repository after you've opened a PR). **Persons contributing languages are expected to maintain them long-term! If you are not able to maintain the language pack, please indicate so in the PR and we'll release it separately.**
- Translate the `.json` files, most importantly `config.json`, `fields.json` and `texts.json`.
  - Please note that you never need to translate any object keys!
  - If you base your language on another existing language (e.g. create `en-IN` based on `en`) you can delete individual files and import existing files from other languages in `default.js`.
- Adapt the `datepicker.js`, `duration.js` and `validation.js` files to import the existing definitions from their corresponding external packages, but you could also define the specifics yourself.
- Check that your translation works by running the development server (`npm start`) and navigating to the STAC Browser instance in your browser (usually `http://localhost:8080`).
- Once completed, please open a pull request and we'll get back to you as soon as possible.
- After merging the PR for the first time, we'll add you to our translation management tool Crowdin: <https://crowdin.com/project/stac-browser/>. Please get in touch to get your invite!

## Custom phrases

You can define custom phrases in the `custom.json`.
This is especially useful for phrases that are coming from non-standadized metadata fields (see the chapter "[Additional metadata fields](./metadata.md#adding-custom-fields)").
If you've found metadata labels (e.g. "Price" and "Generation Time") that are not translated,
you can add it to the `custom.json`. For metadata fields you need to add it to a the object `fields`
as it is the group for the metadata-related phrases.
There you can add as many phrases as you like. For example:

```json
{
  "fields": {
    "Price": "Preis",
    "Generation Time": "Generierungszeit"
  }
}
```
