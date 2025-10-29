import ViewButtons from './ViewButtons.vue';

export default {
  components: {
    ViewButtons
  },
  computed: {
    cardsComponent() {
      return 'div';
    },
    cardsComponentProps() {
      return {
          class: [
            (this.view === 'list') ? 'card-list' : 'card-grid'
          ]
        };
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
