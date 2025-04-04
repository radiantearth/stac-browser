const dateFormat = 'DD/MM/YYYY';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const locale = import('vue2-datepicker/locale/en');
locale.formatLocale.firstDayOfWeek = 1;
export default {dateFormat, timeFormat, dateTimeFormat, locale};
