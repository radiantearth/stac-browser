<template>
  <b-tabs>
    <b-tab title="Python">
      <CodeBox :code="pythonCode" language="python" />
    </b-tab>
    <b-tab title="Javascript">
      <CodeBox :code="javascriptCode" language="javascript" />
    </b-tab>
    <b-tab title="R">
      <CodeBox :code="rCode" language="r" />
    </b-tab>
  </b-tabs>
</template>
    
  <script>
    import { BTabs, BTab } from 'bootstrap-vue';
    export default {
      name: "SearchCode",
      props: {
        catalogHref: String,
        filters: Object,
      },
      components: {
        BTab,
        BTabs,
        CodeBox: () => import('./CodeBox.vue'),
      },
      data() {
        return {
          componentId: `${this.language}Content`,
          pythonCode: null,
          javascriptCode: null,
          rCode: null
        }
      },
      methods: {
        filterString() {
          let obj = this.filters || {}
          for (let key in obj) {
            if (obj[key] === null || (Array.isArray(obj[key]) && obj[key].length === 0)) {
              delete obj[key];
            }
          }
          return JSON.stringify(obj)
        },
        generatePython() {
          return `
          from pystac_client import Client

          # Connect to STAC API
          stac_endpoint = '${this.catalogHref}'
          client = Client.open(stac_endpoint)

          # Build query
          query = ${this.filterString()}

          # Perform search
          search_result = client.search(query )
          `
        },
        generateJavascript() {
          return `
          // Define the STAC API endpoint
          const STAC_ENDPOINT = '${this.catalogHref}';

          // Define your search parameters
          const searchParams = ${this.filterString()};

          // Perform the search
          fetch(STAC_ENDPOINT, {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
          },
            body: JSON.stringify(searchParams)
          })
          .then(response => response.json())
          .then(data => {
            console.log("STAC search results:", data);
          })
          .catch(error => {
            console.error("Error fetching STAC data:", error);
          });
          `
        },
        generateR() {
          return `
          from pystac_client import Client

          # Connect to STAC API
          stac_api_url = '${this.catalogHref}'
          client = Client.open(stac_api_url)

          # Build query
          query = ${this.filterString()}

          # Perform search
          search_result = client.search(query)
          `
        },
        updateCode() {
          this.pythonCode = this.generatePython()
          this.javascriptCode = this.generateJavascript()
          this.rCode = this.generateR()
        }
      },
      watch: {
        filters: {
          deep: true,
          handler() {
            this.updateCode();
          }
        }
      },
      mounted() {
        this.updateCode();
      },
    };
  </script>
    
  <style scoped>
  </style>