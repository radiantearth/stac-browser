import ViewButtons from './ViewButtons.vue';

export default {
  components: {
    ViewButtons
  },
  computed: {
    cardsComponent() {
      return (this.view === 'list') ? 'div' : 'b-card-group';
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
          columns: true
        };
      }
    },
    view: {
      get() {
        return this.$store.state.cardViewMode;
      },
      set(cardViewMode) {
        this.$store.commit('config', { cardViewMode });
      }
    }
  }
};