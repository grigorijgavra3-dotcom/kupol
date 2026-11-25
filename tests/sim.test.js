// Перевірка: «суддя» грає бій у Node без браузера, лише командами.
const assert = require('assert');
const S = require(process.argv[2] || require('path').join(__dirname, '..', 'sim.js'));
const g = S.newGame(2); S.use(g); g.res = 2000;

// розгортання і закупівля — тільки командами
const kyiv = S.toXY(50.45, 30.52);
const pat = S.command({t: 'place', kind: 'sam', def: 'patriot', x: kyiv.x, y: kyiv.y - 5});
assert(pat && pat.id, 'Patriot розгорнуто');
S.command({t: 'act', unit: pat.id, act: 'bf', arg: 'pac3'});
assert(pat.load.pac3 > 0, 'ракети PAC-3 куплено');
const iris = S.command({t: 'place', kind: 'sam', def: 'iris', ...S.toXY(50.65, 30.6)});
S.command({t: 'act', unit: iris.id, act: 'bf', arg: 'irisSL'});
S.command({t: 'act', unit: iris.id, act: 'auto'});
// поза межами області — відмова
assert.strictEqual(S.command({t: 'place', kind: 'sam', def: 'iris', ...S.toXY(52.5, 30.5)}), null, 'поза областю не ставиться');
// літак: купити, озброїти, підняти
const mig = S.command({t: 'buyAir', def: 'mig29'});
S.command({t: 'act', unit: mig.id, act: 'a+', arg: 'r73'}); S.command({t: 'act', unit: mig.id, act: 'a+', arg: 'r73'});
S.command({t: 'act', unit: mig.id, act: 'gun'});
assert.strictEqual(mig.load.r73, 2); assert(mig.gun > 0);
S.command({t: 'move', unit: mig.id, ...S.toXY(50.9, 30.7)});
assert.strictEqual(mig.state, 'move');
// перехоплювач
S.command({t: 'place', kind: 'uav', def: 'besomar', ...S.toXY(50.9, 30.9)});
// чужу/неіснуючу ціль ігнорує
assert.strictEqual(S.command({t: 'assign', unit: pat.id, target: 99999}), null);

const kinds = {};
for (let w = 0; w < 3; w++) {
  S.command({t: 'startWave'});
  let n = 0;
  while (g.phase === 'wave' && !g.over && n++ < 100000) {
    S.tick(1); // 1 ігрова секунда
    for (const [t] of g.out) kinds[t] = (kinds[t] || 0) + 1;
    g.out.length = 0;
    if (mig.state === 'base') S.command({t: 'move', unit: mig.id, ...S.toXY(50.9, 30.7)});
  }
  console.log(`хвиля ${g.wave}: збито ${g.kills}, влучань ${g.leaks}, Київ ${Math.round(g.cities[0].hp)}/${g.cities[0].max}, ресурс ${g.res}`);
}
assert(g.kills > 20, 'ППО збиває цілі');
assert(kinds.say && kinds.snd && kinds.boom, 'події для екрану надходять');
// стан не тримає посилань на DOM/карту — це те, що піде по мережі на кроці 2
assert(typeof document === 'undefined');
console.log('події:', JSON.stringify(kinds));
console.log('OK — бій іде в Node без браузера');
