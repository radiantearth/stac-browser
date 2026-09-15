<template>
  <div id="app-shell">
    
    <!-- ESA-UI Mobile Menu (Drawer) -->
    <esa-menu ref="esaMenu" v-if="!isEmbed"></esa-menu>

    <!-- Header Container: Top ESA-UI Header + ESA-UI Navbar -->
    <header class="esa-header-wrapper" v-if="!isEmbed">
      <esa-header></esa-header>
      <esa-navbar
        ref="esaNavbar"
        brand-title="Open Science Catalogue"
      ></esa-navbar>
    </header>

    <!-- Main Content Area containing our Router View -->
    <main class="flex-grow-1 position-relative">
      <router-view />
    </main>

    <!-- Cookie Banner -->
    <div v-if="showCookieBanner && !isEmbed" class="esa-cookie-banner">
      We use cookies which are essential for you to access our website and/or to
      provide you with our services, enable you to share our website content via
      your social media accounts and allow us to measure and improve the
      performance of our website.<br />
      <button class="cookie-btn" @click="consentCookies('accepted')">
        Accept all cookies
      </button>
      <button class="cookie-btn" @click="consentCookies('declined')">
        Accept only essential cookies
      </button>
      <router-link to="/privacy-notice" class="cookie-link">See our Cookie Notice</router-link>
    </div>

    <!-- Footer (Vanilla HTML/CSS) -->
    <footer class="esa-footer" v-if="!isEmbed && !isLandingPage">
      <div class="esa-footer-container">
        <div class="footer-left">
          &copy; {{ new Date().getFullYear() }} by 
          <a href="https://www.esa.int/" target="_blank" class="esa-footer-link">ESA</a>
        </div>
        <div class="footer-center">
          <!-- <router-link to="/terms" class="esa-footer-link">Terms & Conditions</router-link> -->
          <a href="https://www.esa.int/Services/Terms_and_conditions" target="_blank" class="esa-footer-link">Terms & Conditions</a>
          <span class="separator">|</span>
          <router-link to="/privacy-notice" class="esa-footer-link">Privacy Notice</router-link>
        </div>
        <div class="footer-right">
          <a href="https://github.com/EOEPCA/open-science-catalog-stac-browser" target="_blank" class="esa-footer-link">open-science-catalog</a>
          <span> v{{ appVersion }} by</span>
          <a href="https://eox.at" target="_blank" class="esa-footer-link ms-1">
            <img src="/img/EOX_Logo_weiss.svg" alt="EOX Logo" height="11" style="height: 11px !important; max-height: 11px !important; width: auto !important; vertical-align: middle; margin-top: -3px;" />
          </a>
        </div>
      </div>

      <!-- Suggest Changes Floating Button -->
      <div v-if="isCatalogPage" class="suggest-changes-dial">
        <div class="suggest-changes-menu">
          <a
            v-if="currentPath"
            :href="editorUrl"
            target="_blank"
            class="suggest-btn btn-editor"
          >
            <i class="mdi mdi-pencil"></i>
            Edit metadata
          </a>
          <a
            v-if="currentPath"
            :href="githubUrl"
            target="_blank"
            class="suggest-btn btn-github"
          >
            <i class="mdi mdi-github"></i>
            View file on GitHub
          </a>
        </div>
        <button class="suggest-toggle-btn">
          <i class="mdi mdi-pencil pencil-icon"></i>
          <i class="mdi mdi-close close-icon"></i>
          <span class="btn-text">Suggest changes</span>
        </button>
      </div>
    </footer>

  </div>
</template>

<script>
import CONFIG from '@/merged-config';
import "@eox/esa-ui/components/header.js";
import "@eox/esa-ui/components/navbar.js";
import "@eox/esa-ui/components/menu.js";

