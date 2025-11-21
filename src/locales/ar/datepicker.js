import { ar } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const locale = {
  ...ar,
  localize: {
    ...ar.localize,
    // Override day to always use narrow width by default
    day: (dayIndex, options = {}) => {
        if (options.width === 'short') {
            options.width = 'narrow';
        }
      return ar.localize.day(dayIndex, options);
    },
  },

  options: {
    weekStartsOn: 1, // Monday is the first day of the week in Arabic countries
  },
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
