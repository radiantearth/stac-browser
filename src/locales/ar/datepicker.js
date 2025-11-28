// According to https://en.wikipedia.org/wiki/List_of_date_formats_by_country
// many countries that use Arabic as their official language use the DD/MM/YYYY date format.
const dateFormat = 'DD/MM/YYYY';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const locale = require('vue2-datepicker/locale/ar');
export default {dateFormat, timeFormat, dateTimeFormat, locale};
