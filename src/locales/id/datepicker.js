import { id } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH.mm.ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

const localize = {
    ...id.localize,
    day: (dayIndex, options = {}) => {
        // buildLocalizeFn does not accept a `values` override via options,
        // so implement a direct override that returns our custom tokens
        const width = 'custom';
        if (width === 'custom') {
            return dayValues[dayIndex];
        }
        // For wide or other widths, fall back to the base locale's full names
        return id.localize.day(dayIndex, options);
    },
};

const locale = {
    ...id,
    localize,
    options: {
        ...id.options,
        weekStartsOn: 1, // Monday is the first day of the week.
        firstWeekContainsDate: 7, // The week that contains Jan 7th is the first week of the year.
    },
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
