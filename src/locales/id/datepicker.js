import { id as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH.mm.ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['Mg', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];
const super_ = locale.localize.day;
locale.localize.day = (dayIndex, options = {}) => {
  if (options.width === 'short') {
    return dayValues[dayIndex];
  }
  return super_(dayIndex, options);
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
