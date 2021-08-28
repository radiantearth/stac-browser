<template>
  <ul class="tree" v-b-visible="load">
    <li>
      <template v-if="mayHaveChildren">
        <b-button size="sm" variant="light" @click="toggle">
          <b-icon-folder-minus v-if="expanded" />
          <b-icon-folder-plus v-else />
        </b-button>
      </template>
      <b-button v-else size="sm" variant="light" :disabled="true">
        <b-icon-file-earmark-richtext />
      </b-button>
      
      <b-button size="sm" variant="light" :class="{path: onPath || active}" :disabled="active" :to="to">
        {{ title }}
      </b-button>

      <template v-if="expanded && mayHaveChildren">
        <Tree v-for="(child, i) in childs" :key="i" :item="child" :parent="stac" :path="path" />
      </template>
    </li>
  </ul>
</template>

<script>
import { BIconFileEarmarkRichtext, BIconFolderMinus, BIconFolderPlus } from "bootstrap-vue";
import { mapGetters, mapState } from 'vuex';
import Utils from '../utils';
import STAC from '../stac';

export default {
  name: 'Tree',
  components: {
    BIconFileEarmarkRichtext,
    BIconFolderMinus,
    BIconFolderPlus
  },
  props: {
    item: {
      type: Object,
      required: true
    },
    parent: {
      type: Object
    },
    path: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      expanded: false
    };
  },
  watch: {
    onPath: {
      immediate: true,
      handler() {
        if (this.onPath) {
          this.expanded = true;
        }
      }
    }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['getStac']),
    stac() {
      if (this.item instanceof STAC) {
        return this.item;
      }
      else {
        return this.getStac(this.link);
      }
    },
    link() {
      if (Utils.isObject(this.item) && typeof this.item.href === 'string') {
        if (this.parent) {
          return Utils.toAbsolute(this.item.href, this.parent.getAbsoluteUrl());
        }
        else {
          return this.item.href
        }
      }
      return null;
    },
    mayHaveChildren() {
      if (this.item instanceof STAC) {
        return this.childs.length > 0;
      }
      else if (this.link) {
        return this.item.rel !== 'item';
      }
      return false;
    },
    to() {
      if (this.stac instanceof STAC) {
        return this.stac.getBrowserPath();
      }
      return null;
    },
    title() {
      if (this.stac instanceof STAC) {
        let title = this.stac.getDisplayTitle();
        if (title) {
          return title;
        }
      }
      if (this.link) {
        return this.item.title || Utils.titleForHref(this.item.href);
      }
      return STAC.DEFAULT_TITLE;
    },
    apiItems() {
      if (!this.stac) {
        return null;
      }
      return this.stac.getLinksWithRels(['items']);
    },
    collections() {
      if (!this.stac) {
        return null;
      }
      return this.stac.getLinkWithRel(['data']);
    },
    childs() {
      if (!this.stac) {
        return [];
      }
      return this.stac.getLinksWithRels(['child', 'item']);
    },
    onPath() {
      if (!Array.isArray(this.path) || !this.stac) {
        return false;
      }
      return this.path.includes(this.stac);
    },
    active() {
      return this.stac === this.data;
    }
  },
  methods: {
    load(visible) {
      if (!this.stac && this.link) {
        this.$store.commit(visible ? 'queue' : 'unqueue', this.link);
      }
    },
    toggle() {
      this.expanded = !this.expanded;
    }
  }
}
</script>

<style lang="scss" scoped>
.tree {
  list-style-type: none;
  margin: 0;
  padding: 0;

  > li {
    white-space: nowrap;
  }

  .path {
    font-weight: bold;
  }

  .tree {
    margin-left: 1.5em;
  }
}
</style>