export default {
  name: "StacBrowserWrapper",
  data: () => ({
    showCookieBanner: false
  }),
  mounted() {
    Promise.all([
      customElements.whenDefined("esa-header"),
      customElements.whenDefined("esa-navbar"),
      customElements.whenDefined("esa-menu")
    ]).then(() => {
      this.initEsaUi();
    });
    this.initEsaUi();

    const consent = localStorage.getItem('esa-cookies-consent');
    const hasCookieConsent = document.cookie.includes("mtm_cookie_consent") || document.cookie.includes("mtm_consent_removed");
    if (!consent && !hasCookieConsent) {
      this.showCookieBanner = true;
    }
  },
  watch: {
    $route(to) {
      this.updateEsaUi();
      if (to.fullPath.startsWith("/catalog")) {
        return;
      }
      if (window._paq) {
        window._paq.push(["setCustomUrl", to.fullPath]);
        window._paq.push([
          "setDocumentTitle",
          document.domain + "/" + document.title,
        ]);
        window._paq.push(["trackPageView"]);
        window._paq.push(["enableLinkTracking"]);
      }
    }
  },
  methods: {
    initEsaUi() {
      this.updateEsaUi();
      this.attachShadowNavListeners();
    },
    updateEsaUi() {
      this.$nextTick(() => {
        const nav = this.$refs.esaNavbar || document.querySelector("esa-navbar");
        const menu = this.$refs.esaMenu || document.querySelector("esa-menu");
        const items = this.menuItems;
        if (nav) {
          nav.menuItems = items;
          if (nav.render) nav.render();
        }
        if (menu) {
          menu.menuItems = items;
          if (menu.render) menu.render();
        }
        this.attachShadowNavListeners();
      });
    },
    attachShadowNavListeners() {
      const handleAnchorClick = (event, anchor) => {
        const href = anchor.getAttribute("href");
        if (!href) return;
        if (href.startsWith("http") || anchor.getAttribute("target") === "_blank") {
          event.preventDefault();
          window.open(href, "_blank");
        } else if (href.startsWith("/")) {
          event.preventDefault();
          this.$router.push(href);
        }
      };

      const nav = this.$refs.esaNavbar || document.querySelector("esa-navbar");
      const menu = this.$refs.esaMenu || document.querySelector("esa-menu");

      // Wire hamburger button to open esa-menu
      if (nav && nav.shadowRoot) {
        const menuBtn = nav.shadowRoot.querySelector("#menu-open");
        if (menuBtn && menu && menu.shadowRoot) {
          menuBtn.onclick = () => {
            const cMenu = menu.shadowRoot.querySelector(".c-menu");
            if (cMenu) {
              cMenu.classList.add("is-open");
              document.body.classList.add("is-locked");
            }
          };
        }
      }

      // Wire menu close button to close esa-menu
      if (menu && menu.shadowRoot) {
        const closeBtn = menu.shadowRoot.querySelector("#menu-close");
        if (closeBtn) {
          closeBtn.onclick = () => {
            const cMenu = menu.shadowRoot.querySelector(".c-menu");
            if (cMenu) {
              cMenu.classList.remove("is-open");
              document.body.classList.remove("is-locked");
            }
          };
        }
      }

      [nav, menu].forEach((el) => {
        if (el && el.shadowRoot && !el._routingAttached) {
          el._routingAttached = true;
          el.shadowRoot.addEventListener("click", (event) => {
            const anchor = event.composedPath().find((target) => target.tagName === "A");
            if (anchor) {
              handleAnchorClick(event, anchor);
            }
          });
        }
      });
    },
    consentCookies(status) {
      if (status === 'accepted') {
        if (window._paq) {
          window._paq.push(["rememberCookieConsentGiven"]);
        }
      } else {
        if (window._paq) {
          window._paq.push(["forgetCookieConsentGiven"]);
          window._paq.push(["optUserOut"]);
        }
      }
      localStorage.setItem('esa-cookies-consent', status);
      this.showCookieBanner = false;
    }
  },
  computed: {
    menuItems() {
      return [
        { title: "Catalogue", href: "/catalog" },
        { title: "Metrics", href: "/metrics" },
        { title: "Search", href: "/search" },
        { title: "FAIR Principles", href: "/fair" },
        { title: "API Access", href: this.apiAccessUrl }
      ];
    },
    isEmbed() {
      return this.$route.name === 'fair-preview' && this.$route.query.embed === 'true';
    },
    appVersion() {
      return "3.1.0-rc.1";
    },
    apiAccessUrl() {
      const apiUrl = CONFIG.apiUrl || "https://eoapi.workspace.earthcode.eox.at/stac";
      return apiUrl.replace(/\/$/, "") + "/api.html";
    },
    isLandingPage() {
      return this.$route.name === 'landing' || this.$route.path === '/';
    },
    isCatalogPage() {
      return this.$route.name === 'catalog';
    },
    currentPath() {
      let path = this.$route.path;
      if (path === "/" || path === "" || path === "/catalog") {
        return "/catalog";
      }
      return path;
    },
    sessionTitle() {
      const parts = this.currentPath.split("/");
      const lastPart = parts[parts.length - 1] || "catalog";
      return `Edit ${lastPart}`;
    },
    editorUrl() {
      const workspaceRoot = CONFIG.workspaceRoot || "https://workspace.earthcode-staging.earthcode.eox.at";
      return `${workspaceRoot}/osc-editor?session=${encodeURIComponent(this.sessionTitle)}&automation=edit-file&file=${encodeURIComponent(
        'https://raw.githubusercontent.com/ESA-EarthCODE/open-science-catalog-metadata/refs/heads/main' +
        this.currentPath +
        '.json'
      )}`;
    },
    githubUrl() {
      const githubDataRoot = CONFIG.githubDataRoot || "https://github.com/ESA-EarthCODE/open-science-catalog-metadata/tree/main";
      return `${githubDataRoot.replace(/\/$/, "")}${this.currentPath}.json`;
    }
  }
}
</script>

