import { de } from 'date-fns/locale';

const dateFormat = 'dd.MM.yyyy';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = de;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
