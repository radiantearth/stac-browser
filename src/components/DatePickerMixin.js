import { mapState } from "vuex";

export default {
  components: {
    DatePicker: () => import('vue2-datepicker')
  },
  data() {
    const dateFormat = 'YYYY-MM-DD';
    const timeFormat = 'HH:mm:ss';
    return {
      datepickerLang: null,
      dateFormat,
      timeFormat,
      dateTimeFormat: `${dateFormat} ${timeFormat}`,
      twelveHourClock: false
    };
  },
  computed: {
    ...mapState(['uiLanguage'])
  },
  watch: {
    uiLanguage: {
      immediate: true,
      async handler(locale) {
        if (!locale) {
          return;
        }
        const options = (await import(`../locales/${locale}/datepicker.js`)).default;
        if (options.locale instanceof Promise) {
          this.datepickerLang = (await options.locale).default;
        }
        else {
          this.datepickerLang = options.locale;
        }
        this.dateFormat = options.dateFormat;
        this.timeFormat = options.timeFormat;
        this.dateTimeFormat = options.dateTimeFormat;
      }
    }
  }
};
