<template>
  <ul class="tree">
    <li>STAC Browser
      <ul>
        <li><b-icon-folder-minus /> Catalog 1
          <ul>
            <li><b-icon-file-earmark-richtext /> Item 1</li>
          </ul>
        </li>
        <li><b-icon-folder-plus /> Catalog 2</li>
        <li><b-icon-folder-plus /> Catalog 3</li>
      </ul>
    </li>
    <li v-if="allowSelectCatalog"><router-link to="/"><b-icon-arrow-left-right /> Switch Catalog</router-link></li>
  </ul>
</template>

<script>
import { BIconArrowLeftRight, BIconFileEarmarkRichtext, BIconFolderMinus, BIconFolderPlus } from "bootstrap-vue";
import { mapState } from 'vuex';

export default {
  name: 'Sidebar',
  components: {
    BIconArrowLeftRight,
    BIconFileEarmarkRichtext,
    BIconFolderMinus,
    BIconFolderPlus
  },
  computed: {
    ...mapState(['allowSelectCatalog'])
  }
}
</script>

<style lang="scss" scoped>
.tree > li {
  margin-bottom: 1em;
}
</style>