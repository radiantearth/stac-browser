import { ar as locale } from 'date-fns/locale';

// According to https://en.wikipedia.org/wiki/List_of_date_formats_by_country
// many countries that use Arabic as their official language use the dd/MM/yyyy date format.
const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'HH:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const super_ = locale.localize.day;
locale.localize.day = (dayIndex, options = {}) => {
  if (options.width === 'short') {
    options.width = 'narrow';
  }
  return super_(dayIndex, options);
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
