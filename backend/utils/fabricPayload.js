'use strict';

function parseFabricBuffer(buf) {
  if (!buf || buf.length === 0) {
    return null;
  }
  const s = buf.toString('utf8');
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

module.exports = { parseFabricBuffer };
