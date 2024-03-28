import Utils from "./utils";

export default class BrowserStorage {

  static JSON_INDICATOR = "\n\r";

  static enabled(engine) {
    if (!Utils.isObject(engine)) {
      return false;
    }
    try {
      engine.setItem('test', 'yes');
      if (engine.getItem('test') === 'yes') {
        engine.removeItem('test');
        return true;
      }
    } catch(error) {
      console.error(error);
    }
    return false;
  }

  constructor(session = false) {
    if (session) {
      if (BrowserStorage.enabled(window.sessionStorage)) {
        this.engine = window.sessionStorage;
      }
      else if (navigator.cookieEnabled) {
        this.engine = new Cookies(true);
      }
      else {
        this.engine = new NoOp();
      }
    }
    else {
      if (BrowserStorage.enabled(window.localStorage)) {
        this.engine = window.localStorage;
      }
      else if (navigator.cookieEnabled) {
        this.engine = new Cookies();
      }
      else {
        this.engine = new NoOp();
      }
    }
  }

  get(name) {
    try {
      let data = this.engine.getItem(name);
      if (typeof data === 'string' && data.startsWith(BrowserStorage.JSON_INDICATOR)) {
        data = JSON.parse(data.slice(BrowserStorage.JSON_INDICATOR.length));
      }
      return data;
    } catch(error) {
      console.error(error);
      return null;
    }
  }

  set(name, value) {
    try {
      if (typeof value !== 'string') {
        value = BrowserStorage.JSON_INDICATOR + JSON.stringify(value);
      }
      this.engine.setItem(name, value);
    } catch(error) {
      console.error(error);
    }
  }

  remove(name) {
    try {
      this.engine.removeItem(name);
    } catch(error) {
      console.error(error);
    }
  }

  clear() {
    this.engine.clear();
  }

}

class Cookies {

  constructor(session = false) {
    this.session = session;
  }

  getExpiry(minutes = null) {
    if (minutes === null) {
      if (this.session) {
        minutes = 60; // 60 minutes
      }
      else {
        minutes = 1000 * 24 * 60; // 1000 days
      }
    }
    const date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    this.epires = date.toGMTString();
  }

  setItem(name, value, minutes = null) {
    const expires = this.getExpiry(minutes);
    value = encodeURIComponent(value);
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  }

  getItem(name) {
    const prefix = name + "=";
    const parts = document.cookie.split(';');
    for (let c of parts) {
      c = c.trim();
      if (c.startsWith(prefix)) {
        const data = c.substring(prefix.length, c.length);
        return decodeURIComponent(data);
      }
    }
    return null;
  }

  removeItem(name) {
    this.set(name, "", -1);
  }

  clear() {
    document.cookie = '';
  }

}


class NoOp {

  constructor(session = false) {
    this.session = session;
  }

  setItem(name/*, value*/) {
    console.warn(`Browser storage disabled, can't store ${name}`);
  }

  getItem(/*name*/) {
    return null;
  }

  removeItem(/*name*/) {
  }

  clear() {
  }

}
