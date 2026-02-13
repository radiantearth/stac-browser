import { enGB as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
