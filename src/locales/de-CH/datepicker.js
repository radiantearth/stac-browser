import { de as locale } from 'date-fns/locale';

const dateFormat = 'dd.MM.yyyy';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
