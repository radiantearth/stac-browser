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
    ...mapState({localeFromVueX: 'locale'})
  },
  watch: {
    localeFromVueX: {
      immediate: true,
      async handler (locale) {
        if (typeof locale !== 'string') {
          return;
        }
        const options = await import(`../locales/${locale}/datepicker.js`);
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