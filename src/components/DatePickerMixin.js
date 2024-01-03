import { mapState } from "vuex";

export default {
  components: {
    DatePicker: () => import('vue2-datepicker')
  },
  data() {
    return {
      datepickerLang: null,
      datepickerFormat: 'YYYY-MM-DD'
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
        this.datepickerFormat = options.format;
      }
    }
  }
};