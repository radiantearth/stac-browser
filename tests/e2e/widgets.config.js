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

const AssetWidget = props => h('p', { class: 'test-widget', 'data-widget': 'asset' }, `${props.label}: ${props.asset?.title}`);
AssetWidget.props = ['asset', 'label'];

export default {
  'root-start': [
    { component: createWidget('A'), condition: isWidgetTest, props: { text: 'Widget A' } }
  ],
  'view-catalog-meta-start': [
    { component: createWidget('B'), condition: isWidgetTest, props: { text: 'Widget B' } },
    { id: 'AlertBox', condition: isWidgetTest, props: { text: 'Pre-defined widget' } }
  ],
  'view-catalog-intro-end': [
    { component: createWidget('intro'), condition: isWidgetTest, props: { text: 'Intro end' } }
  ],
  'view-catalog-meta-end': [
    { id: 'AlertBox', condition: ctx => isWidgetTest(ctx) && Boolean(ctx.data?.isCollection), props: { text: 'Collections only' } }
  ],
  'asset-actions-end': [
    {
      component: AssetWidget,
      condition: ctx => isWidgetTest(ctx) && ctx.asset.type === 'application/json',
      // The asset from the hook takes precedence
      props: { label: 'JSON asset', asset: { title: 'Configured asset' } }
    }
  ]
};
