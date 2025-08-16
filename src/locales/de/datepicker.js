const dateFormat = 'D.M.YYYY';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const locale = import('vue2-datepicker/locale/de');
export default {dateFormat, timeFormat, dateTimeFormat, locale};
