<template>
  <div class="widget" v-for="widget of visibleWidgets" :key="widget.key">
    <component :is="widget.component" v-bind="widget.props" />
  </div>
</template>

<script>
import { defineAsyncComponent, markRaw } from 'vue';

export default {
  name: 'WidgetList',
  props: {
    widgets: {
      type: Array,
      default: () => []
    },
    // Describes where the widgets are defined, used in error messages
    source: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      definitions: [],
    };
  },
  computed: {
    visibleWidgets() {
      return this.definitions.filter(widget => {
        if (typeof widget.condition !== 'function') {
          return true;
        }
        try {
          const { state, getters } = this.$store;
          return Boolean(widget.condition({
            data: state.data,
            state,
            getters
          }));
        } catch (error) {
          console.error(`Condition for widget '${widget.id}' failed:`, error);
          return false;
        }
      });
    }
  },
  created() {
    if (!Array.isArray(this.widgets)) {
      return;
    }
    this.widgets.forEach((widget, index) => {
      let component = widget.component;
      if (!component && !widget.id) {
        console.error(`A widget for the ${this.source} defines neither an 'id' nor a 'component' and is not shown.`);
        return;
      }
      if (!component) {
        component = defineAsyncComponent(
          () => import(`../widgets/${widget.id}.vue`)
        );
      }
      const id = widget.id || `Widget${index}`;
      this.definitions.push({
        id,
        key: `${id}:${index}`,
        component: markRaw(component),
        condition: widget.condition,
        props: widget.props || {},
      });
    });
  },
};
</script>
