import { ja } from 'date-fns/locale';

const dateFormat = 'yyyy/MM/dd';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = ja;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
