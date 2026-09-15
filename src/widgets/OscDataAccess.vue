<template>
  <section v-if="isOscProduct" class="osc-data-access mb-4">
    <header class="d-flex align-items-center mb-3">
      <h2 class="title me-2 mb-0">{{ $t('dataAccess.accessTheData') }}</h2>
      <b-badge v-if="totalCount > 0" pill variant="secondary">{{ totalCount }}</b-badge>
    </header>

    <!-- Summary text if datasets/items exist -->
    <p v-if="summaryText" class="text-secondary small mb-3">
      {{ summaryText }}
    </p>

      <!-- Section 1: Access Links (Zenodo, Jupyter Notebooks, external portals) -->
      <div v-if="accessLinks.length > 0" class="access-section mb-3">
        <div v-if="hasMultipleSections" class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">
          {{ $t('dataAccess.externalAccess') }}
        </div>
        <div class="d-flex flex-column gap-2">
          <div
            v-for="(link, index) in accessLinks"
            :key="'access-' + index"
            class="access-link-card p-3 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2"
          >
            <div class="d-flex align-items-center gap-3 min-w-0">
              <div class="icon-avatar rounded-circle p-2 bg-primary-subtle text-primary d-flex align-items-center justify-content-center">
                <component :is="getLinkIcon(link)" class="fs-5" />
              </div>
              <div class="link-info min-w-0">
                <div class="fw-bold text-dark text-truncate">{{ getLinkTitle(link) }}</div>
                <div class="text-muted extra-small text-truncate" :title="link.href">{{ formatUrl(link.href) }}</div>
              </div>
            </div>
            <a
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3"
            >
              <span>{{ getButtonLabel(link) }}</span>
              <b-icon-box-arrow-up-right class="small ms-1" />
            </a>
          </div>
        </div>
      </div>

      <!-- Section 2: Sub-Catalogs / Child Collections -->
      <div v-if="childCatalogs.length > 0" class="subcatalogs-section mb-3">
        <div v-if="hasMultipleSections" class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">
          {{ $t('dataAccess.subCatalogs') }}
        </div>
        <div class="d-flex flex-column gap-2">
          <div
            v-for="(cat, index) in childCatalogs"
            :key="'cat-' + index"
            class="subcatalog-card p-3 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2"
          >
            <div class="d-flex align-items-center gap-3 min-w-0">
              <div class="icon-avatar rounded-circle p-2 bg-info-subtle text-info d-flex align-items-center justify-content-center">
                <b-icon-folder2-open class="fs-5" />
              </div>
              <div class="link-info min-w-0">
                <div class="fw-bold text-dark text-truncate">{{ cat.title || 'Sub-Catalog' }}</div>
                <div class="text-muted extra-small text-truncate" :title="cat.href">{{ formatUrl(cat.href) }}</div>
              </div>
            </div>
            <StacLink
              :data="cat"
              :title="cat.title || 'Browse Sub-Catalog'"
              class="btn btn-primary btn-sm d-inline-flex align-items-center gap-1.5 px-3 text-nowrap"
            >
              <span>{{ $t('dataAccess.browseCatalog') }}</span>
              <b-icon-arrow-right class="small ms-1" />
            </StacLink>
          </div>
        </div>
      </div>

      <!-- Section 3: Data Items / Granules -->
      <div v-if="itemsCount > 0" class="items-section mb-3">
        <div class="items-card p-3 rounded border bg-light d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="icon-avatar rounded-circle p-2 bg-success-subtle text-success d-flex align-items-center justify-content-center">
              <b-icon-stack class="fs-5" />
            </div>
            <div>
              <div class="fw-bold text-dark">
                {{ $t('dataAccess.itemsAvailable', { count: itemsCount }, '{count} Data Items / Granules available') }}
              </div>
              <div class="text-muted extra-small">
                Browse, filter, and inspect individual data items in the items panel below.
              </div>
            </div>
          </div>
          <b-button
            variant="outline-success"
            size="sm"
            class="d-inline-flex align-items-center gap-1.5 px-3"
            @click="scrollToItems"
          >
            <b-icon-arrow-down-short class="fs-5" />
            <span>{{ $t('dataAccess.browseItems') }}</span>
          </b-button>
        </div>
      </div>

      <!-- Section 4: Collection Assets (if any) -->
      <div v-if="collectionAssets.length > 0" class="assets-section mb-3">
        <div class="section-subtitle fw-semibold text-secondary small text-uppercase mb-2">
          {{ $t('dataAccess.directDownload') }}
        </div>
        <div class="d-flex flex-column gap-2">
          <div
            v-for="(asset, index) in collectionAssets"
            :key="'asset-' + index"
            class="asset-card p-2.5 rounded border d-flex align-items-center justify-content-between flex-wrap gap-2"
          >
            <div class="d-flex align-items-center gap-2.5 min-w-0">
              <b-icon-file-earmark-arrow-down class="text-primary fs-5 flex-shrink-0 me-2" />
              <div class="text-truncate min-w-0">
                <span class="fw-semibold text-dark">{{ asset.title || asset.key }}</span>
                <span v-if="asset.type" class="badge bg-secondary-subtle text-secondary ms-2 extra-small">{{ asset.type }}</span>
              </div>
            </div>
            <a
              :href="asset.href"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline-secondary btn-sm px-2.5 py-1"
            >
              <b-icon-download class="me-1" />
              Download
            </a>
          </div>
        </div>
      </div>

      <!-- Section 5: Fallback when NO data access is available -->
      <div v-if="totalCount === 0" class="no-access-box p-3 rounded border border-warning-subtle bg-warning-subtle text-dark d-flex align-items-center gap-3">
        <b-icon-info-circle-fill class="text-warning fs-3 flex-shrink-0" />
        <div>
          <div class="fw-bold">{{ $t('dataAccess.noAccess') }}</div>
          <div class="small text-secondary">
            There are currently no direct data files, external access links, or child items registered for this product catalogue entry.
          </div>
        </div>
      </div>

  </section>
