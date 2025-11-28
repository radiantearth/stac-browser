import { ja as locale } from 'date-fns/locale';

const dateFormat = 'yyyy/MM/dd';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

export default { dateFormat, timeFormat, dateTimeFormat, locale };
