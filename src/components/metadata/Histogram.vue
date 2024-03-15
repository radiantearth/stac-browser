<template>
  <div class="histogram">
    <Bar :data="chartData" :options="allOptions" />
  </div>
</template>

<script>
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Colors,
  Title,
  Tooltip,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(Title, Tooltip, Colors, BarElement, CategoryScale, LinearScale);

export default {
  name: "Histogram",
  components: {
    Bar
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    allOptions() {
      let options = {
        responsive: true,
        animation: false,
        scales: {
          x: {
            ticks: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false,
          }
        }
      };
      return Object.assign(options, this.options);
    },
    chartData() {
      let values = [];
      let labels = [];
      let width = (this.data.max - this.data.min) / this.data.count;
      let last = this.data.min;
      for(let i = 0; i < this.data.count; i++) {
        let min = Math.round(last * 100) / 100;
        let max = Math.round((last+width) * 100) / 100;
        labels.push(`${min} - ${max}`);
        last += width;

        values.push(this.data.buckets[i] || 0);
      }

      return {
        labels,
        datasets: [
          {
            data: values,
            barPercentage: 1,
            categoryPercentage: 1,
          }
        ]
      };
    }
  }
};
</script>

<style scoped>
.histogram {
  min-width: 150px;
}
</style>
