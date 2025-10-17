<template>
  <div class="valid">
    <b-spinner v-if="working" :label="$t('source.validating')" small />
    <b-button v-else-if="valid === true" variant="success" :size="size" :to="validationLink"><IBiCheck /> {{ $t('checkbox.true') }}</b-button>
    <b-button v-else-if="valid === false" variant="danger" :size="size" :to="validationLink"><IBiX /> {{ $t('checkbox.false') }}</b-button>
    <template v-else>{{ $t('source.validationNA') }}</template>
  </div>
</template>

<script>
import { STAC } from 'stac-js';
import validateSTAC from 'stac-node-validator';

export default {
  name: "Validation",
  components: {},
  props: {
    data: {
      type: Object,
      default: null
    },
    size: {
      type: String,
      default: "sm"
    }
  },
  data() {
    return {
      working: true,
      valid: null
    };
  },
  computed: {
    validationLink() {
      if (this.data instanceof STAC) {
        return '/validation' + this.data.getBrowserPath();
      }
      else {
        return null;
      }
    }
  },
  async created() {
    await this.validate();
  },
  methods: {
    async validate() {
      this.working = true;
      this.valid = null;
      try {
        if (this.data instanceof STAC) {
          const report = await validateSTAC(this.data);
          this.valid = report.valid;
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.working = false;
      }
    }
  }
};
</script>


