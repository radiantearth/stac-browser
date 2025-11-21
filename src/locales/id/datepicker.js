import { id } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH.mm.ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const customDayValues = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

const locale = {
  ...id,
  localize: {
    ...id.localize,
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
