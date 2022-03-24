<template>
  <b-button-group title="Sort" size="sm">
    <b-button @click="toggle('cards')" title="Show as tiles" variant="outline-primary" :pressed="value === 'cards'">
      <b-icon-bricks /> <span class="button-label">Tiles</span>
    </b-button>
    <b-button @click="toggle('list')" title="Show as list" variant="outline-primary" :pressed="value === 'list'">
      <b-icon-list-task /> <span class="button-label">List</span>
    </b-button>
  </b-button-group>
</template>

<script>
import { BIconBricks, BIconListTask } from 'bootstrap-vue';

export default {
  id: "SortButtons",
  components: {
    BIconBricks,
    BIconListTask
  },
  props: {
    value: {
      type: String,
      default: 'cards'
    }
  },
  methods: {
    toggle(selectedValue) {
      if(this.value !== selectedValue) {
        this.$emit('input', selectedValue);
      }
    }
  }
}
</script>