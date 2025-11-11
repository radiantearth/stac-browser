import { pl } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// minimal override to support a custom 'min' width with two-letter weekday tokens
const minDayValues = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

const localize = {
	...pl.localize,
	day: (dayIndex) => {
		return minDayValues[dayIndex];
	},
};

const locale = {
	...pl,
	localize,
	// expose the custom min-width tokens for UI components
	dayValuesMin: minDayValues,
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
