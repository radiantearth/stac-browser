import { mapState } from "vuex";
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

export default {
  components: {
    VueDatePicker
  },
  data() {
    const dateFormat = 'yyyy-MM-dd';
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

        try {
          const options = (await import(`../locales/${locale}/datepicker.js`)).default;
        
          this.datepickerLang = options.locale;
          this.dateFormat = options.dateFormat || options.dateFormat;
          this.timeFormat = options.timeFormat;
          this.dateTimeFormat = options.dateTimeFormat;
        } catch (e) {
          console.error(`Could not load datepicker locale for ${locale}`, e);
          
          this.datepickerLang = null;
        }
      }
    }
  }
};
