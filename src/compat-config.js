import { configureCompat } from '@vue/compat';

// Configure Vue 3 compatibility mode
configureCompat({
  // Show warnings for all Vue 2 features being used
  MODE: 2,
  
  // Enable all Vue 2 features initially for gradual migration
  GLOBAL_MOUNT: 'suppress-warning',
  GLOBAL_EXTEND: 'suppress-warning',
  GLOBAL_PROTOTYPE: 'suppress-warning',
  GLOBAL_SET: 'suppress-warning',
  GLOBAL_DELETE: 'suppress-warning',
  GLOBAL_OBSERVABLE: 'suppress-warning',
  
  CONFIG_WHITESPACE: 'suppress-warning',
  CONFIG_OPTION_MERGE_STRATS: 'suppress-warning',
  
  INSTANCE_SET: 'suppress-warning',
  INSTANCE_DELETE: 'suppress-warning',
  INSTANCE_DESTROY: 'suppress-warning',
  INSTANCE_EVENT_EMITTER: 'suppress-warning',
  INSTANCE_EVENT_HOOKS: 'suppress-warning',
  INSTANCE_CHILDREN: 'suppress-warning',
  INSTANCE_LISTENERS: 'suppress-warning',
  INSTANCE_SCOPED_SLOTS: 'suppress-warning',
  
  PROPS_DEFAULT_THIS: 'suppress-warning',
  
  RENDER_FUNCTION: 'suppress-warning',
  
  FILTERS: 'suppress-warning',
  
  COMPONENT_FUNCTIONAL: 'suppress-warning',
  COMPONENT_ASYNC: 'suppress-warning',
  
  TRANSITION_CLASSES: 'suppress-warning',
  
  WATCH_ARRAY: 'suppress-warning',
  
  V_ON_KEYCODE_MODIFIER: 'suppress-warning',
  V_BIND_OBJECT_ORDER: 'suppress-warning',
  
  CUSTOM_DIR: 'suppress-warning',
  
  ATTR_FALSE_VALUE: 'suppress-warning',
  ATTR_ENUMERATED_COERCION: 'suppress-warning',
  
  OPTIONS_DATA_FN: 'suppress-warning',
  OPTIONS_DATA_MERGE: 'suppress-warning',
  OPTIONS_BEFORE_DESTROY: 'suppress-warning',
  OPTIONS_DESTROYED: 'suppress-warning'
});
