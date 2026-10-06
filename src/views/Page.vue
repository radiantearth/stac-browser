<template>
  <main class="custom-page" :class="`custom-page-${id}`">
    <ErrorAlert v-if="!page" :message="$t('pages.notFound')" />
    <Loading v-else-if="loading" />
    <ErrorAlert v-else-if="error" :message="$t('pages.loadFailed')" :error="error" :url="contentUrl" />
    <Description v-else-if="hasText(markdown)" :description="markdown" :allowHTML="Boolean(page.allowHTML)" />
    <WidgetList v-else-if="Array.isArray(page.widgets)" :key="id" :widgets="page.widgets" :source="`page '${id}'`" />
    <component v-else-if="component" :is="component" v-bind="page.props || {}" />
  </main>
</template>

<script>
import { defineComponent, markRaw } from 'vue';
import { mapGetters, mapState } from 'vuex';
import { hasText } from 'stac-js/src/utils.js';
import Description from '../components/Description.vue';
import ErrorAlert from '../components/ErrorAlert.vue';
import Loading from '../components/Loading.vue';
import WidgetList from '../plugins/WidgetList.vue';
import { getLocalizedValue } from '../pages.js';

export default defineComponent({
  name: "Page",
  components: {
    Description,
    ErrorAlert,
    Loading,
    WidgetList
  },
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      markdown: null,
      loading: false,
      error: null,
      request: 0
    };
  },
  computed: {
    ...mapState(['uiLanguage', 'fallbackLocale']),
    ...mapGetters(['getPage', 'pageTitle']),
    page() {
      return this.getPage(this.id);
    },
    content() {
      return this.page ? this.localize(this.page.content) : undefined;
    },
    contentUrl() {
      const url = this.page ? this.localize(this.page.url) : undefined;
      return hasText(url) ? url : '';
    },
    component() {
      return this.page?.component ? markRaw(this.page.component) : null;
    }
  },
  watch: {
    id: {
      immediate: true,
      handler() {
        this.$store.commit('showPage', {
          page: () => ({
            title: this.page ? this.pageTitle(this.id) : this.$t('errors.title'),
            description: this.page ? this.localize(this.page.description) : null
          })
        });
      }
    },
    content: {
      immediate: true,
      handler() {
        this.loadMarkdown();
      }
    },
    contentUrl() {
      this.loadMarkdown();
    }
  },
  methods: {
    hasText,
    localize(value) {
      return getLocalizedValue(value, this.uiLanguage, this.fallbackLocale);
    },
    async loadMarkdown() {
      const request = ++this.request;
      this.markdown = null;
      this.error = null;
      if (typeof this.content === 'string') {
        this.markdown = this.content;
        return;
      }
      if (typeof this.content !== 'function' && !this.contentUrl) {
        return;
      }
      this.loading = true;
      try {
        let markdown;
        if (typeof this.content === 'function') {
          const module = await this.content();
          markdown = typeof module === 'string' ? module : module?.default;
        }
        else {
          const response = await fetch(this.contentUrl);
          if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`.trim());
          }
          markdown = await response.text();
        }
        if (request === this.request) {
          this.markdown = typeof markdown === 'string' ? markdown : '';
        }
      } catch (error) {
        if (request === this.request) {
          this.error = error;
        }
      } finally {
        if (request === this.request) {
          this.loading = false;
        }
      }
    }
  }
});
</script>
