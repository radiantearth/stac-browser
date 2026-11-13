<template>
  <div class="widget" v-for="widget of visibleWidgets" :key="widget.key">
    <component :is="widget.component" v-bind="widget.props" />
  </div>
</template>

<script>
import { getWidgets } from './widgets.js';

export default {
  name: 'WidgetHook',
  props: {
    id: {
      type: String,
      required: true,
    },
    context: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    widgets() {
      return getWidgets(this.id);
    },
    visibleWidgets() {
      return this.widgets.filter(widget => {
        if (typeof widget.condition !== 'function') {
          return true;
        }
        try {
          const { state, getters } = this.$store;
          return Boolean(widget.condition({
            ...this.context,
            data: state.data,
            state,
            getters
          }));
        } catch (error) {
          console.error(`Condition for widget '${widget.id}' failed:`, error);
          return false;
        }
      }).map(widget => ({ ...widget, props: { ...widget.props, ...this.context } }));
    }
  }
};
</script>