</template>

<script>
import { defineComponent } from 'vue';
import { mapState, mapGetters } from 'vuex';
import StacLink from '../components/StacLink.vue';

export default defineComponent({
  name: 'OscDataAccess',
  components: {
    StacLink
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['items', 'catalogs']),
    stac() {
      return this.data;
    },
    isOscProduct() {
      if (!this.stac) return false;
      const type = this.stac['osc:type'];
      return typeof type === 'string' && type.toLowerCase() === 'product';
    },
    links() {
      return Array.isArray(this.stac?.links) ? this.stac.links : [];
    },
    accessLinks() {
      if (!this.isOscProduct) return [];
      const subCatHrefs = this.childCatalogs.map(c => this.toAbsoluteUrl(c.href)).filter(Boolean);

      return this.links.filter(l => {
        if (!l || !l.href) return false;
        const rel = (l.rel || '').toLowerCase();
        const title = (l.title || '').toLowerCase();
        
        const isAccessRel = rel === 'via' || rel === 'access' || rel === 'external' || rel === 'osc:data-access';
        const isAccessTitle = title === 'access' || title.includes('data access') || title.includes('access data');
        
        if (!isAccessRel && !isAccessTitle) {
          return false;
        }

        if (title.includes('documentation') || title.includes('license') || title.includes('publication')) {
          return false;
        }
        if (l.href.includes('/projects/') || l.href.includes('/themes/') || l.href.includes('/variables/') || l.href.includes('/eo-missions/') || l.href.includes('/missions/')) {
          return false;
        }

        // Avoid double display: skip access links that point to the sub-catalog itself or its STAC viewer
        if (this.isLinkMatchingSubCatalog(l.href, subCatHrefs)) {
          return false;
        }

        return true;
      });
    },
    childCatalogs() {
      if (!this.isOscProduct) return [];
      return this.links.filter(l => {
        if (!l || !l.href) return false;
        if (l.rel !== 'child' && l.rel !== 'osc:subcatalog') return false;
        const href = l.href;
        if (href.includes('/projects/') || href.includes('/themes/') || href.includes('/variables/') || href.includes('/eo-missions/') || href.includes('/missions/') || href.includes('/experiments/')) {
          return false;
        }
        return true;
      });
    },
    itemsCount() {
      if (!this.isOscProduct) return 0;
      if (Array.isArray(this.items) && this.items.length > 0) {
        return this.items.length;
      }
      const itemLinks = this.links.filter(l => l && l.rel === 'item');
      return itemLinks.length;
    },
    collectionAssets() {
      if (!this.isOscProduct || !this.stac?.assets) return [];
      const assetsObj = this.stac.assets;
      return Object.keys(assetsObj).map(key => {
        const a = assetsObj[key];
        return {
          key,
          href: a.href,
          title: a.title || key,
          type: a.type || ''
        };
      });
    },
    totalCount() {
      return this.accessLinks.length + this.childCatalogs.length + (this.itemsCount > 0 ? 1 : 0) + this.collectionAssets.length;
    },
    hasMultipleSections() {
      const activeSections = [
        this.accessLinks.length > 0,
        this.childCatalogs.length > 0,
        this.itemsCount > 0,
        this.collectionAssets.length > 0
      ].filter(Boolean).length;
      return activeSections > 1;
    },
    summaryText() {
      if (this.totalCount === 0) return null;
      const parts = [];
      if (this.itemsCount > 0) {
        parts.push(`${this.itemsCount} dataset items`);
      }
      if (this.childCatalogs.length > 0) {
        parts.push(`${this.childCatalogs.length} sub-catalog${this.childCatalogs.length > 1 ? 's' : ''}`);
      }
      if (this.accessLinks.length > 0) {
        parts.push(`${this.accessLinks.length} external access method${this.accessLinks.length > 1 ? 's' : ''}`);
      }
      if (parts.length === 0) return null;
      return `This product provides data access via: ${parts.join(', ')}.`;
    }
  },
  methods: {
    getLinkTitle(link) {
      if (!link) return 'Access Data';
      if (link.title && link.title.toLowerCase() !== 'access') {
        return link.title;
      }
      const href = (link.href || '').toLowerCase();
      if (href.includes('ipynb') || href.includes('notebook')) {
        return 'Access Tutorial Notebook';
      }
      if (href.includes('zenodo')) {
        return 'Access Zenodo Repository';
      }
      if (href.includes('stac-browser') || href.includes('collection.json')) {
        return 'Access External STAC Catalog';
      }
      if (href.includes('thredds') || href.includes('s3') || href.includes('cloudferro')) {
        return 'Access Cloud Storage / Data Portal';
      }
      return 'Access Dataset';
    },
    getButtonLabel(link) {
      const href = (link.href || '').toLowerCase();
      if (href.includes('ipynb') || href.includes('notebook')) {
        return 'Open Notebook';
      }
      if (href.includes('stac-browser') || href.includes('collection.json')) {
        return 'Browse Catalog';
      }
      return 'Access Data';
    },
    getLinkIcon(link) {
      const href = (link.href || '').toLowerCase();
      if (href.includes('ipynb') || href.includes('notebook')) {
        return 'b-icon-journal-code';
      }
      if (href.includes('stac-browser') || href.includes('collection.json')) {
        return 'b-icon-folder2-open';
      }
      if (href.includes('s3') || href.includes('thredds') || href.includes('cloudferro')) {
        return 'b-icon-cloud-download';
      }
      return 'b-icon-box-arrow-up-right';
    },
    formatUrl(url) {
      if (!url) return '';
      try {
        const u = new URL(url);
        return u.hostname + u.pathname;
      } catch (e) {
        return url;
      }
    },
    toAbsoluteUrl(href) {
      if (!href) return '';
      try {
        const base = this.stac?.getAbsoluteUrl ? this.stac.getAbsoluteUrl() : (this.stac?._url || window.location.href);
        return new URL(href, base).href;
      } catch (e) {
        return href;
      }
    },
    isLinkMatchingSubCatalog(linkHref, subCatHrefs) {
      if (!linkHref || !Array.isArray(subCatHrefs) || subCatHrefs.length === 0) return false;
      const absLink = this.toAbsoluteUrl(linkHref);

      const normalize = (url) => {
        if (!url) return '';
        let decoded = url;
        try {
          decoded = decodeURIComponent(url);
        } catch (e) {}
        // If it is an external STAC browser URL, extract the embedded target URL
        const externalMatch = decoded.match(/#\/external\/(.+)$/);
        if (externalMatch && externalMatch[1]) {
          decoded = externalMatch[1];
        }
        return decoded
          .replace(/^https?:\/\//, '')
          .replace(/\/collection\.json$/, '')
          .replace(/\/catalog\.json$/, '')
          .replace(/\/$/, '');
      };

      const normLink = normalize(absLink);

      return subCatHrefs.some(subHref => {
        const normSub = normalize(subHref);
        if (!normSub || !normLink) return false;
        return normLink === normSub || normLink.includes(normSub) || normSub.includes(normLink);
      });
    },
    scrollToItems() {
      const itemsEl = document.querySelector('.items-container') || document.querySelector('.items');
      if (itemsEl) {
        itemsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.osc-data-access {
  .extra-small {
    font-size: 0.8rem;
  }

  .icon-avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
  }

  .access-link-card, .subcatalog-card, .items-card, .asset-card {
    background-color: var(--bs-body-bg, #ffffff);
    transition: all 0.2s ease-in-out;

    &:hover {
      border-color: var(--bs-primary) !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    }
  }
}
</style>
