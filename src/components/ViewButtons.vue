<template>
  <b-button-group :title="$t('view.title')" size="sm">
    <b-button @click="toggle('cards')" :title="$t('view.tiles.title')" variant="outline-primary" :pressed="value === 'cards'">
      <IBiBricks /> <span class="button-label">{{ $t('view.tiles.label') }}</span>
    </b-button>
    <b-button @click="toggle('list')" :title="$t('view.list.title')" variant="outline-primary" :pressed="value === 'list'">
      <IBiListTask /> <span class="button-label">{{ $t('view.list.label') }}</span>
    </b-button>
  </b-button-group>
</template>

<script>

export default {
  id: "SortButtons",
  components: {},
  props: {
    value: {
      type: String,
      default: 'cards'
    }
  },
  emits: ['input'],
  methods: {
    toggle(selectedValue) {
      if(this.value !== selectedValue) {
        this.$emit('input', selectedValue);
      }
    }
  }
};
</script>