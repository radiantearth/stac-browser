import { h } from 'vue';

// Used instead of widgets.config.js in the e2e tests (see vite.config.js).
// The widgets are only shown for the fixtures of widgets.spec.js.
export const WIDGET_TEST_HOST = 'https://widgets.example/';

const isWidgetTest = ({ state }) => typeof state.url === 'string' && state.url.startsWith(WIDGET_TEST_HOST);

function createWidget(name) {
  const Widget = props => h('p', { class: 'test-widget', 'data-widget': name }, props.text);
  Widget.props = ['text'];
  return Widget;
}

export default {
  'root-start': [
    { component: createWidget('A'), condition: isWidgetTest, props: { text: 'Widget A' } }
  ],
  'view-catalog-meta-start': [
    { component: createWidget('B'), condition: isWidgetTest, props: { text: 'Widget B' } },
    { id: 'AlertBox', condition: isWidgetTest, props: { text: 'Pre-defined widget' } }
  ],
  'view-catalog-meta-end': [
    { id: 'AlertBox', condition: ctx => isWidgetTest(ctx) && Boolean(ctx.data?.isCollection), props: { text: 'Collections only' } }
  ]
};
