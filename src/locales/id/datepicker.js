import { id as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH.mm.ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

locale.localize.day = (dayIndex, options = {}) => {
    const width = "custom";
    if (width === 'custom') {
        return dayValues[dayIndex];
    }
    // For wide or other widths, fall back to the base locale's full names
    return locale.localize.day(dayIndex, options);
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
