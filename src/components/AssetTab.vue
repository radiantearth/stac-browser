<template>
<b-tab
    title="Assets"
    :active="active"
    key="assets"
>
  <div class="table-responsive assets">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Name</th>
          <th v-if="hasBands > 0">Band(s)</th>
          <th>Roles</th>
          <th>Content-Type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="asset in assets" :key="asset.key">
          <td>
            <a
                :href="asset.href"
                :title="asset.key"
                v-html="asset.label"
            />
          </td>
          <td v-if="hasBands">{{ asset.bandNames }}</td>
          <td>
            <code>{{ asset.roleNames }}</code>
          </td>
          <td>
            <code>{{ asset.type }}</code>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</b-tab>
</template>

<script>

export default {
  name: "AssetTab",
  props: ["assets", "bands", "active", "hasBands"]
};

</script>
