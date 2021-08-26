<template>
    <section v-show="formattedData.length > 0" class="metadata">
        <h2 v-if="formattedData.length > 0 && title">{{ title }}</h2>
        <b-card-group v-if="formattedData.length > 0" columns :class="`count-${formattedData.length}`">
            <b-card v-for="group in formattedData" :key="group.extension" class="metadata-card">
                <b-card-title>
                    <div v-if="group.extension" v-html="group.label" />
                    <template v-else>{{ commmonMetadataTitle }}</template>
                </b-card-title>
                <b-row v-for="(prop, key) in group.properties" :key="key">
                    <b-col md="5" class="label" :title="key" v-html="prop.label" />
                    <b-col md="7" class="value" v-html="prop.formatted" />
                </b-row>
            </b-card>
        </b-card-group>
    </section>
</template>

<script>
import StacFields from '@radiantearth/stac-fields';

export default {
    name: "Metadata",
    props: {
        data: {
            type: Object,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        context: {
            type: Object,
            default: null
        },
        ignoreFields: {
            type: Array,
            default: () => ([])
        },
        title: {
            type: String,
            default: 'Metadata'
        },
        commmonMetadataTitle: {
            type: String,
            default: 'General'
        }
    },
    computed: {
        formattedData() {
            // Filter all fields as given in ignoreFields and also 
            // ignore fields starting with an underscore which is likely originating from the STAC class
            let filter = key => !key.startsWith('_') && !this.ignoreFields.includes(key);
            switch(this.type) {
                case 'Asset':
                    return StacFields.formatAsset(this.data, this.context, filter);
                case 'Link':
                    return StacFields.formatLink(this.data, this.context, filter);
                case 'Item':
                    return StacFields.formatItemProperties(this.data, filter);
                case 'Collection':
                case 'Catalog': {
                    let core = StacFields.formatCollection(this.data, filter);
                    let summaries = StacFields.formatSummaries(this.data, filter);
                    // Merge summaries into collection metadata
                    summaries.forEach(summaryGroup => {
                        let index = core.findIndex(coreGroup => summaryGroup.extension === coreGroup.extension);
                        if (index !== -1) {
                            Object.assign(core[index].properties, summaryGroup.properties);
                        }
                        else {
                            core.push(summaryGroup);
                        }
                    });
                    return core.sort((a,b) => a.label.localeCompare(b.label));
                }
                default:
                    return [];
            }
        }
    }
};

</script>

<style lang="scss">
.metadata {
    .label {
        font-weight: 600;
        vertical-align: top;
    }
    ul, ol {
        padding-left: 1.2em;
    }
    ul li {
        list-style-type: '- ';
    }
    dl {
        margin: 0;
        margin-left: 1em;
        margin-bottom: 0.5em;

        &:only-child {
            margin-left: 0;
        }
        dl:only-child {
            margin-left: 1em;
        }
    }
    ul > li > dl, ol > li > dl {
        margin-left: 0;
    }
    dt {
        display: inline;
    }
    dt:after {
        content: ': ';
    }
    dd {
        display: inline;

        > ul, > ol {
            max-height: 10em;
            overflow: auto;
        }
    }
    dd:after {
        content: "\A";
        white-space: pre;
        line-height: 1px;
    }
    dd:last-of-type:after {
        content: "";
        white-space: normal;
    }
    .provider .description {
        font-size: 0.9em;
        line-height: 1.5em;
        margin-bottom: 0.5em;
    }
}
</style>
