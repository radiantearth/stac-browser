import { defineAsyncComponent } from 'vue';
import widgetConfig from '../../widgets.config';

const predefinedWidgets = {};

function getPredefinedWidget(id) {
  if (!predefinedWidgets[id]) {
    predefinedWidgets[id] = defineAsyncComponent(() => import(`../widgets/${id}.vue`));
  }
  return predefinedWidgets[id];
}

function createWidgets(hookId, widgets) {
  if (!Array.isArray(widgets)) {
    return [];
  }
  const result = [];
  widgets.forEach((widget, index) => {
    if (!widget.component && !widget.id) {
      console.error(`A widget for the hook '${hookId}' defines neither an 'id' nor a 'component' and is not shown.`);
      return;
    }
    const id = widget.id || `Widget${index}`;
    result.push({
      id,
      key: `${id}:${index}`,
      component: widget.component || getPredefinedWidget(widget.id),
      condition: widget.condition,
      props: widget.props || {},
    });
  });
  return result;
}

const hooks = Object.fromEntries(
  Object.entries(widgetConfig).map(([hookId, widgets]) => [hookId, createWidgets(hookId, widgets)])
);

export function getWidgets(hookId) {
  return hooks[hookId] || [];
}
