<template>
  <div class="parquet-table-wrapper">
    <div class="parquet-filter-bar">
      <input
        v-model="filterText"
        type="text"
        class="form-control form-control-sm parquet-filter-input"
        :placeholder="$t('parquet.filterPlaceholder', 'Filter rows...')"
      />
      <select v-model="filterColumn" class="form-select form-select-sm parquet-filter-column">
        <option value="">{{ $t('parquet.allColumns', 'All columns') }}</option>
        <option v-for="col in displayColumns" :key="col" :value="col">{{ col }}</option>
      </select>
      <span class="parquet-row-count">
        <template v-if="filteredRows.length !== rows.length">
          {{ filteredRows.length }} / {{ rows.length }}
        </template>
        <template v-else-if="loadedRows < totalRows">
          {{ $t('parquet.showingOf', { loaded: loadedRows.toLocaleString(), total: totalRows.toLocaleString() }, `Showing first ${loadedRows.toLocaleString()} of ${totalRows.toLocaleString()} rows`) }}
        </template>
        <template v-else>
          {{ totalRows.toLocaleString() }} {{ $t('parquet.rows', 'rows') }}
        </template>
      </span>
    </div>
    <div class="parquet-scroll-container" ref="scrollContainer">
      <table class="table table-sm table-striped parquet-data-table">
        <thead>
          <tr>
            <th v-if="hasGeometry" class="parquet-zoom-col"></th>
            <th
              v-for="col in displayColumns"
              :key="col"
              class="parquet-header-cell"
              @click="toggleSort(col)"
            >
              <span class="parquet-header-text">{{ col }}</span>
              <span v-if="sortColumn === col" class="parquet-sort-indicator">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
              <span v-else class="parquet-sort-indicator parquet-sort-inactive">{{'↕'}}</span>
            </th>
            <th v-if="geometryColumn" class="parquet-header-cell parquet-geom-col">
              {{ geometryColumn }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in visibleRows" :key="row._origIndex">
            <td v-if="hasGeometry" class="parquet-zoom-col">
              <button
                v-if="canZoomRow(row)"
                class="btn btn-link btn-sm parquet-zoom-btn p-0"
                :title="$t('parquet.zoomToFeature', 'Zoom to feature')"
                @click="zoomToRow(row)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
                  <path d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
                </svg>
              </button>
            </td>
            <td v-for="col in displayColumns" :key="col" class="parquet-data-cell">
              {{ formatCellValue(row[col]) }}
            </td>
            <td v-if="geometryColumn" class="parquet-data-cell parquet-geom-col">
              {{ row._geomType || '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParquetTable',
  props: {
    columns: {
      type: Array,
      required: true
    },
    rows: {
      type: Array,
      required: true
    },
    totalRows: {
      type: Number,
      required: true
    },
    loadedRows: {
      type: Number,
      required: true
    },
    geometryColumn: {
      type: String,
      default: null
    },
    geometryTypes: {
      type: Array,
      default: () => []
    },
    bboxMapping: {
      type: Object,
      default: null
    }
  },
  emits: ['zoom-to-feature'],
  data() {
    return {
      filterText: '',
      filterColumn: '',
      sortColumn: null,
      sortDirection: null,
    };
  },
  computed: {
    hasGeometry() {
      return Boolean(this.geometryColumn);
    },
    displayColumns() {
      return this.columns.filter(c => c !== this.geometryColumn);
    },
    indexedRows() {
      return this.rows.map((row, i) => {
        const obj = { _origIndex: i };
        this.columns.forEach((col, ci) => {
          obj[col] = row[ci];
        });
        if (this.geometryTypes[i]) {
          obj._geomType = this.geometryTypes[i];
        }
        return obj;
      });
    },
    filteredRows() {
      let result = this.indexedRows;
      if (this.filterText) {
        const search = this.filterText.toLowerCase();
        result = result.filter(row => {
          const cols = this.filterColumn ? [this.filterColumn] : this.displayColumns;
          return cols.some(col => {
            const val = row[col];
            return val != null && String(val).toLowerCase().includes(search);
          });
        });
      }
      return result;
    },
    sortedRows() {
      if (!this.sortColumn || !this.sortDirection) {
        return this.filteredRows;
      }
      const col = this.sortColumn;
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      return [...this.filteredRows].sort((a, b) => {
        const va = a[col];
        const vb = b[col];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') {
          return (va - vb) * dir;
        }
        return String(va).localeCompare(String(vb)) * dir;
      });
    },
    visibleRows() {
      return this.sortedRows;
    }
  },
  methods: {
    toggleSort(col) {
      if (this.sortColumn === col) {
        if (this.sortDirection === 'asc') {
          this.sortDirection = 'desc';
        } else {
          this.sortColumn = null;
          this.sortDirection = null;
        }
      } else {
        this.sortColumn = col;
        this.sortDirection = 'asc';
      }
    },
    formatCellValue(val) {
      if (val == null) return '';
      if (val instanceof Uint8Array || val instanceof ArrayBuffer) return '[binary]';
      if (typeof val === 'object') {
        try {
          return JSON.stringify(val);
        } catch {
          return String(val);
        }
      }
      if (typeof val === 'bigint') return val.toString();
      return val;
    },
    canZoomRow(row) {
      if (this.bboxMapping) {
        return row[this.bboxMapping.xmin] != null;
      }
      return Boolean(this.geometryColumn);
    },
    zoomToRow(row) {
      let bbox = null;
      if (this.bboxMapping) {
        bbox = [
          row[this.bboxMapping.xmin],
          row[this.bboxMapping.ymin],
          row[this.bboxMapping.xmax],
          row[this.bboxMapping.ymax],
        ];
        if (bbox.some(v => v == null)) {
          bbox = null;
        }
      }
      this.$emit('zoom-to-feature', { origIndex: row._origIndex, bbox });
    }
  }
};
</script>

<style lang="scss">
@import "../theme/variables.scss";

.parquet-table-wrapper {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $border-radius;
  overflow: hidden;
}

.parquet-filter-bar {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
  background: $light;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.parquet-filter-input {
  max-width: 200px;
}

.parquet-filter-column {
  max-width: 160px;
}

.parquet-row-count {
  margin-left: auto;
  font-size: 0.8rem;
  color: $secondary;
  white-space: nowrap;
}

.parquet-scroll-container {
  overflow: auto;
  max-height: 400px;
}

.parquet-data-table {
  margin-bottom: 0;
  font-size: 0.85rem;
  white-space: nowrap;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: white;
  }
}

.parquet-header-cell {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  vertical-align: middle;

  &:hover {
    background-color: darken($light, 5%);
  }
}

.parquet-sort-indicator {
  margin-left: 0.25rem;
  font-size: 0.75rem;
}

.parquet-sort-inactive {
  opacity: 0.3;
}

.parquet-data-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.parquet-zoom-col {
  width: 32px;
  text-align: center;
  padding: 0.25rem !important;
}

.parquet-zoom-btn {
  color: $primary;
  line-height: 1;
  &:hover {
    color: darken($primary, 15%);
  }
}

.parquet-geom-col {
  color: $secondary;
  font-style: italic;
}

.parquet-expanded .parquet-scroll-container {
  max-height: 600px;
}
</style>
