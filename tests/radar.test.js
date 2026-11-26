// РЛС: виявлення, радіогоризонт для низьколетючих, цілевказівка ППО, тихий режим, полювання на РЛС
const assert = require('assert');
const S = require(process.argv[2] || require('path').join(__dirname, '..', 'sim.js'));
let g = S.newGame(2); S.use(g); g.res = 2000;
const p18 = S.command({t: 'place', kind: 'radar', def: 'p18', x: 0, y: 0});
const st = S.command({t: 'place', kind: 'radar', def: 'st68', x: 0, y: 0});
assert(p18 && st && g.radars.length === 2);
// крилата ракета на 50 м за 48 км: радіогоризонт П-18 (антена 12 м) ~43 км — не бачить; 36Д6 (щогла 30 м) ~52 км — бачить
const e = {id: 9999, kind: 'enemy', def: S.ENEMY.kh101, x: 0, y: 48, alt: .05, eng: 0, v: 0, vx: 0, vy: 0, wps: [{x: 0, y: 48}]};
g.enemies.push(e);
S.tick(.1);
assert(e.seen && e.seen.includes(st) && !e.seen.includes(p18), '36Д6 бачить КР біля землі, П-18 — ні');
console.log('КР на 50 м за 48 км: П-18 не бачить, 36Д6 бачить');
g.enemies.length = 0;
// цілевказівка: однаковий Patriot з РЛС поруч захоплює швидше, ніж без неї
function lockTime(withRadar) {
  g = S.newGame(2); S.use(g); g.res = 2000;
  if (withRadar) S.command({t: 'place', kind: 'radar', def: 'sentinel', x: 0, y: 0});
  const p = S.command({t: 'place', kind: 'sam', def: 'patriot', x: 0, y: -3}); S.command({t: 'act', unit: p.id, act: 'bf', arg: 'pac3'});
  g.enemies.push({id: 9998, kind: 'enemy', def: S.ENEMY.shahed, type: 'shahed', x: 0, y: 30, alt: 1, eng: 0, v: 0, vx: 0, vy: 0, wps: [{x: 0, y: -1000}], det: false, ident: false});
  S.tick(.1); return p.lock ? p.lock.t0 : null;
}
const tNo = lockTime(false), tYes = lockTime(true);
console.log(`захоплення Patriot: без РЛС ${tNo.toFixed(1)} с, з Sentinel ${tYes.toFixed(1)} с`);
assert(tYes < tNo, 'з цілевказівкою швидше');
// тихий режим: не бачить; дрони-мисливці обирають лише РЛС, що випромінюють
g = S.newGame(4, {hunt: 1}); S.use(g); g.res = 2000;
const r = S.command({t: 'place', kind: 'radar', def: 'k80', x: 20, y: 20});
S.command({t: 'act', unit: r.id, act: 'emit'}); assert.strictEqual(r.on, false);
// дрони, наведені на РЛС по випромінюванню (без тих, що мають камеру й бачать ціль самі)
const wave = () => {
  S.command({t: 'startWave'}); let h = 0;
  for (let i = 0; i < 1500; i++) { S.tick(1); g.out.length = 0; h += g.enemies.filter(e => e.samT === r && !e.def.retarget).length; }
  g.events.forEach(e => e.done = true); g.enemies.length = 0; S.tick(1); g.out.length = 0; // завершити хвилю
  assert.strictEqual(g.phase, 'deploy'); return h;
};
g.wave = 2; assert.strictEqual(wave(), 0, 'на тиху РЛС по випромінюванню не наводять');
S.command({t: 'act', unit: r.id, act: 'emit'}); assert(r.on);
assert(wave() > 0 || !g.radars.includes(r), 'на РЛС, що випромінює, полюють');
console.log('OK — РЛС працюють');
