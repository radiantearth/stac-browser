<template>
  <section v-if="formattedData.length > 0" class="metadata">
    <h2 v-if="title">{{ title }}</h2>
    <b-card-group columns :class="`count-${formattedData.length}`">
      <MetadataGroup v-for="group in formattedData" v-bind="group" :key="group.extension" />
    </b-card-group>
  </section>
</template>

<script>
import StacFields from '@radiantearth/stac-fields';
import MetadataGroup from './metadata/MetadataGroup.vue';

export default {
    name: "Metadata",
    components: {
        MetadataGroup
    },
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
@import "../theme/variables.scss";

#stac-browser {
    .metadata {
        .card {
            border: 0;
            margin-top: $block-margin;
            margin-bottom: $block-margin;
            text-align: left;

            .metadata-rows {
                border-radius: $border-radius;
            }

            .row {
                padding: 0.4rem;
                border-top: 1px solid rgba(0,0,0,0.125);

                &:first-child {
                    border-top: 0;
                }
                &:nth-child(odd) {
                    background: rgba(0,0,0,0.03);
                }
            }

            .label {
                padding-left: 0.4rem;
            }
            .value {
                padding-right: 0.4rem;
            }
        }
        .row {
            margin: 0;
            padding: 0;
        }
        .label {
            margin: 0;
            padding-left: 0;
            font-weight: 600;
            vertical-align: top;
        }
        .value {
            margin: 0;
            padding-right: 0;

            > ul, > ol, > pre, > dl {
                max-height: 15em;
                overflow: auto;
            }
        }
        ul, ol {
            padding-left: 1.4em;
            margin-bottom: 0;
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

            &:not(:last-of-type) > dl:only-child {
                margin-bottom: -1em;
            }
            &:after {
                content: "\A";
                white-space: pre;
                line-height: 1px;
            }
            &:last-of-type:after {
                content: "";
                white-space: normal;
            }
            .description {
                display: inline-block;
                
                > p:only-child {
                    display: inline;
                }
            }
            > ul, > ol {
                max-height: 15em;
                overflow: auto;
            }
        }
        .provider .description {
            font-size: 0.9em;
            line-height: 1.5em;
            margin-bottom: 0.5em;
        }
        .checksum-input {
            width: 100%;
        }

        .color {
            text-align: center;
            
            .color-code {
                color: white;
                text-shadow: 1px 1px 1px #000;
                text-align: center;
            }
        }
    }
}
</style>
