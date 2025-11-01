import { fr } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = fr;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
