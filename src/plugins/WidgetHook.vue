<template>
  <div class="widget" v-for="widget of widgets" :key="widget.id">
    <component :is="widget.id" v-bind="widget.props" />
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import widgetConfig from '../../widgets.config';

export default {
  name: 'WidgetHook',
  components: {},
  data() {
    return {
      widgets: [],
    };
  },
  props: {
    id: {
      type: String,
      required: true,
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
        props: widget.props || {},
      });
    }
  },
};
</script>
