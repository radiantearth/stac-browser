import { ja as locale } from 'date-fns/locale';

const dateFormat = 'yyyy/MM/dd';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

locale.options.firstWeekContainsDate = 6; // The week that contains Jan 1st is the first week of the year.

export default { dateFormat, timeFormat, dateTimeFormat, locale };
