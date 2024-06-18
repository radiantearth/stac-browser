<template>
  <div>
    <b-button-group class="actions" :vertical="vertical" :size="size" v-if="href">
      <b-button variant="danger" v-if="requiresAuth" :id="`popover-href-${id}-btn`" @click="handleAuthButton">
        <b-icon-lock /> {{ $i18n.t('authentication.required') }}
      </b-button>
      <b-button v-if="hasDownloadButton" :disabled="requiresAuth" v-bind="downloadProps" v-on="downloadEvents" variant="primary">
        <b-spinner v-if="loading" small variant="light" />
        <b-icon-box-arrow-up-right v-else-if="browserCanOpenFile" /> 
        <b-icon-download v-else />
        {{ buttonText }}
      </b-button>
      <CopyButton variant="primary" :copyText="href" :title="href">
        {{ copyButtonText }}
      </CopyButton>
      <b-button v-if="hasShowButton" @click="show" variant="primary">
        <b-icon-eye class="mr-1" />
        <template v-if="isThumbnail">{{ $t('assets.showThumbnail') }}</template>
        <template v-else>{{ $t('assets.showOnMap') }}</template>
      </b-button>
      <b-button v-for="action of actions" v-bind="action.btnOptions" :key="action.id" variant="primary" @click="action.onClick">
        <component v-if="action.icon" :is="action.icon" class="mr-1" />
        {{ action.text }}
      </b-button>
    </b-button-group>
    
    <b-popover
      v-if="auth.length > 1"
      :id="`popover-href-${id}`" custom-class="href-auth-methods" :target="`popover-href-${id}-btn`"
      triggers="focus" container="stac-browser" :title="$i18n.t('authentication.chooseMethod')"
    >
      <b-list-group>
        <AuthSchemeItem v-for="(method, i) in auth" :key="i" :method="method" @authenticate="startAuth" />
      </b-list-group>
    </b-popover>
  </div>
</template>


<script>
import { BIconBoxArrowUpRight, BIconDownload, BIconEye, BIconLock, BListGroup, BPopover, BSpinner } from 'bootstrap-vue';
import Description from './Description.vue';
import STAC from '../models/stac';
import Utils, { browserProtocols, imageMediaTypes, mapMediaTypes } from '../utils';
import { mapGetters, mapState } from 'vuex';
import AssetActions from '../../assetActions.config';
import LinkActions from '../../linkActions.config';
import { stacRequestOptions } from '../store/utils';
import URI from 'urijs';
import AuthUtils from './auth/utils';

let i = 0;

