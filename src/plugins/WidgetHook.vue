<template>
  <WidgetList :widgets="widgets" :source="`hook '${id}'`" />
</template>

<script>
import widgetConfig from '../../widgets.config';
import WidgetList from './WidgetList.vue';

export default {
  name: 'WidgetHook',
  components: {
    WidgetList
  },
  props: {
    id: {
      type: String,
      required: true,
    }
  },
  computed: {
    widgets() {
      return widgetConfig[this.id];
    }
  }
};
</script>
