<template>
  <div class="codebox">
    <pre v-highlightjs>
      <code :class="language" :id="componentId">
        {{ code }}
      </code>
    </pre>
    <button ref="copyButton" :data-clipboard-target="'#' + componentId">Copy</button>
  </div>
</template>
  
<script>
  import Clipboard from 'clipboard';

  export default {
    name: "CodeBox",
    props: {
      code: String,
      language: String
    },
    data() {
      return {
        componentId: `${this.language}Content`
      }
    },
    mounted() {
        new Clipboard(this.$refs.copyButton);
    },
  };
</script>
  
<style scoped>
  .codebox {
    border: 1px solid #ccc;
    padding: 16px;
    border-radius: 8px;
  }
  .codebox button {
    background-color: #007BFF;
    color: #FFF;
    padding: 5px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  .codebox button:hover {
    background-color: #0056b3;
  }
  .codebox pre, .codebox code {
    padding: 0;
    margin: 0;
  }

</style>