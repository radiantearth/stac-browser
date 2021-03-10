<template>
  <div class="table-responsive links">
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Link</th>
          <th>Relation</th>
          <th>Content-Type</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(link, i) in links" :key="i">
          <td>
            <a
                :href="link.href"
                :rel="link.rel">{{ title(link) }}</a>
          </td>
          <td>
            <code>{{ link.rel }}</code>
          </td>
          <td>
            <code>{{ link.type }}</code>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>

export default {
  name: "LinkTab",
  props: ["links"],
  methods: {
    title(link) {
      if (typeof link.title === 'string' && link.title.length > 0) {
        return link.title;
      }
      else if (link.href.length > 50) {
        return link.href.replace(/^\w+:\/\/([^\/]+)((\/[^\/\?]+)*\/([^\/\?]+)(\?.*)?)?$/ig, function(...x) {
          if (x[4]) {
            return x[1] + '​/[…]/​' + x[4]; // There are invisible zero-width whitespaces after and before the slashes. It allows breaking the link in the browser. Be careful when editing.
          }
          return x[1];
        });
      }
      return link.href.replace(/^\w+:\/\//i, '');
    }
  }
};

</script>
