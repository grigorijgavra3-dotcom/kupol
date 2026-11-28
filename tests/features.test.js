// Перевірка нових механік: маршрути без Білорусі, склад хвиль, МВГ, склади, удари по пускових, Білорусь, обслуговування, «Ветеран».
const assert = require('assert');
const S = require(process.argv[2] || require('path').join(__dirname, '..', 'sim.js'));
const run = (g, sec) => { for (let i = 0; i < sec; i++) { S.tick(1); g.out.length = 0; } };

// 1. райони мають межі, Київ — окремо
assert(S.RAIONS.length === 8 && S.RAIONS.every(r => r.poly.length >= 3), 'райони побудовано');

// 2. коридори щоразу різні й ніколи не заходять у Білорусь (перевірка кожні ~2 км траєкторії)
let g = S.newGame(2); S.use(g);
const a = JSON.stringify(S.varyRoutes()), b = JSON.stringify(S.varyRoutes());
assert.notStrictEqual(a, b, 'маршрути змінюються');
for (let w = 0; w < 6; w++) {
  g.routes = S.varyRoutes();
  for (const r of Object.values(g.routes)) for (let i = 1; i < r.pts.length; i++) {
    const p = r.pts[i - 1], q = r.pts[i];
    for (let k = 0; k <= 20; k++) { const [la, ln] = S.toLatLng(p.x + (q.x - p.x) * k / 20, p.y + (q.y - p.y) * k / 20); assert(!S.inBY(la, ln), `коридор «${r.name}» не над Білоруссю`); }
  }
}

// 3. склад хвиль — за частками реальних пусків (рахуємо по багатьох хвилях)
const cnt = {}; let total = 0;
for (let i = 0; i < 40; i++) {
  g = S.newGame(2); S.use(g); g.wave = 7; S.command({t: 'startWave'});
  for (const e of g.events) { cnt[e.type] = (cnt[e.type] || 0) + 1; total++; }
}
const share = ids => ids.reduce((s, k) => s + (cnt[k] || 0), 0) / total * 100;
const ger2 = share(['shahed', 'garpiya', 'shahedMS']), decoy = share(['gerbera', 'gerbera2', 'gerberaW', 'parodiya', 'italmas']);
console.log(`фінальна хвиля: Герань-2 ${ger2.toFixed(1)}%, імітатори/легкі ${decoy.toFixed(1)}%, ракети ${share(Object.keys(S.ENEMY).filter(k => S.ENEMY[k].kind !== 'drone')).toFixed(1)}%`);
assert(ger2 > 40 && ger2 < 55 && decoy > 25 && decoy < 40, 'частки дронів близькі до реальних');
assert(cnt.kn23 > 0, 'зрідка є північнокорейські KN-23');

// 4. МВГ: дешева, мобільна, збиває дрони з малим шансом; переїзд коштує 1 ⛁
g = S.newGame(2); S.use(g); g.res = 500;
const kyiv = S.toXY(50.45, 30.52);
const mvg = S.command({t: 'place', kind: 'sam', def: 'mvg', x: kyiv.x + 3, y: kyiv.y + 3});
assert(mvg && g.res === 496, 'МВГ коштує 4 ⛁');
S.command({t: 'act', unit: mvg.id, act: 'bf', arg: 'mg127'});
assert(mvg.load.mg127 >= 10, 'набої куплено пачкою');
const r0 = g.res; S.command({t: 'move', unit: mvg.id, x: kyiv.x + 6, y: kyiv.y + 3});
assert(mvg.mv && g.res === r0 - 1, 'переїзд: пальне 1 ⛁');

// 5. склад знищено — постачання зупинено; ремонт повертає
const dep = g.cities.find(c => c.t === 'depot' && c.sup === 'west');
dep.hp = 0; dep.down = 2;
const pat = S.command({t: 'place', kind: 'sam', def: 'patriot', x: kyiv.x, y: kyiv.y - 5});
assert.strictEqual(S.command({t: 'act', unit: pat.id, act: 'b1', arg: 'pac3'}), null); assert(!pat.load.pac3, 'без складу західних ракет не купити');
S.command({t: 'repair', obj: dep.id}); S.command({t: 'act', unit: pat.id, act: 'b1', arg: 'pac3'});
assert(pat.load.pac3 > 0, 'після ремонту складу купується');

// 6. Білорусь: попередження, потім збиття нашого літака
const mig = S.command({t: 'buyAir', def: 'mig29'});
S.command({t: 'move', unit: mig.id, ...S.toXY(51.7, 29.6)});
let warned = false, lost = false;
for (let i = 0; i < 4000 && !lost; i++) { S.tick(1); for (const [t, x] of g.out) if (t === 'say' && /Білорус/.test(x)) warned = true; g.out.length = 0; lost = !g.air.includes(mig); }
assert(warned && lost, 'попередження про кордон і збиття над Білоруссю');

// 7. удар по пускових: летить, потім зменшує наступну хвилю з майданчика
g = S.newGame(2); S.use(g); g.res = 500;
const su = S.command({t: 'buyAir', def: 'su24'});
S.command({t: 'act', unit: su.id, act: 'strike', arg: 'navlia'});
for (let i = 0; i < 20000 && g.siteMult.navlia === 1 && (g.strikes.length || su.state === 'strikeOut'); i++) run(g, 1);
console.log('удар Су-24 по Навлі: множник наступної хвилі', g.siteMult.navlia.toFixed(2));
assert(su.state === 'rtb' || su.state === 'service' || su.state === 'base');

// 8. обслуговування: 1 ⛁ з борту; «Ветеран» — без пропуску хвилі
g = S.newGame(4); S.use(g); g.res = 500;
const f = S.command({t: 'buyAir', def: 'mig29'});
S.command({t: 'move', unit: f.id, x: S.BASE.x + 20, y: S.BASE.y}); run(g, 200);
S.command({t: 'act', unit: f.id, act: 'rtb'});
const r1 = g.res; run(g, 400);
assert(f.state === 'service' && g.res === r1, 'обслуговування безкоштовне');
assert(!f.groundUntil && !S.grounded(f), 'Ветеран: хвилю більше не пропускає (лише довше обслуговування)');

console.log('OK — нові механіки працюють');

// 9. дрони й ракети в польоті ніколи не залітають у Білорусь
let inside = 0, seen = 0;
for (let r = 0; r < 4; r++) {
  g = S.newGame(2); S.use(g); g.wave = 7; S.command({t: 'startWave'});
  for (let i = 0; i < 6000 && g.phase === 'wave'; i++) { S.tick(1); g.out.length = 0; for (const e of g.enemies) { seen++; if (S.inBY(...S.toLatLng(e.x, e.y))) inside++; } }
}
console.log(`позицій перевірено: ${seen}, у Білорусі: ${inside}`);
assert.strictEqual(inside, 0, 'ворожі цілі не летять через Білорусь');
console.log('OK — маршрути без Білорусі');
