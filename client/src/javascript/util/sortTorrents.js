// TODO: Split up this garbage.

const stringProps = ['basePath', 'comment', 'hash', 'message', 'name'];

export function sortTorrents(torrentsHash, sortBy) {
  const torrents = Object.keys(torrentsHash).map(hash => ({hash, ...torrentsHash[hash]}));

  if (torrents.length) {
    const direction = sortBy.direction;
    const property = sortBy.property;

    torrents.sort((a, b) => {
      let valA = a[property];
      let valB = b[property];

      if (property === 'peers' || property === 'seeds') {
        valA = a[`${property}Connected`];
        valB = b[`${property}Connected`];

        if (valA === valB) {
          valA = a[`${property}Total`];
          valB = b[`${property}Total`];
        }
      } else if (property === 'eta') {
        // Keep Infinity and null values at bottom of array.
        if ((valA === 'Infinity' && valB !== 'Infinity') || (valA == null && valB != null)) {
          return 1;
        } if ((valA !== 'Infinity' && valB === 'Infinity') || (valA != null && valB == null)) {
          return -1;
        } if (valA == null && valB == null) {
          return 0;
        }

        // If it's not infinity, compare the cumulative seconds as regular numbers.
        if (valA !== 'Infinity') {
          valA = Number(valA.cumSeconds);
        }

        if (valB !== 'Infinity') {
          valB = Number(valB.cumSeconds);
        }
      } else if (property === 'tags') {
        // TODO: Find a better way to sort tags.
        valA = valA.join(',').toLowerCase();
        valB = valB.join(',').toLowerCase();
      } else if (stringProps.includes(property)) {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      } else {
        valA = Number(valA);
        valB = Number(valB);
      }

      // TODO: Use locale compare for sorting strings.
      if (direction === 'asc') {
        if (valA > valB) {
          return 1;
        }
        if (valA < valB) {
          return -1;
        }
      } else {
        if (valA > valB) {
          return -1;
        }
        if (valA < valB) {
          return 1;
        }
      }

      return 0;
    });

    return torrents;
  }
  return torrents;
}
