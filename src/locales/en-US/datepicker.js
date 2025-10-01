import { enUS } from 'date-fns/locale';

const dateFormat = 'MM/dd/yyyy';
const timeFormat = 'hh:mm:ss a';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = {
    ...enUS,
    options: {
        ...enUS.options,
        weekStartsOn: 0, // Sunday as first day of the week
    },
};

export default {dateFormat, timeFormat, dateTimeFormat, locale};
