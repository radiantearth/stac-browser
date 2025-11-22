import { ar as locale } from 'date-fns/locale';

const dateFormat = 'yyyy-MM-dd';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const super_ = locale.localize.day;
locale.localize.day = (dayIndex, options = {}) => {
  if (options.width === 'short') {
    options.width = 'narrow';
  }
  return super_(dayIndex, options);
};

// Monday is the first day of the week in Arabic countries
locale.options.weekStartsOn = 1;

export default { dateFormat, timeFormat, dateTimeFormat, locale };
