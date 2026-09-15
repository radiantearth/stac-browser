<template>
  <div v-if="isOscProduct" class="osc-product-header mb-4">
    <!-- Row 1: Top navigation bar (Browse Catalogue | Catalogue Source | About OSC) -->
    <div class="top-nav-bar d-flex flex-wrap align-items-center justify-content-between gap-2 py-2 border-bottom mb-3">
      <div class="nav-left">
        <b-button
          variant="outline-secondary" size="sm" class="nav-btn"
          title="Browse Catalogue" @click="toggleStacSidebar"
        >
          <b-icon-list />
          <span class="button-label">Browse Catalogue</span>
        </b-button>
      </div>
      <div class="nav-center">
        <b-button
          id="popover-catalog-source-btn" variant="outline-secondary" size="sm" class="nav-btn"
          title="Catalogue Source"
        >
          <b-icon-database />
          <span class="button-label">Catalogue Source</span>
        </b-button>
        <b-popover
          target="popover-catalog-source-btn"
          triggers="click focus"
          placement="bottom"
          class="popover-large"
        >
          <RootStats v-if="root" />
        </b-popover>
      </div>
      <div class="nav-right">
        <b-button
          variant="outline-secondary" size="sm" class="nav-btn"
          href="https://earthcode.esa.int" target="_blank" rel="noopener noreferrer"
          title="About OSC"
        >
          <b-icon-info-circle />
          <span class="button-label">About OSC</span>
        </b-button>
      </div>
    </div>

    <!-- Row 2: Product type badge on left | Action buttons on right -->
    <div class="action-bar d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
      <div class="product-badge d-flex align-items-center">
        <b-icon-info-circle class="me-1 text-primary" />
        <span class="fw-bold fs-6">{{ oscType }}:</span>
      </div>
      <div class="action-buttons d-flex flex-wrap align-items-center gap-2">
        <b-button
          v-if="parentLink" :to="toBrowserPath(parentLink)" variant="outline-primary" size="sm" class="action-btn"
          title="Up"
        >
          <b-icon-arrow-90deg-up />
          <span class="button-label">Up</span>
        </b-button>
        <StacSource :title="title" :stacUrl="stacUrl" :stac="stac" />
        <b-button
          v-if="suggestChangesUrl" :href="suggestChangesUrl" target="_blank" rel="noopener noreferrer" variant="outline-primary" size="sm" class="action-btn"
          title="Suggest Changes"
        >
          <b-icon-pencil />
          <span class="button-label">Suggest Changes</span>
        </b-button>
      </div>
    </div>

    <!-- Row 3: Product Title -->
    <h1 class="osc-product-title my-2">{{ title }}</h1>

    <!-- Row 4: Line 1 - Part of the project -->
    <div v-if="project" class="osc-meta-project mb-2">
      <span class="meta-label me-1">{{ $t('partOfProject') }}</span>
      <StacLink :data="project.link || project.href" :title="project.title" class="project-link" />
    </div>

    <!-- Row 5: Line 2 - Themes | Variables | Missions | Region | Status -->
    <div v-if="hasSubMeta" class="osc-meta-line d-flex flex-wrap align-items-center">
      <!-- Themes -->
      <span v-if="themes.length > 0" class="osc-meta-item">
        <span class="meta-label me-1">{{ $t('themes') }}</span>
        <StacLink :data="themes[0].link || themes[0].href" :title="themes[0].title" />
        <template v-if="themes.length > 1">
          <span
            :id="themesPopoverId"
            class="more-badge ms-1"
            tabindex="0"
            role="button"
          >
            +{{ themes.length - 1 }}more
          </span>
          <b-popover :target="themesPopoverId" triggers="hover focus click" placement="bottom">
            <div class="d-flex flex-column gap-1">
              <StacLink
                v-for="(t, idx) in themes.slice(1)"
                :key="idx"
                :data="t.link || t.href"
                :title="t.title"
              />
            </div>
          </b-popover>
        </template>
      </span>

      <!-- Separator -->
      <span v-if="themes.length > 0 && (variables.length > 0 || missions.length > 0 || region || status)" class="meta-separator">|</span>

      <!-- Variables -->
      <span v-if="variables.length > 0" class="osc-meta-item">
        <span class="meta-label me-1">{{ $t('variables') }}</span>
        <StacLink :data="variables[0].link || variables[0].href" :title="variables[0].title" />
        <template v-if="variables.length > 1">
          <span
            :id="variablesPopoverId"
            class="more-badge ms-1"
            tabindex="0"
            role="button"
          >
            +{{ variables.length - 1 }}more
          </span>
          <b-popover :target="variablesPopoverId" triggers="hover focus click" placement="bottom">
            <div class="d-flex flex-column gap-1">
              <StacLink
                v-for="(v, idx) in variables.slice(1)"
                :key="idx"
                :data="v.link || v.href"
                :title="v.title"
              />
            </div>
          </b-popover>
        </template>
      </span>

      <!-- Separator -->
      <span v-if="variables.length > 0 && (missions.length > 0 || region || status)" class="meta-separator">|</span>

      <!-- Missions -->
      <span v-if="missions.length > 0" class="osc-meta-item">
        <span class="meta-label me-1">{{ $t('missions') }}</span>
        <StacLink :data="missions[0].link || missions[0].href" :title="missions[0].title" />
        <template v-if="missions.length > 1">
          <span
            :id="missionsPopoverId"
            class="more-badge ms-1"
            tabindex="0"
            role="button"
          >
            +{{ missions.length - 1 }}more
          </span>
          <b-popover :target="missionsPopoverId" triggers="hover focus click" placement="bottom">
            <div class="d-flex flex-column gap-1">
              <StacLink
                v-for="(m, idx) in missions.slice(1)"
                :key="idx"
                :data="m.link || m.href"
                :title="m.title"
              />
            </div>
          </b-popover>
        </template>
      </span>

      <!-- Separator -->
      <span v-if="missions.length > 0 && (region || status)" class="meta-separator">|</span>

      <!-- Region -->
      <span v-if="region" class="osc-meta-item">
        <span class="meta-label me-1">{{ $t('region') }}</span>
        <span class="meta-value">{{ region }}</span>
      </span>

      <!-- Separator -->
      <span v-if="region && status" class="meta-separator">|</span>

      <!-- Status -->
      <span v-if="status" class="osc-meta-item">
        <span class="meta-label me-1">{{ $t('status') }}</span>
        <span class="meta-value">{{ status }}</span>
      </span>
    </div>
    <hr class="header-divider mt-3 mb-0" />
  </div>
