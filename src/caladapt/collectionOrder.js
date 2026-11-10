// Puts the collections listed in the `collectionOrder` config option first, in that
// order. The others keep their existing order (by title) after them.

function collectionId(entity) {
  if (typeof entity?.id === 'string') {
    return entity.id;
  }
  // Children in the sidebar tree can be links, so fall back to the end of the href
  if (typeof entity?.href === 'string') {
    return entity.href.split('/').filter(Boolean).pop();
  }
  return null;
}

export function orderCollections(entities, order) {
  if (!Array.isArray(order) || order.length === 0) {
    return entities;
  }
  const rank = entity => {
    const index = order.indexOf(collectionId(entity));
    return index === -1 ? order.length : index;
  };
  // Array.prototype.sort is stable, so unlisted collections stay in title order
  return entities.slice().sort((a, b) => rank(a) - rank(b));
}
