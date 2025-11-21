import { pt as locale } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// minimal override to support a custom 'min' width with two-letter weekday tokens
const minDayValues = ['Do', '2ª', '3ª', '4ª', '5ª', '6ª', 'Sá'];

locale.localize.day = (dayIndex) => {
    return minDayValues[dayIndex];  
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
