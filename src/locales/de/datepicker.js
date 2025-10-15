import { de } from 'date-fns/locale';

const dateFormat = 'd.M.yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = de;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
