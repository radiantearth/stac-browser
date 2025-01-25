import { Control } from 'ol/control.js';

export default {
  props: {
    map: {
      type: Object
    }
  },
  data() {
    return {
      control: null
    };
  },
  mounted() {
    this.control = new Control({
      element: this.$el
    });
  },
  watch: {
    map(newMap) {
      if (newMap) {
        this.map.addControl(this.control);
      }
    }
  },
  methods: {
    getControl() {
      return this.control;
    }
  }
};
