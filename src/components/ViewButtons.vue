<template>
  <b-button-group :title="$t('view.title')" size="sm">
    <b-button @click="toggle('cards')" :title="$t('view.tiles.title')" variant="outline-primary" :pressed="modelValue === 'cards'">
      <b-icon-bricks /> <span class="button-label">{{ $t('view.tiles.label') }}</span>
    </b-button>
    <b-button @click="toggle('list')" :title="$t('view.list.title')" variant="outline-primary" :pressed="modelValue === 'list'">
      <b-icon-list-task /> <span class="button-label">{{ $t('view.list.label') }}</span>
    </b-button>
  </b-button-group>
</template>

<script>

export default {
  name: "ViewButtons",
  props: {
    modelValue: {
      type: String,
      default: 'cards'
    }
  },
  emits: ['update:modelValue'],
  methods: {
    toggle(selectedValue) {
      if(this.modelValue !== selectedValue) {
        this.$emit('update:modelValue', selectedValue);
      }
    }
  }
};
</script>
