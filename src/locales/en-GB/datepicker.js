import { enGB } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = {
    ...enGB,
    options: {
        ...enGB.options,
        weekStartsOn: 1, // Monday is the first day of the week.
    },
};

export default {dateFormat, timeFormat, dateTimeFormat, locale};
