import { pt } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// minimal override to support a custom 'min' width with two-letter weekday tokens
const customDayValues = ['Do', '2ª', '3ª', '4ª', '5ª', '6ª', 'Sá'];

const locale = {
  ...pt,
  localize: {
    ...pt.localize,
    // Override day to use custom short tokens for compact calendar headers
    day: (dayIndex, options = {}) => {
      if (options.width === 'short') {
        return customDayValues[dayIndex];
      }
      return locale.localize.day(dayIndex, options);
    },
  },
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
