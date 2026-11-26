// Режим «за противника»: план пусків, ШІ-оборона, туман війни, перемога/поразка
const assert = require('assert');
const S = require(process.argv[2] || require('path').join(__dirname, '..', 'sim.js'));
const g = S.newGame(2, {}, 'kyiv', 'attack'); S.use(g);
assert.strictEqual(g.mode, 'attack'); assert(g.sams.length >= 3, 'ШІ розставив ППО'); assert(g.sams.every(s => !s.spotted), 'ППО противника спершу не видно');
const kyiv = g.cities[0], r0 = g.res;
S.command({t: 'plan', type: 'shahed', dir: 'N', target: kyiv.id, n: 20});
S.command({t: 'plan', type: 'gerbera', dir: 'NE', n: 10});
S.command({t: 'plan', type: 'orlan', dir: 'N', n: 2});
S.command({t: 'plan', type: 'kh101', dir: 'E', target: kyiv.id, n: 2});
assert.strictEqual(g.res, r0 - 20 * 2 - 10 - 2 * 3 - 2 * 24, 'оплата за план');
S.command({t: 'unplan', i: 1, n: 5}); assert.strictEqual(g.plan[1].n, 5, 'скасування частини');
let wins = 0;
for (let w = 0; w < 8 && !g.over; w++) {
  if (w) { // різні коридори й цілі + ракети
    const tg = g.cities.filter(c => c.hp > 0), dirs = Object.keys(S.ROUTES);
    S.command({t: 'plan', type: 'kh101', dir: 'E', target: kyiv.id, n: 2});
    while (g.res >= 4) { const t = Math.random() < .3 ? 'gerbera' : 'shahed'; if (!S.command({t: 'plan', type: t, dir: dirs[Math.random() * dirs.length | 0], target: tg[Math.random() * Math.min(5, tg.length) | 0].id, n: Math.min(10, Math.floor(g.res / 2))})) break; }
  }
  S.command({t: 'startWave'}); assert.strictEqual(g.phase, 'wave');
  for (let i = 0; i < 20000 && g.phase === 'wave' && !g.over; i++) { S.tick(1); g.out.length = 0; }
  console.log(`хвиля ${g.wave}: влучань ${g.hits}, збито ${g.lost}, Київ ${Math.round(kyiv.hp)}/${kyiv.max}, ППО ШІ ${g.sams.length} (виявлено ${g.sams.filter(s => s.spotted).length}), бюджет ${g.res}`);
}
assert(g.hits > 0 && g.lost > 0, 'є влучання й збиття'); assert(g.sams.some(s => s.spotted), 'частину ППО розвідано');
console.log(g.over ? (g.win ? 'АТАКА ВДАЛАСЯ' : 'ППО ВИСТОЯЛА') : 'гра триває');
console.log('OK — режим «за противника» працює');
