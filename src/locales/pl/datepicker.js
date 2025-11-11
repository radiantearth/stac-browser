import { pl } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = pl;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
