<template>
  <div class="widget" v-for="widget of visibleWidgets" :key="widget.id">
    <component :is="widget.id" v-bind="widget.props" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import widgetConfig from '../../widgets.config';

export default {
  name: 'WidgetHook',
  components: {},
  props: {
    id: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      widgets: [],
    };
  },
  computed: {
    visibleWidgets() {
      return this.widgets.filter(widget => {
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
    const widgets = widgetConfig[this.id];
    if (!Array.isArray(widgets)) {
      return;
    }
    let i = 1;
    for(const widget of widgets) {
      let component = widget.component;
      if (!widget.component) {
        component = defineAsyncComponent(
          () => import(`../widgets/${widget.id}.vue`)
        );
      }
      this.$options.components[widget.id] = component;
      this.widgets.push({
        id: widget.id || `Widget${i++}`,
        component,
        condition: widget.condition,
        props: widget.props || {},
      });
    }
  },
};
</script>
