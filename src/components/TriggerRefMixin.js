import { markRaw } from 'vue';

// Stores popover trigger elements by name for use as a bootstrap-vue-next
// `target`, so a popover can anchor to a trigger inside a shadow root (where a
// string id would resolve against `document` and miss it). On the trigger use
// `:ref="el => setTriggerRef('name', el)"`, and set the popover's target to
// `triggerRefs.name`. markRaw is required: a reactive Proxy of a DOM node breaks
// Teleport. Prefer the popover's `#target` slot where the trigger isn't part of
// a layout that the extra placeholder element would disturb (e.g. a button group).
export default {
  data() {
    return {
      triggerRefs: {}
    };
  },
  methods: {
    setTriggerRef(name, el) {
      this.triggerRefs[name] = el ? markRaw(el) : null;
    }
  }
};
