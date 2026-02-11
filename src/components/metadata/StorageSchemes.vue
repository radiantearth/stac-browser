<template>
  <div class="storage-schemes">
    <ul>
      <li v-for="(scheme, id) in data" :key="id">
        <p><strong>{{ scheme.title || id }}</strong> (<code>{{ id }}</code>)</p>
        <Description v-if="scheme.description" :description="scheme.description" />
        <dl>
          <template v-for="(entry, key) in formatted[id]" :key="key">
            <dt>{{ entry.label }}</dt>
            <dd v-html="entry.value" />
          </template>
        </dl>
      </li>
    </ul>
  </div>
</template>

<script>
import { Registry, label, format } from '@radiantearth/stac-fields';

export default {
  name: "StorageSchemes",
  components: {
    Description: () => import('../Description.vue')
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  computed: {
    spec() {
      return Registry.getSpecification('storage:schemes');
    },
    formatted() {
      const obj = {};
      for (const id in this.data) {
        obj[id] = {};
        for (const key in this.data[id]) {
          if (key == 'title' || key == 'description') {
            continue;
          }
          const spec = this.spec?.items?.[key];
          obj[id][key] = {
            label: label(key, spec),
            value: format(this.data[id][key], null, null, null, spec)
          };
        }
      }
      return obj;
    }
  }
};
</script>
