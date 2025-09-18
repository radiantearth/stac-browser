module.exports = function VueSvgLoader(svg) { // eslint-disable-line no-undef
  this.cacheable();
  return `<template>${svg}</template>`;
};
