import { enUS } from 'date-fns/locale';

const dateFormat = 'MM/dd/yyyy';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = enUS;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
