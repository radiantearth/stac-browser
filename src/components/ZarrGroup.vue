<template>
  <div key="zarr-group" class="mt-2 zarr-group">
    <b-list-group>
      <b-list-group-item v-for="(subgroup, name) in group.groups" :key="name">
        <div class="d-flex justify-content-between array-name">
          <h2>
            <code>{{ name }}</code>
          </h2>
        </div>
        <ZarrGroup :group="subgroup" :group-name="name"></ZarrGroup>
      </b-list-group-item>
      <b-list-group-item v-for="(array, name) in group.arrays" :key="name">
        <div class="d-flex justify-content-between array-name">
          <h2>
            <code>{{ name }}</code>
          </h2>
          <small>
            <code>{{ array.dtype }}</code>
          </small>
        </div>
        <div class="table-responsive array-dims">
          <table class="table table-striped">
            <thead>
              <tr>
                <th v-if="array.attrs._ARRAY_DIMENSIONS">Dimension</th>
                <th v-else>Axis</th>
                <th>Shape</th>
                <th>Chunk Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(_, i) in array.shape" :key="name + '-axis-' + i">
                <td>
                  <code v-if="array.attrs._ARRAY_DIMENSIONS">
                    {{ array.attrs._ARRAY_DIMENSIONS[i] }}
                  </code>
                  <code v-else>{{ i }}</code>
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
        <div v-if="hasItems(array.attrs)" class="mt-2 array-attrs">
          <b-card no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1">
              <b-button v-b-toggle="name + '-attrs'" block variant="light">
                <b>Attributes</b>
              </b-button>
            </b-card-header>
            <b-collapse :id="name + '-attrs'">
              <b-card-body>
                <dl>
                  <template v-for="(value, key, i) in array.attrs">
                    <dt :key="name + '-key-' + i">{{ key }}</dt>
                    <dd :key="name + '-value-' + i">{{ value }}</dd>
                  </template>
                </dl>
              </b-card-body>
            </b-collapse>
          </b-card>
        </div>
      </b-list-group-item>
    </b-list-group>
    <div v-if="hasItems(group.attrs)" class="mt-2 group-attrs">
      <b-card no-body class="mb-1">
        <b-card-header header-tag="header" class="p-1">
          <b-button v-b-toggle="groupName + '-attrs'" block variant="light">
            <b>Group Attributes</b>
          </b-button>
        </b-card-header>
        <b-collapse :id="groupName + '-attrs'">
          <b-card-body>
            <dl>
              <template v-for="(value, key, i) in group.attrs">
                <dt :key="groupName + '-key-' + i">{{ key }}</dt>
                <dd :key="groupName + '-value-' + i">{{ value }}</dd>
              </template>
            </dl>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
  </div>
</template>

<script>
import { isEmpty } from "lodash";

export default {
  name: "ZarrGroup",
  props: ["group", "groupName"],
  methods: {
    hasItems: function(obj) {
      return !isEmpty(obj);
    }
  }
};
</script>
