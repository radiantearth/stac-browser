import { id } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH.mm.ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = id;

export default {dateFormat, timeFormat, dateTimeFormat, locale};
