import { ar } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// Minimal override: default weekday width is 'narrow'. Delegate to base locale otherwise.
locale.localize.day = (dayIndex, options = {}) => {
    const width = 'narrow';
    return ar.localize.day(dayIndex, { ...options, width });
};

locale.options.weekStartsOn = 1; // Monday is the first day of the week.
locale.options.firstWeekContainsDate = 12; // The week that contains Jan 12th is the first week of the year.

export default { dateFormat, timeFormat, dateTimeFormat, locale };
