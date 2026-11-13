import { h } from 'vue';
import WidgetHook from './WidgetHook.vue';
import { getWidgets } from './widgets.js';

// Functional, so that hooks without widgets don't create a component instance
export default function WidgetHookIfUsed(props) {
  return getWidgets(props.id).length > 0 ? h(WidgetHook, props) : null;
}
WidgetHookIfUsed.props = ['id', 'context'];
