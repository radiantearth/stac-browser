import { frCA } from 'date-fns/locale';
const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;
const locale = frCA;
export default {dateFormat, timeFormat, dateTimeFormat, locale};
