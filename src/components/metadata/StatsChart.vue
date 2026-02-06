<template>
  <div class="chart mb-4">
    <component :is="component" :data="chartData" :options="allOptions" />
  </div>
</template>

<script>
import { formatKey } from "@radiantearth/stac-fields/helper";
import { extension } from "@radiantearth/stac-fields/interface";
import { formatMediaType } from "@radiantearth/stac-fields/formatters";
import Utils from "../../utils";

import { Bar, Pie } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Colors,
  Title,
  Tooltip,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Colors, ArcElement, BarElement, CategoryScale, LinearScale);

export default {
  name: "StatsChart",
  components: {
    Bar,
    Pie
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    component() {
      switch(this.type) {
        case 'versions':
          return 'Pie';
        default:
          return 'Bar';
      }
    },
    title() {
      switch(this.type) {
        case 'versions':
          return this.$t('source.stacVersion');
        case 'extensions':
          return this.$t('source.stacExtension');
        case 'assets':
          return this.$t('source.fileFormat');
        default:
          return '';
      }
    },
    allOptions() {
      let options = {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: this.title
          },
        },
        scales: {
          y: {
            min: 0,
            max: this.count,
            title: {
              display: false
            }
          }
        }
      };
      return Object.assign(options, this.options);
    },
    chartData() {
      let labels = [];
      let values = [];
      for (let id in this.data) {
        let count = this.data[id];
        values.push(count);

        let label;
        switch(this.type) {
          case 'extensions': {
            let ext = this.parseExtension(id);
            label = `${ext.title}`;
            if (ext.version) {
              label += ` (${ext.version})`;
            }
            break;
          }
          case 'assets':
            label = formatMediaType(id);
            break;
          default:
            label = id;
        }
        labels.push(label);
      }
      return {
        labels,
        datasets: [
          {
            data: values
          }
        ]
      };
    }
  },
  methods: {
    parseExtension(uri) {
      let version = null;
      let title = uri;
      let match = uri.match(/^https?:\/\/stac-extensions\.github\.io\/([^/]+)\/v?([^/]+)(?:\/([^/.]+))?\/schema/);
      if (match) {
        version = match[2];
        title = extension(match[1]);
        if (match[3]) {
          title += ' - ' + formatKey(match[3]);
        }
      }
      else {
        title = uri.replace(/^https?:\/\/(www.)?/, '').replace(/\/schema(\.json)?$/, '');
        title = Utils.shortenTitle(title, 30);
      }
      return { title, version };
    }
  }
};
</script>