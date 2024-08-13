import ViewButtons from './ViewButtons.vue';

export default {
  components: {
    ViewButtons
  },
  computed: {
    isList() {
      return this.view === 'list'
    },
    view: {
      get() {
        return this.$store.state.cardViewMode;
      },
      async set(cardViewMode) {
        await this.$store.dispatch('config', { cardViewMode });
      }
    }
  }
};
