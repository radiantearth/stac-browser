<template>
  <ul>
    <li>STAC Browser
      <ul>
        <li v-if="supportsSearch"><router-link to="/search"><b-icon-search /> Search</router-link></li>
        <li><b-icon-folder-minus /> Catalog 1
          <ul>
            <li><b-icon-file-earmark-richtext /> Item 1</li>
          </ul>
        </li>
        <li><b-icon-folder-plus /> Catalog 2</li>
        <li><b-icon-folder-plus /> Catalog 3</li>
      </ul>
    </li>
  </ul>
</template>

<script>
import { BIconFileEarmarkRichtext, BIconFolderMinus, BIconFolderPlus, BIconSearch } from "bootstrap-vue";
import { mapGetters } from 'vuex';

export default {
  name: 'Sidebar',
  components: {
    BIconSearch,
    BIconFileEarmarkRichtext,
    BIconFolderMinus,
    BIconFolderPlus
  },
  computed: {
    ...mapGetters(['supportsSearch'])
  }
}
</script>