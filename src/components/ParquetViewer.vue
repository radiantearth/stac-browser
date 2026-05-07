<template>
  <section v-if="parquetAssets.length > 0" class="parquet-viewer mb-4" :class="{ 'parquet-expanded': expanded }">
    <div class="parquet-header" @click="open = !open">
      <span class="parquet-header-left">
        <BIconChevronDown v-if="open" />
        <BIconChevronRight v-else />
        <span class="parquet-title">{{ $t('parquet.dataPreview', 'Data Preview') }}</span>
        <b-badge variant="primary" class="parquet-file-badge">{{ selectedAssetTitle }}</b-badge>
      </span>
      <span class="parquet-header-right">
        <select
          v-if="parquetAssets.length > 1"
          v-model="selectedAssetKey"
          class="form-select form-select-sm parquet-asset-select"
          @click.stop
        >
          <option v-for="asset in parquetAssets" :key="asset.getKey()" :value="asset.getKey()">
            {{ asset.title || asset.getKey() }}
          </option>
        </select>
        <span v-if="rowInfo" class="parquet-meta-info">{{ rowInfo }}</span>
        <button
          v-if="open"
          class="btn btn-sm parquet-expand-btn"
          :class="expanded ? 'btn-primary' : 'btn-outline-primary'"
          :title="expanded ? $t('parquet.collapse', 'Collapse') : $t('parquet.expand', 'Expand')"
          @click.stop="expanded = !expanded"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path v-if="!expanded" d="M5.828 10.172a.5.5 0 0 0-.707 0l-4.096 4.096V11.5a.5.5 0 0 0-1 0v3.975a.5.5 0 0 0 .5.5H4.5a.5.5 0 0 0 0-1H1.732l4.096-4.096a.5.5 0 0 0 0-.707zm4.344-4.344a.5.5 0 0 0 .707 0l4.096-4.096V4.5a.5.5 0 1 0 1 0V.525a.5.5 0 0 0-.5-.5H11.5a.5.5 0 0 0 0 1h2.768l-4.096 4.096a.5.5 0 0 0 0 .707z"/>
            <path v-else d="M.172 15.828a.5.5 0 0 0 .707 0l4.096-4.096V14.5a.5.5 0 1 0 1 0v-3.975a.5.5 0 0 0-.5-.5H1.5a.5.5 0 0 0 0 1h2.768L.172 15.121a.5.5 0 0 0 0 .707zM15.828.172a.5.5 0 0 0-.707 0L11.025 4.268V1.5a.5.5 0 1 0-1 0v3.975a.5.5 0 0 0 .5.5H14.5a.5.5 0 0 0 0-1h-2.768L15.828.879a.5.5 0 0 0 0-.707z"/>
          </svg>
        </button>
      </span>
    </div>
    <b-collapse v-model="open">
      <div v-if="loading" class="parquet-loading">
        <div class="spinner-border spinner-border-sm text-primary" role="status">
          <span class="visually-hidden">{{ $t('loading') }}</span>
        </div>
        <span class="ms-2">{{ loadingMessage }}</span>
      </div>
      <div v-else-if="error" class="parquet-error alert alert-warning m-2">
        <p class="mb-1">{{ error }}</p>
        <button class="btn btn-sm btn-outline-primary" @click="loadData">{{ $t('parquet.retry', 'Retry') }}</button>
      </div>
      <ParquetTable
        v-else-if="tableData"
        :columns="tableData.columns"
        :rows="tableData.rows"
        :totalRows="tableData.totalRows"
        :loadedRows="tableData.loadedRows"
        :geometryColumn="geoInfo.geometryColumn"
        :geometryTypes="geometryTypes"
        :bboxMapping="geoInfo.bboxMapping"
        @zoom-to-feature="onZoomToFeature"
      />
    </b-collapse>
  </section>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import { BCollapse, BBadge } from 'bootstrap-vue-next';
import BIconChevronDown from '~icons/bi/chevron-down';
import BIconChevronRight from '~icons/bi/chevron-right';
import {
  findParquetAssets,
  loadParquetMetadata,
  loadParquetRows,
  loadGeometryTypesForRows,
  getBboxForRow,
} from '../utils/parquet';

