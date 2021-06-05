<template>
  <nav v-if="items.length > 0">
    <b-breadcrumb>
      <template v-for="item in items">
        <b-breadcrumb-item v-if="item.missing" :key="item.to" @click.stop.prevent="loadBreadcrumb" :text="item.text" />
        <b-breadcrumb-item v-else :key="item.to" v-bind="item" />
      </template>
    </b-breadcrumb>
  </nav>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import Utils from '../utils';

export default {
  name: "Breadcrumb",
  computed: {
    ...mapState(['baseUrl', 'data', 'url']),
    ...mapGetters(['getStac', 'toBrowserPath']),
    items() {
      // No data loaded => no breadcrumb
      if (!this.data) {
        return [];
      }

      // Add current document to breadcrumb
      let breadcrumb = [{
        text: this.data.getDisplayTitle(),
        to: this.data.getBrowserPath()
      }];

      // Iterate through all documents until root
      let parentLink = this.data.getLinkWithRel('parent');
      let lastUrl = this.url;
      let level = 1;
      while (parentLink) {
        let parentUrl = Utils.toAbsolute(parentLink.href, lastUrl);
        let parentDocument = this.getStac(parentUrl);
        if (parentDocument) {
          breadcrumb.push({
            text: parentDocument.getDisplayTitle(parentLink.title),
            to: parentDocument.getBrowserPath()
          });
          parentLink = parentDocument.getLinkWithRel('parent');
          lastUrl = parentUrl;
          level++;
        }
        else {
          let parentPath = this.toBrowserPath(parentUrl);
          if (parentPath !== '/') {
            // Can't find a cached document for the parent link => show details from parent link...
            breadcrumb.push({
              text: parentLink.title || 'Parent',
              to: parentPath
            });
            // ... and a placeholder
            if (level === 1) {
              breadcrumb.push({
                text: '...',
                missing: true
              });
            }
          }
          break;
        }
      }

      // Add the root if it is still missing (i.e. the last parent was not the root)
      if (breadcrumb[breadcrumb.length-1].to !== '/') {
        let root = this.data.getLinkWithRel('root') || {};
        let rootStac = this.getStac(this.baseUrl);
        let fallbackTitle = root.title || CATALOG_TITLE;
        breadcrumb.push({
          text: rootStac ? rootStac.getDisplayTitle(fallbackTitle) : fallbackTitle,
          to: '/'
        });
      }

      // Dont make last link clickable (we are on the page anyway)
      breadcrumb[0].active = true;

      // Reverse order (root first, current page last)
      return breadcrumb.reverse();
    }
  },
  methods: {
    loadBreadcrumb() {
      // ToDo
    }
  }
};
</script>