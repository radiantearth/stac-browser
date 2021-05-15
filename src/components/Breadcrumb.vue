<template>
  <nav>
    <b-breadcrumb :items="breadcrumbItems">
      <template v-for="(item, i) in breadcrumbItems">
        <b-breadcrumb-item v-if="item.missing" :key="i" @click="loadBreadcrumb">...</b-breadcrumb-item>
        <b-breadcrumb-item v-else v-bind="item.options" :key="i">{{ item.title }}</b-breadcrumb-item>
      </template>
    </b-breadcrumb>
  </nav>
</template>

<script>
export default {
  name: "Breadcrumb",
  computed: {
    breadcrumbItems() {
      let items = [
        {
          text: CATALOG_TITLE,
          options: {
            to: "/",
            active: this.isRoot
          }
        }
      ];
      if (!this.isRoot) {
        items.push({
          missing: true
        });
      }
      return items;
    },
    isRoot() {
      return true;
    }
  }
};
</script>