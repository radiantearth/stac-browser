const format = 'YYYY-MM-DD';
const locale = import('vue2-datepicker/locale/ar');
(await locale).default.formatLocale.firstDayOfWeek = 1;
export default {format, locale};
