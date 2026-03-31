import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks before any import that transitively loads these modules
vi.mock('../../../src/i18n', () => ({
  default: { global: { t: (key) => key } },
}));

// In-memory stand-in for BrowserStorage so tests don't depend on jsdom localStorage
let _store = {};
vi.mock('../../../src/browser-store', () => ({
  default: class MockBrowserStorage {
    get(key) { return Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null; }
    set(key, value) { _store[key] = value; }
    remove(key) { delete _store[key]; }
  },
}));

import VrifyJWT from '../../../src/auth/vrifyJwt.js';

/** Direct read from the shared mock store (mirrors what BrowserStorage.get returns). */
const store = {
  get: (key) => Object.prototype.hasOwnProperty.call(_store, key) ? _store[key] : null,
  set: (key, value) => { _store[key] = value; },
};

// ── JWT helpers ───────────────────────────────────────────────────────────────

/** Encode an object as a base64url string (no padding). */
function b64url(obj) {
  return btoa(JSON.stringify(obj))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** Build a minimal JWT with a given payload (signature is fake). */
function makeToken(payload) {
  return `eyJhbGciOiJIUzI1NiJ9.${b64url(payload)}.fakesignature`;
}

/** Token expiring `secondsFromNow` seconds in the future (default 1 hour). */
function freshToken(secondsFromNow = 3600) {
  return makeToken({ sub: 'user1', exp: Math.floor(Date.now() / 1000) + secondsFromNow });
}

/** Token whose exp is `secondsAgo` seconds in the past. */
function expiredToken(secondsAgo = 60) {
  return makeToken({ sub: 'user1', exp: Math.floor(Date.now() / 1000) - secondsAgo });
}

// ── Factory helpers ───────────────────────────────────────────────────────────

function makeRouter({ fullPath = '/dashboard', query = {}, name = null } = {}) {
  return {
    currentRoute: { value: { fullPath, query, name } },
    resolve: vi.fn((path) => ({ href: path })),
    replace: vi.fn(),
    push: vi.fn(),
  };
}

/**
 * Construct a VrifyJWT instance.
 * @param {object} options   - Overrides merged on top of the default config
 * @param {Function|null} changeListener
 * @param {object} routerOpts - Arguments passed to makeRouter
 */
function makeAuth({ options = {}, changeListener = null, routerOpts = {} } = {}) {
  const router = makeRouter(routerOpts);
  const opts = {
    loginUrl: 'https://services.vrify.com/v2/auth/',
    refreshUrl: 'https://services.vrify.com/v2/auth/refresh/',
    ...options,
  };
  const jwt = new VrifyJWT(router, opts, changeListener);
  return { jwt, router };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('VrifyJWT', () => {
  beforeEach(() => {
    _store = {};
    vi.useFakeTimers();
    // Prevent jsdom from trying to navigate on window.location.href assignment
    Object.defineProperty(window, 'location', {
      value: { origin: 'http://localhost:3000', href: '' },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── _parsePayload ───────────────────────────────────────────────────────────
  describe('_parsePayload', () => {
    it('decodes a valid JWT payload', () => {
      const { jwt } = makeAuth();
      const token = makeToken({ sub: 'user1', exp: 9999999, role: 'admin' });
      expect(jwt._parsePayload(token)).toEqual({ sub: 'user1', exp: 9999999, role: 'admin' });
    });

    it('returns null for a token with fewer than two dots', () => {
      const { jwt } = makeAuth();
      expect(jwt._parsePayload('notajwt')).toBeNull();
    });

    it('returns null when the payload part is not valid base64', () => {
      const { jwt } = makeAuth();
      // '!!!' is not valid base64
      expect(jwt._parsePayload('header.!!!.sig')).toBeNull();
    });

    it('returns null when the payload decodes to non-JSON bytes', () => {
      const { jwt } = makeAuth();
      // btoa('not json') = 'bm90IGpzb24=' → strip padding → 'bm90IGpzb24'
      const fakePayload = btoa('not json').replace(/=/g, '');
      expect(jwt._parsePayload(`h.${fakePayload}.s`)).toBeNull();
    });
  });

  // ── _isExpired ──────────────────────────────────────────────────────────────
  describe('_isExpired', () => {
    it('returns false for a token expiring far in the future', () => {
      const { jwt } = makeAuth();
      expect(jwt._isExpired(freshToken(3600))).toBe(false);
    });

    it('returns true for an already-expired token', () => {
      const { jwt } = makeAuth();
      expect(jwt._isExpired(expiredToken(60))).toBe(true);
    });

    it('returns true when exp is within the 30-second buffer', () => {
      const { jwt } = makeAuth();
      // 20 seconds left → inside 30s buffer → treated as expired
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 20 });
      expect(jwt._isExpired(token)).toBe(true);
    });

    it('returns false when exp is just outside the 30-second buffer', () => {
      const { jwt } = makeAuth();
      // 31 seconds left → outside 30s buffer → still valid
      const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 31 });
      expect(jwt._isExpired(token)).toBe(false);
    });

    it('returns true for a token with no exp claim', () => {
      const { jwt } = makeAuth();
      expect(jwt._isExpired(makeToken({ sub: 'user1' }))).toBe(true);
    });

    it('returns true for a malformed token', () => {
      const { jwt } = makeAuth();
      expect(jwt._isExpired('not.a.jwt')).toBe(true);
    });
  });

  // ── updateStore ─────────────────────────────────────────────────────────────
  describe('updateStore', () => {
    it('returns an Authorization Bearer header for a valid token', () => {
      const { jwt } = makeAuth();
      const token = freshToken();
      expect(jwt.updateStore(token)).toEqual({
        header: { key: 'Authorization', value: `Bearer ${token}` },
      });
    });

    it('returns an Authorization header with undefined value when token is falsy', () => {
      const { jwt } = makeAuth();
      expect(jwt.updateStore(null)).toEqual({
        header: { key: 'Authorization', value: undefined },
      });
    });
  });

  // ── init ────────────────────────────────────────────────────────────────────
  describe('init', () => {
    it('does nothing when no token is stored', async () => {
      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      await jwt.init();
      expect(changeListener).not.toHaveBeenCalled();
    });

    it('restores a valid stored session and notifies the listener', async () => {
      const token = freshToken();
      store.set('vrify-jwt', token);
      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      await jwt.init();
      expect(changeListener).toHaveBeenCalledWith(true, token);
    });

    it('attempts a silent refresh when the stored token is expired', async () => {
      store.set('vrify-jwt', expiredToken());
      store.set('vrify-refresh-token', 'old-rt');
      const newToken = freshToken();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: newToken, refresh: 'new-rt' }),
      });

      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      await jwt.init();

      expect(fetch).toHaveBeenCalledWith(
        'https://services.vrify.com/v2/auth/refresh/',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(changeListener).toHaveBeenCalledWith(true, newToken);
    });

    it('clears tokens when the refresh call fails on an expired stored token', async () => {
      store.set('vrify-jwt', expiredToken());
      store.set('vrify-refresh-token', 'old-rt');
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

      const { jwt } = makeAuth();
      await jwt.init();

      expect(store.get('vrify-jwt')).toBeNull();
      expect(store.get('vrify-refresh-token')).toBeNull();
    });

    it('schedules a refresh timer for a valid stored token', async () => {
      store.set('vrify-jwt', freshToken(3600));
      const { jwt } = makeAuth();
      await jwt.init();
      expect(jwt._refreshTimer).not.toBeNull();
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('saves the current route and redirects to loginUrl with a next param', async () => {
      const { jwt } = makeAuth({ routerOpts: { fullPath: '/some/page' } });
      await jwt.login();

      expect(store.get('vrify-return-uri')).toBe('/some/page');
      expect(window.location.href).toMatch(/^https:\/\/services\.vrify\.com\/v2\/auth\/\?next=/);
      expect(window.location.href).toContain(encodeURIComponent('/auth'));
    });

    it('encodes the callback URI in the next parameter', async () => {
      const { jwt } = makeAuth();
      await jwt.login();
      const url = new URL(window.location.href);
      const next = url.searchParams.get('next');
      expect(next).toBe('http://localhost:3000/auth');
    });
  });

  // ── confirmLogin ────────────────────────────────────────────────────────────
  describe('confirmLogin', () => {
    it('stores token and refresh token, notifies listener and navigates back', async () => {
      const token = freshToken();
      store.set('vrify-return-uri', '/dashboard');
      const changeListener = vi.fn();
      const { jwt, router } = makeAuth({
        changeListener,
        routerOpts: { query: { token, refresh: 'rt-123' } },
      });

      await jwt.confirmLogin();

      expect(store.get('vrify-jwt')).toBe(token);
      expect(store.get('vrify-refresh-token')).toBe('rt-123');
      expect(changeListener).toHaveBeenCalledWith(true, token);
      expect(router.replace).toHaveBeenCalledWith('/dashboard');
      expect(store.get('vrify-return-uri')).toBeNull();
    });

    it('navigates to / when no return URI was saved', async () => {
      const token = freshToken();
      const { jwt, router } = makeAuth({ routerOpts: { query: { token } } });
      await jwt.confirmLogin();
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('stores only the access token when the refresh param is absent', async () => {
      const token = freshToken();
      const { jwt } = makeAuth({ routerOpts: { query: { token } } });
      await jwt.confirmLogin();
      expect(store.get('vrify-jwt')).toBe(token);
      expect(store.get('vrify-refresh-token')).toBeNull();
    });

    it('throws when the token param is missing from the callback URL', async () => {
      const { jwt } = makeAuth({ routerOpts: { query: {} } });
      await expect(jwt.confirmLogin()).rejects.toThrow('VrifyJWT');
    });

    it('reads a custom tokenParam name from config', async () => {
      const token = freshToken();
      const { jwt } = makeAuth({
        options: { tokenParam: 'mytoken' },
        routerOpts: { query: { mytoken: token } },
      });
      await jwt.confirmLogin();
      expect(store.get('vrify-jwt')).toBe(token);
    });
  });

  // ── logout ──────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('clears tokens and navigates to /auth/logout', async () => {
      store.set('vrify-jwt', freshToken());
      store.set('vrify-refresh-token', 'rt');
      const { jwt, router } = makeAuth();
      await jwt.logout();

      expect(store.get('vrify-jwt')).toBeNull();
      expect(store.get('vrify-refresh-token')).toBeNull();
      expect(router.push).toHaveBeenCalledWith('/auth/logout');
    });

    it('does not call router.push when already on the logout route', async () => {
      const { jwt, router } = makeAuth({ routerOpts: { name: 'logout' } });
      await jwt.logout();
      expect(router.push).not.toHaveBeenCalled();
    });

    it('cancels an active refresh timer', async () => {
      const { jwt } = makeAuth();
      jwt._refreshTimer = setTimeout(() => {}, 100_000);
      await jwt.logout();
      expect(jwt._refreshTimer).toBeNull();
    });
  });

  // ── _doRefresh ──────────────────────────────────────────────────────────────
  describe('_doRefresh', () => {
    it('returns false immediately when no refreshUrl is configured', async () => {
      const { jwt } = makeAuth({ options: { refreshUrl: null } });
      expect(await jwt._doRefresh()).toBe(false);
    });

    it('expires the session and returns false when no refresh token is stored', async () => {
      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      expect(await jwt._doRefresh()).toBe(false);
      expect(changeListener).toHaveBeenCalledWith(false);
    });

    it('posts { refresh } and updates tokens on a successful response', async () => {
      store.set('vrify-refresh-token', 'old-rt');
      const newToken = freshToken();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: newToken, refresh: 'new-rt' }),
      });

      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      const result = await jwt._doRefresh();

      expect(result).toBe(true);
      const [url, opts] = fetch.mock.calls[0];
      expect(url).toBe('https://services.vrify.com/v2/auth/refresh/');
      expect(JSON.parse(opts.body)).toEqual({ refresh: 'old-rt' });
      expect(store.get('vrify-jwt')).toBe(newToken);
      expect(store.get('vrify-refresh-token')).toBe('new-rt');
      expect(changeListener).toHaveBeenCalledWith(true, newToken);
    });

    it('accepts access_token / refresh_token as fallback response keys', async () => {
      store.set('vrify-refresh-token', 'old-rt');
      const newToken = freshToken();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: newToken, refresh_token: 'new-rt' }),
      });

      const { jwt } = makeAuth();
      expect(await jwt._doRefresh()).toBe(true);
      expect(store.get('vrify-jwt')).toBe(newToken);
      expect(store.get('vrify-refresh-token')).toBe('new-rt');
    });

    it('expires the session and returns false on an HTTP error response', async () => {
      store.set('vrify-refresh-token', 'old-rt');
      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });

      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      expect(await jwt._doRefresh()).toBe(false);
      expect(changeListener).toHaveBeenCalledWith(false);
    });

    it('expires the session and returns false on a network error', async () => {
      store.set('vrify-refresh-token', 'old-rt');
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });
      expect(await jwt._doRefresh()).toBe(false);
      expect(changeListener).toHaveBeenCalledWith(false);
    });

    it('does not update the stored refresh token when the response omits it', async () => {
      store.set('vrify-refresh-token', 'old-rt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: freshToken() }), // no refresh field
      });

      const { jwt } = makeAuth();
      await jwt._doRefresh();
      // original refresh token should be unchanged
      expect(store.get('vrify-refresh-token')).toBe('old-rt');
    });
  });

  // ── _scheduleRefresh ────────────────────────────────────────────────────────
  describe('_scheduleRefresh', () => {
    it('does nothing when no refreshUrl is configured', () => {
      const { jwt } = makeAuth({ options: { refreshUrl: null } });
      jwt._scheduleRefresh(freshToken(3600));
      expect(jwt._refreshTimer).toBeNull();
    });

    it('sets a timer for a token expiring far in the future', () => {
      const { jwt } = makeAuth();
      jwt._scheduleRefresh(freshToken(3600));
      expect(jwt._refreshTimer).not.toBeNull();
    });

    it('calls _doRefresh immediately when token is within the 30-second buffer', () => {
      store.set('vrify-refresh-token', 'rt');
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access: freshToken() }),
      });

      const { jwt } = makeAuth();
      const spy = vi.spyOn(jwt, '_doRefresh');
      // Token expiring in 10s → msUntilRefresh = (now+10-30)*1000 - now*1000 = -20000 ≤ 0
      jwt._scheduleRefresh(makeToken({ exp: Math.floor(Date.now() / 1000) + 10 }));
      expect(spy).toHaveBeenCalled();
      // Immediate call path does not set a timer
      expect(jwt._refreshTimer).toBeNull();
    });

    it('does not set a timer for a token with no exp claim', () => {
      const { jwt } = makeAuth();
      jwt._scheduleRefresh(makeToken({ sub: 'user' }));
      expect(jwt._refreshTimer).toBeNull();
    });

    it('cancels an existing timer before setting a new one', () => {
      const { jwt } = makeAuth();
      jwt._scheduleRefresh(freshToken(3600));
      const firstTimer = jwt._refreshTimer;
      jwt._scheduleRefresh(freshToken(3600));
      expect(jwt._refreshTimer).not.toBe(firstTimer);
      expect(jwt._refreshTimer).not.toBeNull();
    });
  });

  // ── _onSessionExpired ───────────────────────────────────────────────────────
  describe('_onSessionExpired', () => {
    it('clears stored tokens and notifies the listener with false', () => {
      store.set('vrify-jwt', freshToken());
      store.set('vrify-refresh-token', 'rt');
      const changeListener = vi.fn();
      const { jwt } = makeAuth({ changeListener });

      jwt._onSessionExpired();

      expect(store.get('vrify-jwt')).toBeNull();
      expect(store.get('vrify-refresh-token')).toBeNull();
      expect(changeListener).toHaveBeenCalledWith(false);
    });

    it('cancels an active refresh timer', () => {
      const { jwt } = makeAuth();
      jwt._refreshTimer = setTimeout(() => {}, 100_000);
      jwt._onSessionExpired();
      expect(jwt._refreshTimer).toBeNull();
    });

    it('does not throw when changeListener is null', () => {
      const { jwt } = makeAuth({ changeListener: null });
      expect(() => jwt._onSessionExpired()).not.toThrow();
    });
  });
});
