import { pt } from 'date-fns/locale';

const dateFormat = 'dd/MM/yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

const minDayValues = ['Do', '2ª', '3ª', '4ª', '5ª', '6ª', 'Sá'];

const localize = {
    ...pt.localize,
    day: (dayIndex) => {
        return minDayValues[dayIndex];
    },
};

const locale = {
    ...pt,
    localize
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
