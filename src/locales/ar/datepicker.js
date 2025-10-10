import { ar } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = {
    ...ar,
    options: {
        ...ar.options,
        weekStartsOn: 1, // Monday is the first day of the week.
    }, 
};

export default {dateFormat, timeFormat, dateTimeFormat, locale};