<style>
@font-face {
  font-family: "NotesESAbold";
  src: url("/css/fonts/notesesabold/NotesESAbold.eot");
  src: url("/css/fonts/notesesabold/NotesESAbold.woff") format("woff"),
    url("/css/fonts/notesesabold/NotesESAbold.ttf") format("truetype"),
    url("/css/fonts/notesesabold/NotesESAbold.svg") format("svg");
  font-weight: normal;
  font-style: normal;
}

#app-shell h1,
#app-shell h2,
#app-shell h3,
#app-shell h4,
#app-shell h5,
#app-shell h6 {
  font-family: "NotesESAbold", sans-serif;
  font-weight: normal;
}

/* Global Custom ESA Theme Palette & General Reset */
:root {
  --esa-primary: #003247;
  --esa-primary-light: #004d66;
  --esa-border-color: #335e6f;
  --esa-text-light: #ffffff;
  --esa-shell-offset: 177px;
}

html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
}

#app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Header Wrapper: Stays sticky at the top */
.esa-header-wrapper {
  position: sticky;
  top: 0;
  z-index: 999;
  height: 140px;
  width: 100%;
  background: #001923;
}

esa-navbar {
  --header-background: #001923;
}

esa-menu {
  position: relative;
  z-index: 10000001;
}

body.is-locked {
  overflow: hidden;
}

/* Footer Styling */
.esa-footer {
  background-color: var(--esa-primary);
  border-top: 4px solid var(--esa-border-color);
  color: var(--esa-text-light);
  padding: 6px 16px;
  z-index: 99;
  font-size: 0.85rem;
  position: relative;
}

.footer-right img {
  height: 11px !important;
  max-height: 11px !important;
  width: auto !important;
}

.esa-footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: calc(1400px + 4rem);
  margin-left: auto;
  margin-right: auto;
  padding-left: 2rem;
  padding-right: 2rem;
  box-sizing: border-box;
}

@media (max-width: 45em) {
  .esa-footer-container {
    max-width: calc(1400px + 3rem);
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

.esa-footer-link {
  color: var(--esa-text-light);
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.esa-footer-link:hover {
  color: var(--esa-text-light);
  opacity: 0.8;
}

.separator {
  margin: 0 10px;
}

.flex-grow-1 {
  flex-grow: 1 !important;
}

.position-relative {
  position: relative !important;
}

/* Cookie Banner */
.esa-cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000000;
  font-family: Arial, sans-serif !important;
  line-height: 1.5em !important;
  background-color: #0b1d26 !important;
  color: #fff !important;
  padding: 1.875rem !important;
  text-align: center !important;
  font-size: 0.75rem !important;
  border-top: 4px solid #335e6f !important;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.15);
}

.cookie-link {
  color: #fff !important;
  text-decoration: underline !important;
  margin: 20px 10px 10px !important;
  display: inline-block !important;
}

.cookie-link:hover {
  opacity: 0.8;
}

.cookie-btn {
  background-color: transparent !important;
  font-family: Arial, sans-serif !important;
  font-size: 0.75rem !important;
  letter-spacing: 0.15625rem !important;
  border: 2px solid #335e6f !important;
  width: max-content !important;
  padding: 10px 20px !important;
  display: inline-block !important;
  border-radius: 2px !important;
  line-height: 1.5em !important;
  margin: 20px 10px 10px !important;
  text-align: center !important;
  text-decoration: none !important;
  color: #fff !important;
  transition: background 0.3s ease-in !important;
  text-transform: uppercase !important;
  cursor: pointer;
}

.cookie-btn:hover {
  background-color: #335e6f !important;
}

/* Suggest Changes Dial */
.suggest-changes-dial {
  position: absolute;
  bottom: calc(100% + 22px);
  right: 25px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 9999;
}

/* If the cookie banner is shown, push the floating button up so they don't overlap! */
.esa-cookie-banner ~ .esa-footer .suggest-changes-dial {
  bottom: calc(100% + 212px); /* Adjust bottom based on cookie banner height */
}

/* On mobile, adjust floating button position if needed */
@media (max-width: 767px) {
  .esa-cookie-banner ~ .esa-footer .suggest-changes-dial {
    bottom: calc(100% + 262px);
  }
}

.suggest-changes-menu {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.suggest-changes-dial:hover .suggest-changes-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.suggest-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-decoration: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.btn-editor {
  background-color: #28a745;
  color: white;
}

.btn-editor:hover {
  background-color: #218838;
  color: white;
}

.btn-github {
  background-color: #24292e;
  color: white;
}

.btn-github:hover {
  background-color: #04090d;
  color: white;
}

.suggest-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #2196F3;
  border: none;
  color: white;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: bold;
  border-radius: 30px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.suggest-toggle-btn:hover {
  background-color: #0d8bf2;
  transform: scale(1.05);
}

.suggest-toggle-btn .close-icon {
  display: none;
}

.suggest-toggle-btn .pencil-icon {
  display: inline-block;
}

.suggest-changes-dial:hover .close-icon {
  display: inline-block;
}

.suggest-changes-dial:hover .pencil-icon {
  display: none;
}
</style>
