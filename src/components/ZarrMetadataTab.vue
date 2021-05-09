<template>
  <div>
    <div v-if="loading" class="mt-2"></div>
    <div v-else-if="errored" class="mt-2">
      <p>An error has occurred while loading while loading Zarr metadata.</p>
      <p>Check the console.</p>
    </div>
    <ZarrGroup v-else :group="group" :group-name="root"></ZarrGroup>
  </div>
</template>

<script>
import ZarrGroup from "./ZarrGroup.vue";
import fetch from "node-fetch";

export default {
  name: "ZarrMetadataTab",
  components: { ZarrGroup },
  props: ["zarrMetadataUrl"],
  data() {
    return {
      loading: true,
      errored: false,
      error: null,
      group: {}
    };
  },
  mounted() {
    fetch(this.zarrMetadataUrl)
      .then(rsp => rsp.json())
      .then(data => (this.group = this.parseMeta(data.metadata)))
      .catch(err => {
        console.error(err);
        this.errored = true;
      })
      .finally(() => (this.loading = false));
  },
  methods: {
    parseMeta: function(meta) {
      const group = { groups: {}, arrays: {}, attrs: meta[".zattrs"] || {} };
      for (const prop in meta)
        if (!prop.endsWith(".zattrs")) {
          prop
            .split("/")
            .slice(0, -1)
            .reduce((pre, cur, idx, arr) => {
              if (idx == arr.length - 1) {
                if (prop.endsWith(".zgroup"))
                  return (pre.groups[cur] = {
                    groups: {},
                    arrays: {},
                    attrs: meta[prop.replace(".zgroup", ".zattrs")] || {}
                  });
                else
                  return (pre.arrays[cur] = {
                    dtype: meta[prop].dtype,
                    shape: meta[prop].shape,
                    chunks: meta[prop].chunks,
                    attrs: meta[prop.replace(".zarray", ".zattrs")] || {}
                  });
              } else return pre.groups[cur];
            }, group);
        }
      return group;
    }
  }
};
</script>
