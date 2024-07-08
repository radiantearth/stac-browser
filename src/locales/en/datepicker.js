// 1. Specify output format
const format = 'YYYY-MM-DD';

// 2A. Either re-use settings and phrases from vue2-datepicker (and customize them)...
const locale = import('vue2-datepicker/locale/en');

// Usually not needed, but we customize the first day of the week for "international" users.
(await locale).default.formatLocale.firstDayOfWeek = 1;

// 2B. ... or define your own based on https://github.com/mengxiong10/vue2-datepicker
/*
const locale = {
  // the locale of formatting and parsing function
  formatLocale: {
    // MMMM
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    // MMM
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    // dddd
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    // ddd
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    // dd
    weekdaysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    // first day of week
    firstDayOfWeek: 0,
    // first week contains January 1st.
    firstWeekContainsDate: 1,
    // format 'a', 'A'
    meridiem: (h: number, _: number, isLowercase: boolean) {
      const word = h < 12 ? 'AM' : 'PM';
      return isLowercase ? word.toLocaleLowerCase() : word;
    },
    // parse ampm
    meridiemParse: /[ap]\.?m?\.?/i;
    // parse ampm
    isPM: (input: string) {
      return `${input}`.toLowerCase().charAt(0) === 'p';
    }
  },
  // the calendar header, default formatLocale.weekdaysMin
  days: [],
  // the calendar months, default formatLocale.monthsShort
  months: [],
  // the calendar title of year
  yearFormat: 'YYYY',
  // the calendar title of month
  monthFormat: 'MMM',
  // the calendar title of month before year
  monthBeforeYear: false,
}
*/

export default {format, locale};