export default {
  name: 'ParquetViewer',
  components: {
    BCollapse,
    BBadge,
    BIconChevronDown,
    BIconChevronRight,
    ParquetTable: defineAsyncComponent(() => import('./ParquetTable.vue')),
  },
  props: {
    assets: {
      type: Array,
      required: true
    }
  },
  emits: ['zoom-to-bbox'],
  data() {
    return {
      open: true,
      expanded: false,
      loading: false,
      loadingMessage: '',
      error: null,
      selectedAssetKey: null,
      parquetFile: null,
      parquetMetadata: null,
      tableData: null,
      geoInfo: { geometryColumn: null, bboxMapping: null, crs: null },
      geometryTypes: [],
    };
  },
  computed: {
    parquetAssets() {
      return findParquetAssets(this.assets);
    },
    selectedAsset() {
      if (!this.selectedAssetKey) return this.parquetAssets[0] || null;
      return this.parquetAssets.find(a => a.getKey() === this.selectedAssetKey) || this.parquetAssets[0];
    },
    selectedAssetTitle() {
      if (!this.selectedAsset) return '';
      return this.selectedAsset.title || this.selectedAsset.getKey();
    },
    rowInfo() {
      if (!this.tableData) return null;
      if (this.tableData.loadedRows < this.tableData.totalRows) {
        return `${this.tableData.loadedRows.toLocaleString()} / ${this.tableData.totalRows.toLocaleString()} rows`;
      }
      return `${this.tableData.totalRows.toLocaleString()} rows`;
    }
  },
  watch: {
    selectedAsset: {
      immediate: true,
      handler() {
        if (this.selectedAsset) {
          this.loadData();
        }
      }
    }
  },
  methods: {
    async loadData() {
      if (!this.selectedAsset) return;

      this.loading = true;
      this.error = null;
      this.tableData = null;
      this.geometryTypes = [];

      try {
        const url = this.selectedAsset.getAbsoluteUrl();
        this.loadingMessage = 'Loading metadata...';
        const meta = await loadParquetMetadata(url);
        this.parquetFile = meta.file;
        this.parquetMetadata = meta.metadata;
        this.geoInfo = {
          geometryColumn: meta.geometryColumn,
          bboxMapping: meta.bboxMapping,
          crs: meta.crs,
        };

        this.loadingMessage = `Loading rows (${Math.min(meta.totalRows, 50000).toLocaleString()})...`;
        const data = await loadParquetRows(
          meta.file, meta.metadata, meta.columnNames, meta.geometryColumn
        );
        this.tableData = data;

        if (meta.geometryColumn) {
          this.loadingMessage = 'Reading geometry types...';
          this.geometryTypes = await loadGeometryTypesForRows(
            meta.file, meta.metadata, meta.geometryColumn, data.loadedRows
          );
        }
      } catch (err) {
        console.error('ParquetViewer: failed to load', err);
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          this.error = 'Unable to preview: cross-origin access not allowed or network error.';
        } else {
          this.error = `Failed to load parquet data: ${err.message}`;
        }
      } finally {
        this.loading = false;
        this.loadingMessage = '';
      }
    },
    async onZoomToFeature({ origIndex, bbox }) {
      if (bbox) {
        this.$emit('zoom-to-bbox', bbox);
        return;
      }
      if (this.geoInfo.geometryColumn && this.parquetFile && this.parquetMetadata) {
        try {
          const parsedBbox = await getBboxForRow(
            this.parquetFile, this.parquetMetadata,
            this.geoInfo.geometryColumn, origIndex
          );
          if (parsedBbox) {
            this.$emit('zoom-to-bbox', parsedBbox);
          }
        } catch (err) {
          console.warn('Failed to parse geometry for zoom', err);
        }
      }
    }
  }
};
</script>

<style lang="scss">
@import "../theme/variables.scss";

.parquet-viewer {
  border-radius: $border-radius;
}

.parquet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e8ecef;
  gap: 0.5rem;

  &:hover {
    .parquet-title {
      color: $dark;
    }
  }
}

.parquet-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: $secondary;
    flex-shrink: 0;
  }
}

.parquet-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: $secondary;
}

.parquet-file-badge {
  font-size: 0.75rem;
  font-weight: 500;
}

.parquet-header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.parquet-asset-select {
  max-width: 180px;
  font-size: 0.8rem;
}

.parquet-meta-info {
  font-size: 0.8rem;
  color: $secondary;
  white-space: nowrap;
}

.parquet-expand-btn {
  padding: 0.15rem 0.4rem;
  line-height: 1;
}

.parquet-loading {
  display: flex;
  align-items: center;
  padding: 1rem;
  color: $secondary;
  font-size: 0.9rem;
}

.parquet-error {
  font-size: 0.9rem;
}

.parquet-expanded {
  margin-left: calc(-1 * #{$block-margin});
  margin-right: calc(-1 * #{$block-margin});
  padding-left: $block-margin;
  padding-right: $block-margin;

  .parquet-scroll-container {
    max-height: 600px;
  }
}
</style>
