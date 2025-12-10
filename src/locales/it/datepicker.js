import { it as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['do', 'lu', 'ma', 'me', 'gi', 've', 'sa'];
const super_ = locale.localize.day;
locale.localize.day = (dayIndex, options = {}) => {
  if (options.width === 'short') {
    return dayValues[dayIndex];
  }
  return super_(dayIndex, options);
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
