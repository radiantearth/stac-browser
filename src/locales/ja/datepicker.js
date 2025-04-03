const dateFormat = 'YYYY/MM/DD';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const locale = import('vue2-datepicker/locale/ja');
export default {dateFormat, timeFormat, dateTimeFormat, locale};
