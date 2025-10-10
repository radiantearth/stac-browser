import { enGB } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = enGB;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
