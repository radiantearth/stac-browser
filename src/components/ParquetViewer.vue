<template>
  <section v-if="parquetAssets.length > 0" class="parquet-viewer mb-4">
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
        @select-row="onSelectRow"
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
  MAX_ROWS,
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
  emits: ['zoom-to-bbox', 'highlight-bbox'],
  data() {
    return {
      open: true,
      loading: false,
      loadingMessage: '',
      error: null,
      selectedAssetKey: null,
      parquetFile: null,
      parquetMetadata: null,
      tableData: null,
      geoInfo: { geometryColumn: null, bboxMapping: null, crs: null, crsDefinition: null },
      geometryTypes: [],
    };
  },
  computed: {
    parquetAssets() {
      return findParquetAssets(this.assets);
    },
    selectedAsset() {
      if (!this.selectedAssetKey) {return this.parquetAssets[0] || null;}
      return this.parquetAssets.find(a => a.getKey() === this.selectedAssetKey) || this.parquetAssets[0];
    },
    selectedAssetTitle() {
      if (!this.selectedAsset) {return '';}
      return this.selectedAsset.title || this.selectedAsset.getKey();
    },
    rowInfo() {
      if (!this.tableData) {return null;}
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
      if (!this.selectedAsset) {return;}

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
          crsDefinition: meta.crsDefinition,
        };

        this.loadingMessage = `Loading rows (${Math.min(meta.totalRows, MAX_ROWS).toLocaleString()})...`;
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
    scrollToMap() {
      const mapEl = document.querySelector('.hero-map, .maps-preview');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    async onSelectRow({ origIndex, bbox }) {
      const crs = this.geoInfo.crs || 'EPSG:4326';
      if (bbox) {
        this.$emit('highlight-bbox', { bbox, crs });
        return;
      }
      if (this.geoInfo.geometryColumn && this.parquetFile && this.parquetMetadata) {
        try {
          const parsedBbox = await getBboxForRow(
            this.parquetFile, this.parquetMetadata,
            this.geoInfo.geometryColumn, origIndex
          );
          if (parsedBbox) {
            this.$emit('highlight-bbox', { bbox: parsedBbox, crs });
          }
        } catch (err) {
          console.warn('Failed to parse geometry for highlight', err);
        }
      }
    },
    async onZoomToFeature({ origIndex, bbox }) {
      const crs = this.geoInfo.crs || 'EPSG:4326';
      if (bbox) {
        this.$emit('zoom-to-bbox', { bbox, crs });
        this.scrollToMap();
        return;
      }
      if (this.geoInfo.geometryColumn && this.parquetFile && this.parquetMetadata) {
        try {
          const parsedBbox = await getBboxForRow(
            this.parquetFile, this.parquetMetadata,
            this.geoInfo.geometryColumn, origIndex
          );
          if (parsedBbox) {
            this.$emit('zoom-to-bbox', { bbox: parsedBbox, crs });
            this.scrollToMap();
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

</style>
