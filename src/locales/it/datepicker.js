import { it as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['do', 'lu', 'ma', 'me', 'gi', 've', 'sa'];

locale.localize.day = (dayIndex) => {
    return dayValues[dayIndex];
};

export default {dateFormat, timeFormat, dateTimeFormat, locale};
