import I18N from '@radiantearth/stac-fields/I18N';

export default function run(/*locale*/) {
  const defaults = I18N.getDefaults();
  // We want the globally understandable number format with no thousands separator (useGrouping: false)
  // and a dot as decimal separator to avoid ambiguity
  I18N.numberFormatter = new Intl.NumberFormat("en-001", Object.assign(defaults.numberFormatterOptions, {
    useGrouping: false,
  }));
  // We want ISO formatting for the date (and time), which is available in e.g. sv-SE
  // See also: https://stackoverflow.com/questions/25050034/get-iso-8601-using-intl-datetimeformat
  I18N.dateFormatter = new Intl.DateTimeFormat("sv-SE", defaults.dateFormatterOptions);
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
