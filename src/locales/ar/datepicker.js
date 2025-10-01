import { ar } from 'date-fns/locale';

const format = 'yyyy-MM-dd';

const locale = {
    ...ar,
    options: {
        ...ar.options,
        weekStartsOn: 1, // Monday is the first day of the week.
    }, 
};

export default {format, locale};
