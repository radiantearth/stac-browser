<template>
  <b-tab key="zarr-metadata" title="Zarr Metadata" :active="active">
    <div v-if="loading" class="mt-2"></div>
    <div v-else-if="errored" class="mt-2">
      <p>An error has occurred while loading while loading Zarr metadata.</p>
      <p>Check the console.</p>
    </div>
    <div v-else class="mt-2 zarr-arrays">
      <b-list-group>
        <b-list-group-item v-for="array in group.arrays" :key="array.name">
          <div class="d-flex justify-content-between array-name">
            <h2>
              <code>{{ array.name }}</code>
            </h2>
            <small>
              <code>{{ array.dtype }}</code>
            </small>
          </div>
          <div class="table-responsive array-dims">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Dimension</th>
                  <th>Shape</th>
                  <th>Chunk Size</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(dim, i) in array.dims"
                  :key="array.name + '-' + dim"
                >
                  <td>
                    <code>{{ dim }}</code>
                  </td>
                  <td>
                    <code>{{ array.shape[i] }}</code>
                  </td>
                  <td>
                    <code>{{ array.chunks[i] }}</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="array.hasAttrs" class="mt-2 array-attrs">
            <b-card no-body class="mb-1">
              <b-card-header header-tag="header" class="p-1">
                <b-button
                  v-b-toggle="array.name + '-attrs'"
                  block
                  variant="light"
                >
                  <b>Attributes</b>
                </b-button>
              </b-card-header>
              <b-collapse :id="array.name + '-attrs'">
                <b-card-body>
                  <dl>
                    <template v-for="(value, key, i) in array.attrs">
                      <dt :key="array.name + '-key-' + i">{{ key }}</dt>
                      <dd :key="array.name + '-value-' + i">{{ value }}</dd>
                    </template>
                  </dl>
                </b-card-body>
              </b-collapse>
            </b-card>
          </div>
        </b-list-group-item>
      </b-list-group>
      <div class="mt-2 zarr-attrs">
        <b-card no-body class="mb-1">
          <b-card-header header-tag="header" class="p-1">
            <b-button v-b-toggle.zarr-attrs block variant="light">
              <b>Group Attributes</b>
            </b-button>
          </b-card-header>
          <b-collapse id="zarr-attrs">
            <b-card-body>
              <dl>
                <template v-for="(value, key, i) in group.attrs">
                  <dt :key="'group-key-' + i">{{ key }}</dt>
                  <dd :key="'group-value-' + i">{{ value }}</dd>
                </template>
              </dl>
            </b-card-body>
          </b-collapse>
        </b-card>
      </div>
    </div>
  </b-tab>
</template>

<script>
const axios = require("axios").default;

function parseMeta(meta) {
  if (!(".zgroup" in meta)) {
    throw "Group doesn't contain the '.zgroup' key.";
  }
  let group = {};
  group["zarr_format"] = meta[".zgroup"].zarr_format;
  group["attrs"] = meta[".zattrs"];
  let arrays = {};
  for (const prop in meta) {
    if (prop.endsWith("/.zarray")) {
      let attrs = meta[prop.replace(".zarray", ".zattrs")];
      let name = prop.split("/.zarray")[0];
      let array = {
        name: name,
        dtype: meta[prop].dtype.substring(1).replace(/[a-z]/g, function(m) {
          return { i: "int", f: "float" }[m];
        }),
        dims: attrs._ARRAY_DIMENSIONS,
        shape: meta[prop].shape,
        chunks: meta[prop].chunks,
        hasAttrs: Object.keys(attrs).length > 1,
        attrs: attrs
      };
      delete array.attrs._ARRAY_DIMENSIONS;
      arrays[name] = array;
    }
  }
  group["arrays"] = arrays;
  return group;
}

export default {
  name: "ZarrMetadataTab",
  props: ["active", "zarrMetadataUrl"],
  data() {
    return {
      loading: true,
      errored: false,
      error: null,
      group: {}
    };
  },
  mounted() {
    axios
      .get(this.zarrMetadataUrl)
      .then(response => (this.group = parseMeta(response.data.metadata)))
      .catch(err => {
        console.error(err);
        this.errored = true;
      })
      .finally(() => (this.loading = false));
  }
};
</script>