</template>

<script>
import { defineComponent, defineAsyncComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import StacLink from '../components/StacLink.vue';
import StacSource from '../components/StacSource.vue';
import CONFIG from '../merged-config';

export default defineComponent({
  name: 'OscProductHeader',
  components: {
    StacLink,
    StacSource,
    RootStats: defineAsyncComponent(() => import('../components/RootStats.vue')),
    BPopover: defineAsyncComponent(() => import('bootstrap-vue-next').then(m => m.BPopover))
  },
  computed: {
    ...mapState(['data', 'url']),
    ...mapGetters(['title', 'parentLink', 'root', 'toBrowserPath']),
    stac() {
      return this.data;
    },
    stacUrl() {
      return this.url;
    },
    isOscProduct() {
      if (!this.stac) return false;
      const type = this.stac['osc:type'];
      return typeof type === 'string' && type.toLowerCase() === 'product';
    },
    oscType() {
      if (!this.stac || !this.stac['osc:type']) return null;
      const type = this.stac['osc:type'];
      return type.charAt(0).toUpperCase() + type.slice(1);
    },
    stacId() {
      return this.stac?.id || 'stac';
    },
    themesPopoverId() {
      return `popover-themes-${this.stacId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    },
    variablesPopoverId() {
      return `popover-variables-${this.stacId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    },
    missionsPopoverId() {
      return `popover-missions-${this.stacId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    },
    links() {
      return Array.isArray(this.stac?.links) ? this.stac.links : [];
    },
    suggestChangesUrl() {
      if (!this.stac) return null;
      const workspaceRoot = CONFIG.workspaceRoot || "https://workspace.earthcode-staging.earthcode.eox.at";
      const currentPath = !this.$route || this.$route.path === "/" || this.$route.path === "" || this.$route.path === "/catalog" ? "/catalog" : this.$route.path;
      const parts = currentPath.split("/");
      const lastPart = parts[parts.length - 1] || "catalog";
      const sessionTitle = `Edit ${lastPart}`;
      return `${workspaceRoot}/osc-editor?session=${encodeURIComponent(sessionTitle)}&automation=edit-file&file=${encodeURIComponent(
        'https://raw.githubusercontent.com/ESA-EarthCODE/open-science-catalog-metadata/refs/heads/main' +
        currentPath +
        '.json'
      )}`;
    },
    project() {
      if (!this.stac) return null;

      // 1. Look for a link in stac.links pointing to /projects/
      const link = this.links.find(l => l.href && l.href.includes('/projects/'));
      if (link) {
        const rawTitle = link.title || '';
        const title = rawTitle ? rawTitle.replace(/^Project:\s*/i, '').trim() : this.formatId(this.stac['osc:project']);
        return { link, title, href: link.href };
      }

      // 2. Fallback to osc:project property
      const oscProject = this.stac['osc:project'] || this.stac.project;
      if (oscProject) {
        const title = this.formatId(oscProject);
        const href = `/projects/${oscProject}/collection.json`;
        return { link: null, title, href };
      }

      return null;
    },
    themes() {
      if (!this.stac) return [];
      const list = [];

      // 1. Look for links pointing to /themes/
      const themeLinks = this.links.filter(l => l.href && l.href.includes('/themes/'));
      if (themeLinks.length > 0) {
        themeLinks.forEach(l => {
          const rawTitle = l.title || '';
          const title = rawTitle ? rawTitle.replace(/^Theme:\s*/i, '').trim() : this.formatId(l.href.split('/').pop().replace('.json', ''));
          list.push({ link: l, title, href: l.href });
        });
      }

      // 2. Fallback to properties if no links found
      if (list.length === 0) {
        const rawThemes = this.stac['osc:themes'] || this.stac['osc:theme'] || this.stac.themes;
        if (Array.isArray(rawThemes)) {
          rawThemes.forEach(t => {
            const themeId = typeof t === 'string' ? t : (t.id || t.title);
            if (themeId) {
              list.push({
                link: null,
                title: this.formatId(themeId),
                href: `/themes/${themeId}/catalog.json`
              });
            }
          });
        } else if (typeof rawThemes === 'string') {
          list.push({
            link: null,
            title: this.formatId(rawThemes),
            href: `/themes/${rawThemes}/catalog.json`
          });
        }
      }

      return list;
    },
    variables() {
      if (!this.stac) return [];
      const list = [];

      // 1. Look for links pointing to /variables/
      const varLinks = this.links.filter(l => l.href && l.href.includes('/variables/'));
      if (varLinks.length > 0) {
        varLinks.forEach(l => {
          const rawTitle = l.title || '';
          const title = rawTitle ? rawTitle.replace(/^Variable:\s*/i, '').trim() : this.formatId(l.href.split('/').pop().replace('.json', ''));
          list.push({ link: l, title, href: l.href });
        });
      }

      // 2. Fallback to properties if no links found
      if (list.length === 0) {
        const rawVars = this.stac['osc:variables'] || this.stac['osc:variable'] || this.stac.variables;
        if (Array.isArray(rawVars)) {
          rawVars.forEach(v => {
            const varId = typeof v === 'string' ? v : (v.id || v.title);
            if (varId) {
              list.push({
                link: null,
                title: this.formatId(varId),
                href: `/variables/${varId}/catalog.json`
              });
            }
          });
        } else if (typeof rawVars === 'string') {
          list.push({
            link: null,
            title: this.formatId(rawVars),
            href: `/variables/${rawVars}/catalog.json`
          });
        }
      }

      return list;
    },
    missions() {
      if (!this.stac) return [];
      const list = [];

      // 1. Look for links pointing to /eo-missions/ or /missions/
      const missionLinks = this.links.filter(l => l.href && (l.href.includes('/eo-missions/') || l.href.includes('/missions/')));
      if (missionLinks.length > 0) {
        missionLinks.forEach(l => {
          const rawTitle = l.title || '';
          const title = rawTitle ? rawTitle.replace(/^EO Mission:\s*/i, '').replace(/^Mission:\s*/i, '').trim() : this.formatId(l.href.split('/').pop().replace('.json', ''));
          list.push({ link: l, title, href: l.href });
        });
      }

      // 2. Fallback to properties if no links found
      if (list.length === 0) {
        const rawMissions = this.stac['osc:missions'] || this.stac['osc:eo-mission'] || this.stac.missions;
        if (Array.isArray(rawMissions)) {
          rawMissions.forEach(m => {
            const mId = typeof m === 'string' ? m : (m.id || m.title);
            if (mId) {
              list.push({
                link: null,
                title: this.formatId(mId),
                href: `/eo-missions/${mId}/catalog.json`
              });
            }
          });
        } else if (typeof rawMissions === 'string') {
          list.push({
            link: null,
            title: this.formatId(rawMissions),
            href: `/eo-missions/${rawMissions}/catalog.json`
          });
        }
      }

      return list;
    },
    region() {
      if (!this.stac) return null;
      const rawRegion = this.stac['osc:region'] || this.stac.region;
      if (typeof rawRegion === 'string' && rawRegion.trim().length > 0) {
        return this.formatId(rawRegion);
      }
      return null;
    },
    status() {
      if (!this.stac) return null;
      const rawStatus = this.stac['osc:status'] || this.stac.status;
      if (typeof rawStatus === 'string' && rawStatus.trim().length > 0) {
        return rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      }
      return null;
    },
    hasSubMeta() {
      return this.themes.length > 0 || this.variables.length > 0 || this.missions.length > 0 || Boolean(this.region) || Boolean(this.status);
    },
    hasHeaderMeta() {
      return Boolean(this.project) || this.hasSubMeta;
    }
  },
  methods: {
    formatId(id) {
      if (!id || typeof id !== 'string') return id || '';
      return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    },
    toggleStacSidebar() {
      if (this.$root && typeof this.$root.sidebar !== 'undefined') {
        this.$root.sidebar = !this.$root.sidebar;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.osc-product-header {
  margin-top: 0;
  font-size: 0.95rem;

  .top-nav-bar {
    .nav-btn {
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      border-color: var(--bs-border-color, #dee2e6);
      color: var(--bs-body-color, #212529);

      &:hover {
        background-color: var(--bs-tertiary-bg, #f8f9fa);
        border-color: var(--bs-secondary, #6c757d);
      }
    }
  }

  .osc-product-title {
    font-size: 2rem;
    font-family: "NotesESAbold", sans-serif;
    color: var(--sb-h1-color, #003247);
    max-width: 850px;
    line-height: 1.25;
  }

  .osc-meta-project {
    display: flex;
    align-items: center;
    font-size: 1rem;

    .project-link {
      font-weight: 600;
    }
  }

  .meta-label {
    font-weight: 600;
    color: var(--bs-body-color);
  }

  .meta-separator {
    margin: 0 0.5rem;
    color: var(--bs-secondary-color, #6c757d);
  }

  .more-badge {
    border: 1px solid var(--bs-border-color, #ced4da);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-size: 0.85rem;
    cursor: pointer;
    background-color: var(--bs-body-secondary-bg, #f8f9fa);
    color: var(--bs-primary);

    &:hover {
      background-color: var(--bs-primary-bg-subtle, #e9ecef);
    }
  }

  .header-divider {
    opacity: 0.25;
  }
}
</style>
