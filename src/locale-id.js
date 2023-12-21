// This code is based on https://github.com/cherry-projects/locale-id
// Due to the "heavy" dependencies, it has been slimmed down

// http://userguide.icu-project.org/locale
export default function parse(locale) {
  if (!locale) {
    return undefined;
  }

  // extract keyword
  const stringLocale = String(locale);
  const keywordPos = stringLocale.indexOf('@');

  const keyword = keywordPos !== -1
    ? stringLocale.substr(keywordPos + 1)
    : undefined;

  const localeWithoutKeyword = keywordPos !== -1
    ? stringLocale.substr(0, keywordPos)
    : stringLocale;

  // en-us => en_us
  const parts = String(localeWithoutKeyword)
    .replace(/-/g, '_')
    .split('_');

  if (!parts.length || parts.length > 4) {
    return undefined;
  }

  const language = parts.shift();
  if (!language) {
    return undefined;
  }

  const retVar = {
    keyword,
    language: language.toLowerCase(),
  };

  if (!parts.length) {
    return retVar;
  }

  if (parts.length === 3) {
    const variant = parts.pop();
    if (variant) {
      retVar.variant = variant.toUpperCase();
    }
  }

  let country = parts.pop();
  if (country.length > 3) {
    retVar.keyword = country;

    country = parts.pop();
  }

  if (country) {
    retVar.country = country.toUpperCase();
  }

  if (!parts.length) {
    return retVar;
  }

  const script = parts.pop();
  if (typeof script === 'string' && script.length >= 1) {
    retVar.script = script[0].toUpperCase() + script.substring(1).toLowerCase();
  }

  return retVar;
}

export function normalize(locale, delimeter = '_') {
  const obj = parse(locale);
  if (!obj) {
    return obj;
  }

  let result = obj.language;

  if (obj.script) {
    result += `${delimeter}${obj.script}`;
  }

  if (obj.country) {
    result += `${delimeter}${obj.country}`;
  }

  return result;
}

const splitAcceptLanguageRegEx = /([a-z]{1,8}(-[a-z]{1,8})?)\s*(;\s*q\s*=\s*(1|0\.[0-9]+))?/ig;
const acceptLanguageItemRegEx = /^([a-z]{1,8}(-[a-z]{1,8})?)/i;

export function normalizeAcceptLanguage(acceptLanguage) {
  const returnItems = [];
  if (!acceptLanguage) {
    return returnItems;
  }

  const items = acceptLanguage.match(splitAcceptLanguageRegEx) || [];
  items.forEach(acceptLanguageItem => {
    const matches = acceptLanguageItem.match(acceptLanguageItemRegEx) || [];
    const locale = normalize(matches[0]);
    if (locale) {
      returnItems.push(locale);
    }
  });

  return returnItems;
}

export function prepareSupported(supported) {
  const lgs = {};

  supported.forEach(supportedLocale => {
    const { language, country } = parse(supportedLocale);
    if (!language) {
      throw new Error(`Locale ${supportedLocale} is not parsable`);
    }

    if (!lgs[language]) {
      lgs[language] = {
        countries: {},
        firstCountry: undefined,
        main: undefined,
      };
    }

    const lg = lgs[language];
    if (country) {
      lg.countries[country] = supportedLocale;

      if (!lg.firstCountry) {
        lg.firstCountry = supportedLocale;
      }
    } else {
      lg.main = supportedLocale;
    }
  });

  return lgs;
}

export function getBest(supported, locale, defaultLocale, getAnyCountry) {
  const lgs = Array.isArray(supported) ? prepareSupported(supported) : supported;

  // return defaultLocale if current locale is undefined
  if (!locale && defaultLocale) {
    return getBest(supported, defaultLocale, undefined, getAnyCountry);
  }

  if (!locale) {
    return undefined;
  }

  const { language, country } = parse(locale);
  if (!language) {
    return defaultLocale;
  }

  // selected locale is not supported
  if (!lgs[language]) {
    if (locale === defaultLocale) {
      return undefined;
    }

    return getBest(supported, defaultLocale, null, getAnyCountry);
  }

  const { countries, main = defaultLocale, firstCountry } = lgs[language];
  if (!countries || !country) {
    if (getAnyCountry && firstCountry) {
      return firstCountry;
    }

    return main;
  }

  if (getAnyCountry && firstCountry) {
    return countries[country] ? countries[country] : firstCountry;
  }

  return countries[country] ? countries[country] : main;
}
