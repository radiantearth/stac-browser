<template>
  <div class="codebox">
    <pre v-highlightjs>
      <code :class="language" :id="componentId">{{ code }}</code>
    </pre>
    <CopyButton variant="primary" :copyText="code">{{ $t('copy') }}</CopyButton>
  </div>
</template>
  
<script>
  export default {
    name: "CodeBox",
    components: {
      CopyButton: () => import("./CopyButton.vue")
    },
    props: {
      code: {
        type: String,
        default: "",
      },
       
      language: {
        type: String,
        default: "",
      },
    },
    data() {
      return {
        componentId: `${this.language}Content`
      };
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
