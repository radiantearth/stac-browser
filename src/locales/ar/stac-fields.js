import I18N from '@radiantearth/stac-fields/I18N';

export default function run(/*locale*/) {
  const defaults = I18N.getDefaults();
  // We want the globally recommended number format with spaces as thousands separator
  // and a dot as decimal separator, which is available in e.g. fr-FR
  I18N.numberFormatter = new Intl.NumberFormat("fr-FR", defaults.numberFormatterOptions);
  // We want ISO formatting for the date, which is available in e.g. sv-SE
  I18N.dateFormatter = new Intl.DateTimeFormat("sv-SE", defaults.dateFormatterOptions);
  // We want ISO formatting for the date and time, which is available in e.g. sv-SE
  I18N.dateTimeFormatter = new Intl.DateTimeFormat("sv-SE", {
		day: 'numeric',
		month: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
		timeZone: "UTC",
		timeZoneName: "short"
	});
}
