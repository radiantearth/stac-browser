import { configureCompat } from '@vue/compat';

// Configure Vue 3 compatibility mode for gradual migration
configureCompat({
  // Show warnings for Vue 2 features - this helps us identify what to migrate
  MODE: 2,
  
  // Only suppress warnings for features we know are intentionally kept for now
  // Remove suppressions as we migrate each feature
  
  // Keep these suppressed for Bootstrap Vue compatibility
  GLOBAL_MOUNT: 'suppress-warning',
  INSTANCE_LISTENERS: 'suppress-warning',
  INSTANCE_SCOPED_SLOTS: 'suppress-warning',
  
  // Keep this suppressed for transition compatibility
  TRANSITION_CLASSES: 'suppress-warning'
});
