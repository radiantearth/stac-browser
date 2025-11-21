import { pl as locale } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// minimal override to support a custom 'min' width with two-letter weekday tokens
const minDayValues = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];

locale.localize.day = (dayIndex) => {
	return minDayValues[dayIndex];
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
