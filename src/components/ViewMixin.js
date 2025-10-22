import ViewButtons from './ViewButtons.vue';

export default {
  components: {
    ViewButtons
  },
  computed: {
    cardsComponent() {
      return (this.view === 'list') ? 'div' : 'div';
    },
    cardsComponentProps() {
      if (this.view === 'list') {
        return {
          class: [
            'card-list'
          ]
        };
      }
      else {
        return {
          class: [
            'card-columns'
          ]
        };
      }
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
