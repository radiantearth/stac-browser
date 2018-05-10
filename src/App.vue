<template>
  <div id="app">
    <h1>{{ msg }}</h1>

    <catalog-list url="https://s3-us-west-2.amazonaws.com/radiant-nasa-iserv/iserv.json" />
  </div>
</template>

<script>
import CatalogList from "./CatalogList.vue";

export default {
  name: "App",
  components: {
    CatalogList
  },
  data() {
    return {
      msg: "Welcome to this Vue.js App!"
    };
  }
};
</script>

<style lang="css">
  /* #app {
    color: #56b983;
  } */
</style>
