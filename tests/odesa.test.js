// Операція «Оборона Одеси»: море, Дунай, нейтральні Молдова й Румунія
const assert = require('assert');
const S = require(process.argv[2] || require('path').join(__dirname, '..', 'sim.js'));
const run = (g, n) => { for (let i = 0; i < n; i++) { S.tick(1); g.out.length = 0; } };

let g = S.newGame(2, {}, 'odesa'); S.use(g);
assert.strictEqual(g.op, 'odesa'); assert.strictEqual(g.cities[0].name, 'Одеса');
assert.strictEqual(S.RAIONS.length, 8, '7 районів Одещини + місто');
const od = S.toXY(46.48, 30.73); assert(Math.hypot(od.x, od.y) < 1, 'Одеса — центр координат');
assert(S.inObl(46.48, 30.73) && S.inObl(45.35, 28.84) && !S.inObl(50.45, 30.52), 'межа області: Одеса, Ізмаїл — так; Київ — ні');
assert(S.inBY(47.0, 28.8) && S.inBY(45.0, 28.0), 'Молдова і Румунія — заборонені зони');

// склад: біля моря більше морських ракет; ніхто не залітає в Молдову чи Румунію
const cnt = {}; let inside = 0, seen = 0, kills = 0;
for (let r = 0; r < 4; r++) {
  g = S.newGame(2, {}, 'odesa'); S.use(g); g.wave = 7; g.res = 3000;
  const p = S.command({t: 'place', kind: 'sam', def: 'patriot', x: 0, y: -3}); S.command({t: 'act', unit: p.id, act: 'bf', arg: 'pac3'});
  S.command({t: 'startWave'});
  for (const e of g.events) cnt[e.type] = (cnt[e.type] || 0) + 1;
  for (let i = 0; i < 6000 && g.phase === 'wave'; i++) { S.tick(1); g.out.length = 0; for (const e of g.enemies) { seen++; if (S.inBY(...S.toLatLng(e.x, e.y))) inside++; } }
  kills += g.kills;
}
const sea = ['kalibr', 'oniks', 'kh59', 'kh69', 'tsirkon', 'kh22'].reduce((a, k) => a + (cnt[k] || 0), 0);
console.log(`Одеса: морських/надзвукових ракет ${sea}, позицій ${seen}, у Молдові/Румунії ${inside}, збито ${kills}`);
assert(sea >= 4, 'біля моря є морські й надзвукові ракети'); assert.strictEqual(inside, 0, 'маршрути обходять Молдову й Румунію'); assert(kills > 20);

// наша авіація: біля Молдови — попередження, всередину — розворот (не збиття)
g = S.newGame(2, {}, 'odesa'); S.use(g); g.res = 500;
const mig = S.command({t: 'buyAir', def: 'mig29'});
S.command({t: 'move', unit: mig.id, ...S.toXY(47.2, 28.6)});
let warned = false, turned = false;
for (let i = 0; i < 5000 && !turned; i++) { S.tick(1); for (const [t, x] of g.out) { if (t === 'say' && /Молдов/.test(x)) warned = true; if (t === 'say' && /розвертається/.test(x)) turned = true; } g.out.length = 0; }
assert(warned && turned && g.air.includes(mig), 'попередження, розворот, літак цілий');
// Київ після Одеси — знову Київ
g = S.newGame(2); S.use(g); assert.strictEqual(g.cities[0].name, 'Київ'); assert(S.inBY(51.7, 29.0));
console.log('OK — операція «Оборона Одеси» працює');