export default {
  name: 'HrefActions',
  components: {
    AuthSchemeItem: () => import('./AuthSchemeItem.vue'),
    BIconBoxArrowUpRight,
    BIconDownload,
    BIconEye,
    BIconLock,
    BListGroup,
    BPopover,
    BSpinner,
    CopyButton: () => import('./CopyButton.vue'),
    Description,
    Metadata: () => import('./Metadata.vue')
  },
  props: {
    data: {
      type: Object,
      required: true
    },
    isAsset: {
      type: Boolean,
      default: false
    },
    vertical: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    },
    shown: {
      type: Boolean,
      default: false
    },
    auth: {
      type: Array,
      default: () => ([])
    }
  },
  data() {
    return {
      id: i++,
      loading: false
    };
  },
  computed: {
    ...mapState(['pathPrefix', 'requestHeaders']),
    ...mapGetters(['getRequestUrl']),
    ...mapGetters('auth', ['isLoggedIn']),
    requiresAuth() {
      return !this.isLoggedIn && this.auth.length > 0;
    },
    actions() {
      return Object.entries(this.isAsset ? AssetActions : LinkActions)
        .map(([id, plugin]) => new plugin(this.data, this, id))
        .filter(plugin => plugin.show);
    },
    canShow() {
      // We need to know the type, otherwise we don't even try to show it
      if (typeof this.data.type !== 'string') {
        return false;
      }
      // If the tile renderer is a tile server, we can't really know what it supports so we pass all images
      else if (this.tileRendererType === 'server' && imageMediaTypes.includes(this.data.type)) {
        return true;
      }
      // Don't pass GDAL VFS URIs to client-side tile renderer: https://github.com/radiantearth/stac-browser/issues/116
      else if (this.isGdalVfs && this.tileRendererType === 'client') {
        return false;
      }
      // Only http(s) links and relative links are supported
      else if (!this.isBrowserProtocol) {
        return false;
      }
      // Otherwise, all images that a browser can read are supported + JSON
      else if (mapMediaTypes.includes(this.data.type)) {
        return true;
      }
      return false;
    },
    hasShowButton() {
      return this.isAsset && this.canShow && !this.shown;
    },
    hasDownloadButton() {
      return this.isAsset && this.isBrowserProtocol;
    },
    downloadEvents() {
      if (this.hasDownloadButton && this.useAltDownloadMethod) {
        return {
          click: async (event) => {
            event.preventDefault();
            this.altDownload();
          }
        };
      }
      return {};
    },
    filename() {
      if (typeof this.data['file:local_path'] === 'string') {
        return URI(this.data['file:local_path']).filename();
      }
      return this.parsedHref.filename();
    },
    downloadProps() {
      if (this.hasDownloadButton && !this.useAltDownloadMethod) {
        const props = {
          href: this.href,
          target: '_blank',
        };
        if (!this.browserCanOpenFile) {
          props.download = this.filename;
        }
        return props;
      }
      return {};
    },
    useAltDownloadMethod() {
      if (!this.isBrowserProtocol || !window.isSecureContext) {
        return false;
      }
      else if (typeof this.data.method === 'string' && this.method.toUpperCase() !== 'GET') {
        return true;
      }
      else if (Utils.size(this.data.headers) > 0 || Utils.size(this.requestHeaders) > 0) {
        return true;
      }
      return false;
    },
    protocol() {
      if (typeof this.href === 'string') {
        if (this.href) {
          let match = this.href.match(/^(\w+):\/\//);
          if (match) {
            return match[1].toLowerCase();
          }
        }
      }
      return null;
    },
    isBrowserProtocol() {
      return (!this.protocol && !this.isGdalVfs) || browserProtocols.includes(this.protocol);
    },
    isThumbnail() {
      if (this.isAsset) {
        return Array.isArray(this.data.roles) && this.data.roles.includes('thumbnail') && !this.data.roles.includes('overview');
      }
      else {
        return this.data.rel === 'preview' && Utils.canBrowserDisplayImage(this.data);
      }
    },
    isGdalVfs() {
      return Utils.isGdalVfsUri(this.href);
    },
    href() {
      if (typeof this.data.href !== 'string') {
        return null;
      }
      let baseUrl = null;
      if (this.context instanceof STAC) {
        baseUrl = this.context.getAbsoluteUrl();
      }
      try {
        return this.getRequestUrl(this.data.href, baseUrl);
      } catch (e) {
        return this.data.href;
      }
    },
    parsedHref() {
      return URI(this.href);
    },
    from() {
      if (this.isGdalVfs) {
        let type = this.href.match(/^\/vsi([a-z\d]+)(_streaming)?\//);
        return this.protocolName(type);
      }
      else {
        return this.protocolName(this.protocol);
      }
    },
    browserCanOpenFile() {
      if (this.isGdalVfs || this.useAltDownloadMethod)  {
        return false;
      }
      if (Utils.canBrowserDisplayImage(this.data)) {
        return true;
      }
      else if (typeof this.data.type === 'string') {
        switch(this.data.type.toLowerCase()) {
          case 'text/html':
          case 'application/xhtml+xml':
          case 'text/plain':
          case 'application/pdf':
            return true;
        }
      }
      return false;
    },
    buttonText() {
      if (this.browserCanOpenFile && this.isBrowserProtocol) {
        return this.$t('open');
      }
      let where = (!this.isBrowserProtocol && this.from) ? 'withSource' : 'generic';
      return this.$t(`assets.download.${where}`, {source: this.from});
    },
    copyButtonText() {
      let what = this.isGdalVfs ? 'copyGdalVfsUrl' : 'copyUrl';
      let where = (!this.isBrowserProtocol && this.from) ? 'withSource' : 'generic';
      return this.$t(`assets.${what}.${where}`, {source: this.from});
    }
  },
  methods: {
    async altDownload() {
      if (!window.isSecureContext) {
        window.location.href = this.href;
      }

      try {
        this.loading = true;
        const StreamSaver = require('streamsaver-js');

        const uri = URI(window.origin.toString());
        uri.path(Utils.removeTrailingSlash(this.pathPrefix) + '/mitm.html');
        StreamSaver.mitm = uri.toString();

        const link = Object.assign({}, this.data, {href: this.href});
        const options = stacRequestOptions(this.$store, link);

        // Convert from axios to fetch
        const url = options.url;
        delete options.url;
        if (typeof options.data !== 'undefined') {
          options.body = options.data;
          delete options.data;
        }

        //options.credentials = 'include';

        // Use fetch because stacRequest uses axios
        // and axios doesn't support responseType: 'stream'
        const res = await fetch(url, options);
        if (res.status >= 400) {
          let msg;
          switch(res.status) {
            case 401:
              msg = this.$t('errors.unauthorized');
              break;
            case 403:
              msg = this.$t('errors.authFailed');
              break;
            case 404:
              msg = this.$t('errors.notFound');
              break;
            case 500:
              msg = this.$t('errors.serverError');
              break;
            default:
              msg = this.$t('errors.networkError');
              break;
          }
          throw new Error(msg);
        }

        let filename = this.filename;
        const contentDisposition = res.headers.get('content-disposition');
        if (typeof contentDisposition === 'string') {
          const parts = contentDisposition.match(/filename=(?:"|)([^"]+)(?:"|)(?:;|$)/);
          if (parts) {
            filename = parts[1];
          }
        }
        const fileStream = StreamSaver.createWriteStream(filename);

        // Prevent the user from leaving the page while the download is in progress
        // As this is not a normal download a user need to stay on the page for the download to complete
        window.addEventListener('unload', () => {
          if (this.loading) {
            fileStream.abort();
          }
        });
        window.addEventListener('beforeunload', (evt) => {
          if (this.loading) {
            evt.preventDefault();
          }
        });

        await res.body.pipeTo(fileStream);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          // When the download was aborted, we don't want to show an error
          return;
        }
        this.$store.commit('showGlobalError', { error });
      } finally {
        this.loading = false;
      }
    },
    protocolName(protocol) {
      if (typeof protocol !== 'string') {
        return '';
      }
      switch(protocol.toLowerCase()) {
        case 's3':
          try {
            const key = `protocol.s3.${this.parsedHref.domain()}`;
            if (this.$te(key)) {
              return this.$t(key);
            }
          } catch (e) {
            // Fall back to the default
          }
          return this.$t('protocol.s3.default');
        case 'abfs':
        case 'abfss':
          return this.$t('protocol.azure');
        case 'gcs':
          return this.$t('protocol.gcs');
        case 'ftp':
          return this.$t('protocol.ftp');
        case 'oss':
          return this.$t('protocol.oss');
        case 'file':
          return this.$t('protocol.file');
      }
      return '';
    },
    show() {
      let data = Object.assign({}, this.data);
      // Override asset href with absolute URL if not a GDAL VFS
      if (!this.isGdalVfs) {
        data.href = this.href;
      }
      this.$emit('show', data, this.id, this.isThumbnail);
    },
    handleAuthButton() {
      if (this.auth.length === 1) {
        this.startAuth(this.auth[0]);
      }
    },
    async startAuth(method) {
      if (AuthUtils.isSupported(method, this.$store.state)) {
        await this.$store.dispatch('config', { authConfig: method });
        await this.$store.dispatch('auth/requestLogin');
      }
      else {
        const name = this.$i18n.t(`authentication.schemeTypes.${method.type}`, method);
        const message = this.$i18n.t('authentication.unsupportedLong', {method: name});
        this.$root.$emit('error', new Error(message), this.$i18n.t('authentication.unsupported'));
      }
    }
  }
};
</script>

<style lang="scss">
#stac-browser .href-auth-methods .popover-body {
  padding: 0;
}
</style>
