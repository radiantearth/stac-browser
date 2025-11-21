import { it } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['do', 'lu', 'ma', 'me', 'gi', 've', 'sa'];

const locale = {
  ...it,
  localize: {
    ...it.localize,
    // Override day to use custom short tokens for compact calendar headers
    day: (dayIndex, options = {}) => {
      if (options.width === 'short') {
        return dayValues[dayIndex];
      }
        return locale.localize.day(dayIndex, options);
    },
  },
};

export default {dateFormat, timeFormat, dateTimeFormat, locale};
