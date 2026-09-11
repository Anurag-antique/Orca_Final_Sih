// Run: node frontend/test_marine_map.cjs. Uses the existing Vite/esbuild runtime.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { transformSync } = require('esbuild');
const source = fs.readFileSync(__dirname + '/src/features/map/MarineMap.jsx', 'utf8');
for (const key of ['', 'test-basemap-key']) {
  for (const theme of ['dark', 'light']) {
    let failed = false;
    const context = { module: { exports: {} }, require: name => name === 'react' ? {
      createElement: (type, props) => ({ type, props }),
      useState: () => [failed, value => { failed = value; }]
    } : {} };
    vm.runInNewContext(transformSync(source + '\nexport { BaseTiles };', {
      loader: 'jsx', format: 'cjs', define: { 'import.meta.env.VITE_CARTO_API_KEY': JSON.stringify(key) }
    }).code, context);
    let tile = context.module.exports.BaseTiles({ theme });
    assert(tile.props.url.includes(key ? `/${theme}_all/` : 'tile.openstreetmap.org'));
    assert.equal(tile.props.className, !key && theme === 'dark' ? 'map-tiles-dark' : '');
    if (key) {
      assert(tile.props.url.includes('?key=' + key));
      tile.props.eventHandlers.tileerror();
      tile = context.module.exports.BaseTiles({ theme });
      assert(tile.props.url.includes('tile.openstreetmap.org'));
      assert(!tile.props.url.includes(key));
      assert.equal(tile.props.className, theme === 'dark' ? 'map-tiles-dark' : '');
    }
  }
}
console.log('PASS: light/dark CARTO selection, automatic OSM fallback, and theme-aware fallback styling.');
