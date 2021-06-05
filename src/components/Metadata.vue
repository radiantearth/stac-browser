<template>
    <div>
        <template v-for="group in metadata">
            <h4 v-if="group.extension" v-html="group.label" :key="group.extension" />
            <table class="table-responsive" :key="group.extension">
                <tbody>
                    <tr v-for="(prop, key) in group.properties" v-show="ignoreFields.includes(key)" :key="key">
                        <td class="title" :title="key" v-html="prop.label" />
                        <td v-html="prop.formatted" />
                    </tr>
                </tbody>
            </table>
        </template>
    </div>
</template>

<script>
export default {
    name: "Metadata",
    props: {
        metadata: {
            type: Object,
            required: true
        },
        ignoreFields: {
            type: Array,
            default: () => ([])
        }
    }
};

</script>

<style>
.metadata td.title {
  font-weight: bold;
  width: 33%;
  text-align: right;
  vertical-align: top;
}
.metadata ul, .metadata ol {
    padding-left: 2em;
}
.metadata-object .metadata-object {
    margin-left: 1em;
}
.metadata dl {
    margin: 0;
    margin-left: 1em;
}
.metadata ul > li > dl, .metadata ol > li > dl {
    margin-left: 0;
}
.metadata dt {
    display: inline;
}
.metadata dt:after {
    content: ': ';
}
.metadata dd {
    display: inline;
}
.metadata dd:after {
    content: "\A";
    white-space: pre;
    line-height: 1px;
}
.metadata dd:last-of-type:after {
    content: "";
    white-space: normal;
}
.metadata .provider .description {
    font-size: 0.9em;
    line-height: 1.5em;
    margin-bottom: 0.5em;
}
</style>
