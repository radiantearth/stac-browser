export default {
  props: {
    enforceView: {
      type: String,
      default: null,
      validator: value => value === null || ['list', 'cards'].includes(value)
    }
  },
  computed: {
    view: {
      get() {
        if (this.enforceView) {
          return this.enforceView;
        }
        return this.$store.state.cardViewMode;
      },
      async set(cardViewMode) {
        if (this.enforceView) {
          return;
        }
        await this.$store.dispatch('config', { cardViewMode });
      }
    }
  }
};
