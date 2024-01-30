export default {
  props: {
    field: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    value: {},
    formatted: {
      type: String
    },
    spec: {
      type: Object,
      required: true
    },
    itemOrder: {},
    items: {}
  }
};