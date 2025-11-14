import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { BootstrapVueNextResolver } from 'bootstrap-vue-next/resolvers';

export default defineConfig({
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                silenceDeprecations: [ 'color-functions', 'global-builtin', 'import']
            }
        }
    },
    plugins: [
        vue({
            template: {
                compilerOptions: {
                    // Preserve whitespace behavior from Vue 2
                    whitespace: 'preserve'
                },
            },
        }),
        Components({
            dirs: [],
            globs: [],
            resolvers: [
                BootstrapVueNextResolver({
                    components: {
                        'BContainer': true,
                        'BRow': true,
                        'BCol': true,
                        'BAlert': true,
                        'BButton': true,
                        'BButtonGroup': true,
                        'BBadge': true,
                        'BDropdown': true,
                        'BDropdownItem': true,
                        'BDropdownItemButton': true,
                        'BForm': true,
                        'BFormGroup': true,
                        'BFormInput': true,
                        'BFormSelect': true,
                        'BFormCheckbox': true,
                        'BFormRadio': true,
                        'BFormRadioGroup': true,
                        'BInputGroup': true,
                        'BListGroup': true,
                        'BListGroupItem': true,
                        'BPopover': true,
                        'BSpinner': true,
                    },
                }), // Auto-register Bootstrap components
                IconsResolver({
                    prefix: false,
                    enabledCollections: ['bi'],
                    alias: {
                        'b-icon': 'bi',
                    },
                    customCollections: ['share'],
                }),
            ],
        }),
        Icons({
            compiler: 'vue3',
            customCollections: {
                'share': FileSystemIconLoader('./src/media/'),
            },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 8080,
    }
});