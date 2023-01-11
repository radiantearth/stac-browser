// A. Either re-use phrases from iso-duration...
import { en as locale } from '@musement/iso-duration';

// B. ... or define your own based on https://github.com/musement/iso-duration
/*
const locale = {
  years(c) {
    return "year" + (c === 1 ? "" : "s");
  },
  months(c) {
    return "month" + (c === 1 ? "" : "s");
  },
  weeks(c) {
    return "week" + (c === 1 ? "" : "s");
  },
  days(c) {
    return "day" + (c === 1 ? "" : "s");
  },
  hours(c) {
    return "hour" + (c === 1 ? "" : "s");
  },
  minutes(c) {
    return "minute" + (c === 1 ? "" : "s");
  },
  seconds(c) {
    return "second" + (c === 1 ? "" : "s");
  },
  decimal: ".",
};
*/

export default locale;
