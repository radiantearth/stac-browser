export default class QueryableBBox {
  constructor (id) {
    this.id = id;
    this.value = null;
  }

  clearValue () {
    this.value = null;
  }

  setValueFromLeafletBounds (bounds) {
    if (bounds === null || typeof bounds.toBBoxString !== 'function') return;
    this.value = bounds.toBBoxString().split(',').map(str => parseFloat(str));
  }

  getAsCql2Json () {
    if (this.value === null) return;
    return this.value;
  }

  getAsCql2Text () {
    if (this.value === null) return;
    return `bbox=${this.value.toString(',')}`;
  }
}