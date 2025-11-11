import { itCH } from 'date-fns/locale';

const dateFormat = 'dd.MM.yyyy';
const timeFormat = 'H:mm:ss';
const dateTimeFormat = `${dateFormat} ${timeFormat}`;

// short weekday tokens used in compact calendar headers
const dayValues = ['do', 'lu', 'ma', 'me', 'gi', 've', 'sa'];

const localize = {
    ...itCH.localize,
    day: (dayIndex) => {
        return dayValues[dayIndex];
    },
};

const locale = {
    ...itCH,
    localize,
};

export default { dateFormat, timeFormat, dateTimeFormat, locale };
