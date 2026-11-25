// sim.js — «суддя» гри «Купол»: дані техніки, хвилі, фізика, стрільба, закупівля.
// Без DOM, карти й звуку: однаково працює в браузері (як звичайний <script>) і в Node (сервер мережевої гри).
'use strict';

// ================= РАКЕТИ ЗРК (публічні дані; «~» — оцінки) =================
// dim — [довжина, діаметр] м (оцінки ~), для 3D/2D вигляду в довіднику
const SAM_MSL = {
 pac2b: {name:'PAC-2 (базова)', range:160, v:1700, pk:.7, cost:6, size:12, note:'4 на ПУ, лише літаки/КР/дрони', dim:[5.3,.41]},
 pac2:  {name:'PAC-2 GEM+', range:160, v:1564, pk:.75, bm:true, pkBal:.5, cost:8, size:12, note:'4 на ПУ, балістика обмежено', dim:[5.3,.41]},
 pac3:  {name:'PAC-3 CRI', range:70, v:1714, pk:.9, bm:true, pkBal:.85, cost:12, size:3, note:'16 на ПУ, ~70 км'},
 mse:   {name:'PAC-3 MSE', range:120, v:1714, pk:.92, bm:true, pkBal:.9, cost:16, size:4, note:'~12 на ПУ, ~120 км'},
 v55k:  {name:'5В55К', range:47, v:1700, pk:.65, cost:4, note:'~47 км'},
 v55r:  {name:'5В55Р', range:75, v:1700, pk:.7, cost:5, note:'~75 км'},
 n6:    {name:'48Н6', range:150, v:2000, pk:.75, bm:true, pkBal:.55, cost:7, note:'150 км, ПРО'},
 v21:   {name:'5В21', range:160, v:900, pk:.55, cost:3, note:'~160 км'},
 v28:   {name:'5В28', range:300, v:1200, pk:.6, cost:5, note:'до 300 км (С-200Д)'},
 irisSL:{name:'IRIS-T SL', range:40, v:1000, pk:.9, cost:5, note:'40 км'},
 m38:   {name:'9М38', range:30, v:850, pk:.7, cost:3, note:'~30 км'},
 m38m1: {name:'9М38М1', range:35, v:850, pk:.75, cost:4, note:'~35 км'},
 aim9x: {name:'AIM-9X', range:10, v:900, pk:.8, cost:2, note:'~10 км, ІЧ'},
 amr:   {name:'AIM-120C', range:30, v:1200, pk:.85, cost:4, note:'~30 км'},
 amrer: {name:'AMRAAM-ER', range:50, v:1300, pk:.85, cost:6, note:'~50 км'},
 m23a:  {name:'MIM-23A', range:25, v:750, pk:.55, cost:2, note:'~25 км'},
 m23b:  {name:'MIM-23B', range:40, v:800, pk:.65, cost:3, note:'~40 км'},
 v27:   {name:'5В27Д', range:25, v:700, pk:.6, cost:2, note:'~25 км'},
 vt1:   {name:'VT1', range:11, v:1250, pk:.75, cost:2, note:'~11 км, ~3,5 М'},
 asp1:  {name:'Aspide Mk1', range:15, v:1350, pk:.7, cost:2, note:'~15 км'},
 asp2:  {name:'Aspide 2000', range:25, v:1350, pk:.75, cost:3, note:'~25 км'},
};
const SAM_DIM = {pac3:[5.2,.255], mse:[5.2,.29], v55k:[7.25,.51], v55r:[7.25,.51], n6:[7.5,.51], v21:[10.8,.86], v28:[10.7,.86], irisSL:[3,.127], m38:[5.55,.4], m38m1:[5.55,.4],
  aim9x:[3.02,.13], amr:[3.65,.18], amrer:[4.3,.25], m23a:[5.03,.37], m23b:[5.03,.37], v27:[5.95,.55], vt1:[2.29,.165], asp1:[3.7,.2], asp2:[3.7,.2]};
for (const [id, m] of Object.entries(SAM_MSL)) { m.id = id; m.size ||= 1; m.dim ||= SAM_DIM[id]; }
const balText = m => m.bm ? (m.pkBal >= .8 ? `так (~${Math.round(m.pkBal * 100)}%)` : `обмежено (~${Math.round(m.pkBal * 100)}%)`) : 'ні';

// ППО. react — час реакції (перше захоплення), relock — наступні цілі в бойовому режимі, с (оцінки ~).
const SAM = [
 {id:'patriot',name:'Patriot MIM-104',country:'США',alt:24,minAlt:.06,cap:48,det:150,reload:900,react:9,relock:3,bm:true,pkDrone:1,cost:40,msl:['pac2b','pac2','pac3','mse'],
  info:[['Клас','велика дальність'],['Дальність','160 км'],['Висота','~24 км'],['Ракети','PAC-3: 1714 м/с, PAC-2 GEM+: 1564 м/с'],['ПУ','16 PAC-3 або 4 PAC-2'],['Балістика','PAC-3 CRI і MSE — так; PAC-2 GEM+ — обмежено; базова PAC-2 — ні'],['У грі','Shahed — 100% ураження']]},
 {id:'s300',name:'С-300ПМУ',country:'СРСР',alt:27,minAlt:.025,cap:4,det:300,reload:900,react:10,relock:3,bm:true,cost:30,msl:['v55k','v55r','n6'],
  info:[['Клас','середня/велика дальність'],['Дальність','150–300 км'],['Висота','27 км'],['Ракета','до 2000 м/с'],['ПУ','~4 ракети'],['ПРО','так (48Н6)']]},
 {id:'s200',name:'С-200',country:'СРСР',alt:40,minAlt:.3,cap:1,det:400,reload:900,react:60,relock:20,cost:20,msl:['v21','v28'],
  info:[['Клас','велика дальність'],['Дальність','до 300 км'],['Висота','40 км'],['Ракета','700–1200 м/с'],['ПУ','1 ракета'],['Мін. висота','~0,3 км (не бачить КР)']]},
 {id:'iris',name:'IRIS-T SLM',country:'Німеччина',alt:25,minAlt:.02,cap:8,det:250,reload:600,react:6,relock:2,cost:25,msl:['irisSL'],
  info:[['Клас','середня дальність'],['Дальність','40 км'],['Висота','25 км'],['Ракета','~1000 м/с (~3 М)'],['ПУ','8 ракет'],['Радар','~250 км (TRML-4D)']]},
 {id:'buk',name:'Бук-М1 ★',country:'СРСР',alt:22,minAlt:.015,cap:4,det:160,reload:600,react:22,relock:4,cost:20,msl:['m38','m38m1'],
  info:[['Клас','середня дальність'],['Дальність','~35 км'],['Висота','~22 км'],['Ракета','~850 м/с'],['ПУ','4 ракети'],['Радар','~160 км']]},
 {id:'nasams',name:'NASAMS ★',country:'Норвегія/США',alt:15,minAlt:.03,cap:6,det:75,reload:600,react:5,relock:2,cost:20,msl:['aim9x','amr','amrer'],
  info:[['Клас','середня дальність'],['Дальність','~30–50 км (від ракети)'],['Висота','~15 км'],['ПУ','6 ракет'],['Радар','~75 км']]},
 {id:'hawk',name:'MIM-23 HAWK',country:'США',alt:18,minAlt:.06,cap:3,det:100,reload:600,react:15,relock:5,cost:15,msl:['m23a','m23b'],
  info:[['Клас','середня дальність'],['Дальність','~40 км'],['Висота','~18 км'],['Ракета','~800 м/с'],['ПУ','3 ракети']]},
 {id:'s125',name:'С-125М',country:'СРСР',alt:20,minAlt:.02,cap:4,det:110,reload:600,react:26,relock:6,cost:10,msl:['v27'],
  info:[['Клас','мала дальність'],['Дальність','12 км (С-125), до 40 км (модерн.)'],['Висота','20–25 км'],['Ракета','~700 м/с'],['ПУ','4 ракети']]},
 {id:'crotale',name:'Crotale NG',country:'Франція',alt:6,minAlt:.015,cap:8,det:20,reload:500,react:6,relock:2,cost:8,msl:['vt1'],
  info:[['Клас','мала дальність'],['Дальність','~11 км'],['Висота','~6 км'],['Ракета','~1250 м/с'],['ПУ','~8 ракет']]},
 {id:'aspide',name:'Skyguard Aspide',country:'Швейцарія/Італія',alt:5,minAlt:.015,cap:4,det:20,reload:500,react:8,relock:3,cost:8,msl:['asp1','asp2'],
  info:[['Клас','мала–середня'],['Дальність','~15–25 км'],['Висота','~5 км'],['Ракета','~1350 м/с (~4 М)'],['ПУ','~4 ракети']]},
];
SAM.forEach(d => d.info.push(['Час реакції', `~${d.react} с (наступна ціль ~${d.relock} с)`]));
const samRange = d => Math.max(...d.msl.map(k => SAM_MSL[k].range));

// ================= РАКЕТИ «ПОВІТРЯ-ПОВІТРЯ» (lock — час захоплення, с) =================
const AAM = {
 r60:  {name:'Р-60', range:8, v:900, pk:.7, cost:1, lock:3, note:'~8 км, ІЧ'},
 r73:  {name:'Р-73', range:30, v:850, pk:.8, cost:2, lock:3, note:'~30 км, ІЧ'},
 r27r: {name:'Р-27Р', range:60, v:1300, pk:.7, cost:3, lock:6, note:'~60 км, радіо'},
 r27er:{name:'Р-27ЕР', range:95, v:1300, pk:.75, cost:4, lock:6, note:'до 95 км'},
 aim9m:{name:'AIM-9M', range:18, v:900, pk:.8, cost:2, lock:3, note:'~18 км, ІЧ'},
 aim9x:{name:'AIM-9X', range:35, v:900, pk:.85, cost:3, lock:2, note:'~35 км, ІЧ'},
 aim120:{name:'AIM-120C', range:70, v:1200, pk:.85, cost:5, lock:4, note:'~70 км, АРГСН'},
 mica: {name:'MICA', range:60, v:1100, pk:.85, cost:5, lock:4, note:'~60 км'},
 magic:{name:'Magic II', range:15, v:900, pk:.75, cost:2, lock:3, note:'~15 км, ІЧ'},
 irist:{name:'IRIS-T', range:25, v:1000, pk:.9, cost:4, lock:2, note:'~25 км, ІЧ'},
 meteor:{name:'Meteor', range:150, v:1300, pk:.9, cost:10, lock:5, note:'>100 км, ПРД'},
 igla: {name:'Ігла', range:5, v:570, pk:.6, cost:1, lock:4, note:'~5 км, ПЗРК'},
};
for (const [id, m] of Object.entries(AAM)) m.id = id;

// Авіація. fuel — внутрішнє паливо, с польоту (оцінки ~). ptb — макс. підвісних баків (кожен −slot ракет, +ptbK палива).
const AIR = [
 {id:'mig29',name:'МіГ-29',role:'fighter',country:'СРСР',vmax:2450,cruise:900,dash:1500,ceil:18,span:11.36,len:17.32,count:3,radar:70,msl:6,aam:['r27r','r27er','r73','r60'],gun:{name:'ГШ-301',rounds:150,bursts:5},fuel:5400,ptb:2,cost:35,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','2450 км/год (біля землі 1500)'],['Крейсерська','~900 км/год'],['Бойовий радіус','700 км'],['Стеля','18 км'],['Розмах / довжина','11,36 / 17,32 м']]},
 {id:'su27',name:'Су-27',role:'fighter',country:'СРСР',vmax:2500,cruise:900,dash:1400,ceil:18.5,span:14.7,len:21.9,count:2,radar:100,msl:8,aam:['r27r','r27er','r73'],gun:{name:'ГШ-301',rounds:150,bursts:5},fuel:10800,ptb:0,cost:45,
  info:[['Роль','винищувач-перехоплювач'],['Макс. швидкість','2500 км/год (біля землі 1400)'],['Крейсерська','~900 км/год'],['Бойовий радіус','1500 км'],['Стеля','18,5 км'],['Розмах / довжина','14,7 / 21,9 м'],['ПТБ','не використовує (великий внутрішній запас)']]},
 {id:'f16',name:'F-16',role:'fighter',country:'США',vmax:2410,cruise:900,dash:1470,ceil:18,span:9.96,len:15.06,count:2,radar:110,msl:6,aam:['aim120','aim9x','aim9m'],gun:{name:'M61A1',rounds:511,bursts:5},fuel:7200,ptb:2,cost:60,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','2410 км/год (біля землі ~1470)'],['Крейсерська','~900 км/год'],['Бойовий радіус','550 км'],['Стеля','18 км'],['Розмах / довжина','9,96 / 15,06 м']]},
 {id:'m2000',name:'Mirage 2000',role:'fighter',country:'Франція',vmax:2340,cruise:900,dash:1470,ceil:18,span:9.13,len:14.36,count:2,radar:100,msl:6,aam:['mica','magic'],gun:{name:'2×DEFA 554',rounds:250,bursts:5},fuel:7200,ptb:2,cost:50,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','2340 км/год (2,2 М)'],['Крейсерська','~900 км/год'],['Бойовий радіус','1550 км'],['Стеля','18 км'],['Розмах / довжина','9,13 / 14,36 м']]},
 {id:'gripen',name:'JAS 39 Gripen',role:'fighter',country:'Швеція',vmax:2130,cruise:900,dash:1400,ceil:15.24,span:8.4,len:14.1,count:1,radar:120,msl:6,aam:['meteor','aim120','irist'],gun:{name:'BK-27',rounds:120,bursts:4},fuel:7200,ptb:2,cost:55,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','~2130 км/год'],['Крейсерська','~900 км/год'],['Бойовий радіус','~700 км'],['Стеля','~15,2 км'],['Розмах / довжина','~8,4 / ~14,1 м']]},
 {id:'su24',name:'Су-24М',role:'strike',country:'СРСР',vmax:2500,cruise:870,dash:1320,ceil:11,span:17.64,len:22.67,count:2,radar:0,msl:0,aam:[],fuel:7200,ptb:2,cost:40,power:.15,
  info:[['Роль','фронтовий бомбардувальник'],['Макс. швидкість','2500 км/год (1700 на висоті)'],['Біля землі','1320 км/год'],['Бойовий радіус','560 км'],['Стеля','11 км'],['Розмах / довжина','17,64 (16°) / 22,67 м'],['У грі','удар по пускових → менше цілей']]},
 {id:'su25',name:'Су-25',role:'hunter',country:'СРСР',vmax:984,cruise:750,dash:950,ceil:7,span:14.36,len:15.36,count:2,radar:10,msl:2,aam:['r60'],gun:{name:'ГШ-30-2',rounds:250,bursts:8},fuel:5400,ptb:2,cost:25,
  info:[['Роль','штурмовик'],['Макс. швидкість','984 км/год'],['Крейсерська','~750 км/год'],['Бойовий радіус','750 км'],['Стеля','7 км'],['Розмах / довжина','14,36 / 15,36 м']]},
 {id:'l39',name:'L-39 «Альбатрос»',role:'hunter',country:'Чехословаччина',vmax:750,cruise:600,dash:700,ceil:11,span:9.46,len:12.13,count:2,radar:8,msl:2,aam:['r60'],gun:{name:'ГШ-23',rounds:150,bursts:5},fuel:9000,ptb:0,cost:15,
  info:[['Роль','навчально-бойовий'],['Макс. швидкість','750 км/год'],['Крейсерська','~600 км/год'],['Дальність','1100 км'],['Стеля','~11 км'],['Розмах / довжина','~9,46 / ~12,13 м'],['ПТБ','кінцеві баки вже на крилі']]},
 {id:'mi24',name:'Мі-24',role:'hunter',heli:true,country:'СРСР',vmax:335,cruise:270,dash:320,ceil:4.5,span:17.3,len:17.5,count:2,radar:8,msl:2,aam:['igla'],gun:{name:'ЯкБ-12,7',rounds:1470,bursts:15},fuel:7200,ptb:2,cost:20,
  info:[['Роль','ударний гелікоптер'],['Макс. швидкість','~335 км/год'],['Крейсерська','~270 км/год'],['Дальність','~450 км'],['Стеля','~4,5 км'],['Гвинт / довжина','~17,3 / ~17,5 м']]},
 {id:'mi8',name:'Мі-8',role:'hunter',heli:true,country:'СРСР',vmax:250,cruise:225,dash:250,ceil:4.2,span:21.3,len:18.3,count:3,radar:6,msl:0,aam:[],gun:{name:'кулемети ПКТ',rounds:2000,bursts:20},fuel:9000,ptb:2,cost:15,
  info:[['Роль','багатоцільовий вертоліт'],['Макс. швидкість','~250–270 км/год'],['Крейсерська','~225 км/год'],['Дальність','~425–715 км'],['Стеля','~4,2 км'],['Гвинт / фюзеляж','~21,3 / ~18,3 м']]},
];
AIR.forEach(d => { d.ptbK = d.heli ? .25 : .3; d.ptbSlot = d.heli ? 1 : 2; d.info.push(['Паливо', `~${(d.fuel / 3600).toFixed(1)} год польоту${d.ptb ? `, до ${d.ptb} ПТБ (+${d.ptbK * 100}% кожен, −${d.ptbSlot} ракети)` : ''}`]); });

const UAV = [
 {id:'tb2',name:'Bayraktar TB2',role:'recon',span:12,len:6.5,vmax:220,cruise:130,endur:27,sensor:25,cost:25,
  info:[['Роль','ударно-розвідувальний'],['Розмах / довжина','~12 / ~6,5 м'],['Швидкість','~220 (крейс. ~130) км/год'],['Радіус','~150 км'],['Тривалість','~27 год'],['Навантаження','~150 кг']]},
 {id:'leleka',name:'Лелека-100',role:'recon',span:2,len:1.25,vmax:120,cruise:70,endur:2.5,sensor:12,cost:6,
  info:[['Роль','розвідка'],['Розмах / довжина','~2 / ~1,25 м'],['Швидкість','~120 (крейс. ~70) км/год'],['Радіус','~45 км'],['Тривалість','~2,5 год'],['Схема','літаюче крило']]},
 {id:'furia',name:'А1-СМ «Фурія»',role:'recon',span:2.1,len:1.2,vmax:130,cruise:70,endur:3,sensor:12,cost:6,
  info:[['Роль','розвідка, коригування'],['Розмах / довжина','~2,1 / ~1,2 м'],['Швидкість','~130 км/год'],['Радіус','~50 км'],['Тривалість','~3 год']]},
 {id:'spectator',name:'«Spectator»',role:'recon',span:3,len:1.6,vmax:120,cruise:65,endur:2.5,sensor:10,cost:5,
  info:[['Роль','розвідка'],['Розмах / довжина','~3 / ~1,6 м'],['Швидкість','~120 км/год'],['Радіус','~35 км'],['Тривалість','~2,5 год']]},
 {id:'besomar',name:'Besomar 3310',role:'interceptor',span:1.2,len:.9,vmax:160,range:55,pk:.7,cost:3,
  info:[['Роль','перехоплювач (середня дальність)'],['Швидкість','160 км/год'],['Дальність','50–60 км'],['БЧ','4 кг'],['Схема','літакова'],['Тактика','повільніший за Shahed — бʼє назустріч']]},
 {id:'winfly',name:'WINFLY 10 Hunter',role:'interceptor',span:.6,len:.6,vmax:150,range:18,pk:.6,cost:2,
  info:[['Роль','перехоплювач'],['Швидкість','~150 км/год'],['Дальність','~18 км'],['Розмах / довжина','~0,6 / ~0,6 м'],['Схема','~мультиротор']]},
 {id:'darts',name:'Darts',role:'kamikaze',span:1.5,len:1.2,vmax:160,cruise:140,power:.02,cost:4,
  info:[['Роль','дрон-камікадзе (середня дальність)'],['Швидкість','160 км/год'],['Дальність','40–50 км'],['БЧ','4 кг']]},
 {id:'lutyi',name:'Ан-196 «Лютий»',role:'kamikaze',span:6.7,len:4.2,vmax:200,cruise:170,power:.12,cost:20,
  info:[['Роль','далекобійний камікадзе'],['Розмах / довжина','~6,7 / ~4,2 м'],['Швидкість','~200 км/год'],['Дальність','~1000 км'],['БЧ','~75 кг']]},
 {id:'bober',name:'«Бобер»',role:'kamikaze',span:2.5,len:2.5,vmax:150,cruise:140,power:.06,cost:10,
  info:[['Роль','далекобійний камікадзе'],['Розмах / довжина','~2,5 / ~2,5 м'],['Швидкість','~150 км/год'],['Дальність','~1000 км'],['БЧ','~20 кг'],['Схема','~«качка»']]},
 {id:'fp1',name:'FP-1',role:'kamikaze',span:6,len:4,vmax:160,cruise:150,power:.12,cost:20,
  info:[['Роль','далекобійний ударний'],['Розмах / довжина','~6 / ~4 м'],['Швидкість','~160 км/год'],['Дальність','~1600 км'],['Навантаження','~60–120 кг'],['Старт','з рампи, ракетний прискорювач']]},
];

// Противник (публічні оцінки, все «~»). vr — розкид швидкості км/год для кожного екземпляра.
const ENEMY = {
 shahed:{name:'Shahed-136 («Герань-2»)',short:'Shahed-136',kind:'drone',vr:[150,185],warhead:50,alt:[.1,2],reward:3,dirs:['N','NE','E','S'],
  info:[['Тип','ударний дрон-камікадзе'],['Розмах / довжина','~2,5 / ~3,5 м'],['Швидкість','~150–185 км/год'],['БЧ','~50 кг'],['Висота','~0,1–2 км'],['Двигун','поршневий, штовхальний гвинт']]},
 geran3:{name:'Shahed-238 («Герань-3»)',short:'Shahed-238',kind:'drone',vr:[500,600],warhead:50,alt:[1,3],reward:6,dirs:['N','NE','E'],
  info:[['Тип','реактивний ударний дрон'],['Розмах / довжина','~2,5 / ~3,2 м'],['Швидкість','~500–600 км/год'],['БЧ','~50 кг'],['Висота','~1–3 км']]},
 gerbera:{name:'«Гербера» (імітатор)',short:'Гербера-імітатор',kind:'drone',model:'gerbera',decoy:true,vr:[120,160],warhead:0,alt:[.1,2],reward:1,dirs:['N','NE','E','S'],
  info:[['Тип','дрон-імітатор із пінопласту й фанери'],['Розмах / довжина','~2,4 / ~2,2 м'],['Швидкість','~120–160 км/год'],['БЧ','немає'],['На радарі','як Shahed']]},
 gerberaW:{name:'«Гербера» з БЧ',short:'Гербера з БЧ',kind:'drone',model:'gerbera',vr:[120,160],warhead:10,alt:[.1,2],reward:2,dirs:['N','NE','E'],
  info:[['Тип','імітатор з малою бойовою частиною'],['Швидкість','~120–160 км/год'],['БЧ','~5–10 кг'],['На радарі','як Shahed']]},
 gerberaR:{name:'«Гербера»-розвідник',short:'Гербера-розвідник',kind:'drone',model:'gerbera',recon:true,vr:[120,160],warhead:0,alt:[.5,2],reward:4,dirs:['N','NE','E'],
  info:[['Тип','імітатор з камерою і модемом'],['Швидкість','~120–160 км/год'],['У грі','шукає ваші ППО і наводить удар']]},
 parodiya:{name:'«Пародія»',short:'Пародія (імітатор)',kind:'drone',decoy:true,vr:[120,150],warhead:0,alt:[.2,1.5],reward:1,dirs:['N','E','S'],
  info:[['Тип','дешевий дрон-імітатор'],['Розмах / довжина','~2 / ~2,5 м'],['Швидкість','~120–150 км/год'],['БЧ','немає'],['На радарі','як Shahed']]},
 orlan:{name:'Орлан-10',short:'Орлан-10',kind:'drone',recon:true,vr:[90,150],warhead:0,alt:[1,3],reward:5,dirs:['N','NE','E'],
  info:[['Тип','розвідувальний БпЛА'],['Розмах / довжина','~3,1 / ~1,8 м'],['Швидкість','~90–150 км/год'],['Тривалість','до ~16 год'],['У грі','наводить удари на ваші ППО']]},
 zala:{name:'ZALA 421-16Е',short:'ZALA 421-16Е',kind:'drone',recon:true,vr:[65,110],warhead:0,alt:[.8,2.5],reward:5,dirs:['N','NE'],
  info:[['Тип','розвідувальний БпЛА'],['Схема','літаюче крило'],['Розмах','~1,8 м'],['Швидкість','~65–110 км/год'],['У грі','наводить удари на ваші ППО']]},
 supercam:{name:'Supercam S350',short:'Supercam S350',kind:'drone',recon:true,vr:[65,120],warhead:0,alt:[.5,2.5],reward:5,dirs:['N','NE','E'],
  info:[['Тип','розвідувальний БпЛА'],['Розмах / довжина','~3,2 / ~1,4 м'],['Швидкість','~65–120 км/год'],['Тривалість','~4 год'],['У грі','наводить удари на ваші ППО']]},
 forpost:{name:'«Форпост-Р»',short:'Форпост-Р',kind:'drone',recon:true,vr:[120,200],warhead:0,alt:[2,5],reward:8,dirs:['N','NE'],
  info:[['Тип','розвідувально-ударний БпЛА'],['Розмах / довжина','~8,5 / ~5,9 м'],['Швидкість','~120–200 км/год'],['Тривалість','~18 год'],['Схема','двобалкова, штовхальний гвинт']]},
 orion:{name:'«Оріон» («Іноходець»)',short:'Оріон',kind:'drone',recon:true,vr:[120,200],warhead:0,alt:[3,6],reward:10,dirs:['N','NE'],
  info:[['Тип','розвідувально-ударний БпЛА'],['Розмах / довжина','~16,3 / ~8,1 м'],['Швидкість','~120–200 км/год'],['Тривалість','~24 год'],['Навантаження','~200 кг']]},
 shahedMS:{name:'Shahed-136 з mesh-модемом',short:'Shahed (керований)',kind:'drone',model:'shahed',retarget:true,vr:[150,185],warhead:50,alt:[.1,2],reward:5,dirs:['N','E'],
  info:[['Тип','ударний дрон з камерою і модемом'],['Швидкість','~150–185 км/год'],['БЧ','~50 кг'],['Особливість','оператор перенацілює в польоті'],['У грі','помітивши ППО ближче 25 км — атакує її']]},
 garpiya:{name:'«Гарпія-А1»',short:'Гарпія-А1',kind:'drone',model:'shahed',vr:[150,190],warhead:50,alt:[.1,2],reward:3,dirs:['N','E','S'],
  info:[['Тип','ударний дрон-камікадзе (російське виробництво)'],['Схема','як Shahed-136'],['Швидкість','~150–190 км/год'],['БЧ','~50 кг']]},
 italmas:{name:'«Італмас»',short:'Італмас',kind:'drone',vr:[150,200],warhead:30,alt:[.2,1.5],reward:3,dirs:['N','E'],
  info:[['Тип','дрон-камікадзе / розвідник'],['Розмах / довжина','~3 / ~2,5 м'],['Швидкість','~150–200 км/год'],['БЧ','~5–35 кг'],['Двигун','поршневий']]},
 kh101:{name:'Х-101',short:'Х-101',kind:'cruise',vr:[700,750],warhead:400,alt:[.03,.08],reward:10,dirs:['N','E','NE'],
  info:[['Тип','крилата ракета'],['Довжина','~7,45 м'],['Швидкість','~720 (макс. ~970) км/год'],['БЧ','~400 кг'],['Висота','~30–80 м — нижче радіогоризонту']]},
 kalibr:{name:'«Калібр» 3М-14',short:'Калібр',kind:'cruise',vr:[850,900],warhead:450,alt:[.05,.15],reward:10,dirs:['S'],
  info:[['Тип','крилата ракета морського базування'],['Довжина','~6,2 м'],['Швидкість','~880 км/год'],['БЧ','~450 кг'],['Висота','~50–150 м']]},
 iskander:{name:'Іскандер-М (9М723)',short:'Іскандер-М',kind:'bal',vr:[6000,6000],warhead:480,alt:[15,15],reward:15,dirs:['N','NE'],
  info:[['Тип','балістична ракета'],['Довжина','~7,3 м'],['Швидкість','~6 М'],['БЧ','~480 кг'],['Збивають','Patriot, С-300 (48Н6)']]},
 kinzhal:{name:'Х-47М2 «Кинджал»',short:'Кинджал',kind:'bal',vr:[9000,9000],warhead:480,alt:[15,15],reward:20,dirs:['E','S'],
  info:[['Тип','аеробалістична ракета'],['Довжина','~7,2 м'],['Швидкість','до ~10 М (заявлено)'],['БЧ','~480 кг'],['Збивають','Patriot, С-300 (48Н6)']]},
};
for (const [id, e] of Object.entries(ENEMY)) { e.id = id; e.v = (e.vr[0] + e.vr[1]) / 2; }
const KIND = {drone: 'БпЛА', cruise: 'КР', bal: 'БР'};
// що бачить оператор до ідентифікації
const PRELIM = e => e.def.kind === 'bal' ? 'Балістична ціль' : e.def.kind === 'cruise' ? 'Крилата ракета' : e.def.recon ? 'Малий БпЛА' : 'БпЛА типу Shahed';

const WAVES = [
 {shahed:8, parodiya:2},
 {shahed:12, gerbera:3, orlan:1},
 {shahed:12, garpiya:2, gerbera:4, gerberaW:2, kh101:4, zala:1, supercam:1},
 {shahed:13, garpiya:3, italmas:2, geran3:2, gerbera:6, gerberaR:1, kh101:4, kalibr:2, orlan:1, forpost:1},
 {shahed:14, garpiya:4, shahedMS:2, geran3:3, parodiya:4, gerberaW:3, kh101:6, iskander:2, orlan:2},
 {shahed:18, garpiya:4, italmas:3, shahedMS:3, geran3:4, gerbera:8, gerberaR:2, kh101:6, kalibr:4, iskander:2, zala:1, orion:1},
 {shahed:22, garpiya:6, italmas:3, shahedMS:4, geran3:6, gerbera:10, gerberaW:4, kh101:8, kalibr:6, iskander:3, kinzhal:1, orlan:2, supercam:1},
 {shahed:30, garpiya:8, italmas:4, shahedMS:6, geran3:8, gerbera:12, parodiya:6, gerberaR:2, kh101:10, kalibr:8, iskander:4, kinzhal:2, orlan:2, forpost:1, orion:1},
];

// ================= GEO =================
const LAT0 = 50.45, LNG0 = 30.52, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180), KY = 110.57;
const toXY = (lat, lng) => ({x: (lng - LNG0) * KX, y: (lat - LAT0) * KY});
const UKR = [[44.3, 22.1], [52.4, 40.2]];
const OBL = [[49.15, 29.2], [51.6, 32.2]];
// Межа Київської області (зовнішній контур, спрощено) — © OpenStreetMap contributors, ODbL
const OBL_POLY = [[51.265,29.268],[51.127,29.329],[51.160,29.349],[51.061,29.512],[50.979,29.476],[50.949,29.411],[50.904,29.471],[50.837,29.497],[50.814,29.547],[50.793,29.521],[50.774,29.472],[50.729,29.598],[50.690,29.542],[50.663,29.486],[50.621,29.445],[50.547,29.502],[50.517,29.460],[50.471,29.511],[50.471,29.457],[50.440,29.499],[50.415,29.443],[50.423,29.560],[50.375,29.589],[50.358,29.642],[50.330,29.626],[50.298,29.676],[50.265,29.666],[50.180,29.643],[50.128,29.659],[50.107,29.647],[50.044,29.695],[49.944,29.735],[49.874,29.667],[49.835,29.547],[49.835,29.509],[49.806,29.439],[49.729,29.435],[49.714,29.498],[49.637,29.535],[49.562,29.531],[49.507,29.585],[49.485,29.543],[49.402,29.542],[49.371,29.503],[49.306,29.619],[49.274,29.622],[49.247,29.639],[49.261,29.701],[49.227,29.754],[49.180,29.760],[49.200,29.877],[49.312,29.947],[49.334,30.026],[49.285,30.089],[49.289,30.123],[49.331,30.137],[49.275,30.190],[49.236,30.376],[49.302,30.421],[49.365,30.473],[49.327,30.547],[49.332,30.729],[49.359,30.909],[49.416,30.921],[49.472,31.029],[49.474,31.040],[49.557,31.109],[49.572,31.140],[49.584,31.129],[49.695,31.217],[49.733,31.222],[49.777,31.217],[49.832,31.221],[49.868,31.247],[49.892,31.310],[49.936,31.334],[49.956,31.334],[49.973,31.305],[49.993,31.383],[49.974,31.445],[49.892,31.434],[49.843,31.502],[49.875,31.557],[49.906,31.613],[49.852,31.717],[49.894,31.774],[49.966,31.813],[49.944,31.901],[50.019,31.900],[50.052,31.987],[50.101,31.911],[50.158,31.934],[50.201,31.993],[50.222,32.086],[50.247,32.089],[50.283,32.084],[50.316,32.129],[50.354,32.141],[50.375,32.075],[50.402,32.046],[50.467,31.973],[50.486,31.963],[50.512,32.064],[50.541,32.063],[50.596,31.913],[50.606,31.782],[50.563,31.683],[50.521,31.630],[50.536,31.523],[50.500,31.445],[50.501,31.330],[50.539,31.262],[50.589,31.166],[50.613,31.228],[50.667,31.224],[50.703,31.191],[50.750,31.122],[50.781,31.075],[50.757,30.951],[50.747,30.875],[50.754,30.831],[50.777,30.846],[50.786,30.871],[50.764,30.837],[50.792,30.747],[50.810,30.761],[50.874,30.772],[50.964,30.645],[51.010,30.603],[51.019,30.499],[51.074,30.510],[51.111,30.517],[51.165,30.490],[51.187,30.517],[51.227,30.505],[51.250,30.555],[51.273,30.454],[51.313,30.398],[51.379,30.358],[51.513,30.180],[51.506,30.128],[51.505,30.014],[51.471,29.962],[51.478,29.886],[51.460,29.813],[51.442,29.797],[51.532,29.738],[51.506,29.634],[51.482,29.539],[51.397,29.496],[51.388,29.361],[51.379,29.393],[51.324,29.347],[51.274,29.354],[51.265,29.268]];
function inObl(lat, lng) { // промінь — точка всередині багатокутника
  let ins = false;
  for (let i = 0, j = OBL_POLY.length - 1; i < OBL_POLY.length; j = i++) {
    const [ya, xa] = OBL_POLY[i], [yb, xb] = OBL_POLY[j];
    if ((ya > lat) !== (yb > lat) && lng < (xb - xa) * (lat - ya) / (yb - ya) + xa) ins = !ins;
  }
  return ins;
}
// Типові коридори прольоту на Київ — узагальнено з публічних моніторингових мап (наближено, не в реальному часі)
const ROUTES = {
  N:  {name: 'Чернігівщина, вздовж Десни', pts: [[51.75, 31.6], [51.35, 31.25], [51.0, 31.0], [50.75, 30.85]]},
  NW: {name: 'Вздовж кордону з Білоруссю, через Чорнобильську зону', pts: [[51.65, 30.6], [51.3, 30.1], [50.95, 29.75], [50.65, 29.95]]},
  W:  {name: 'Житомирщина (після обльоту з заходу)', pts: [[50.9, 28.6], [50.55, 29.2], [50.45, 29.7]]},
  E:  {name: 'Сумщина / Полтавщина → Бориспіль', pts: [[50.75, 33.2], [50.55, 32.3], [50.4, 31.5], [50.35, 31.0]]},
  S:  {name: 'Черкащина, вздовж Дніпра', pts: [[49.3, 32.0], [49.7, 31.5], [49.95, 31.15], [50.15, 30.8]]},
  SW: {name: 'Вінниччина → Біла Церква → Фастів', pts: [[49.0, 29.3], [49.5, 29.8], [49.85, 30.05], [50.1, 30.2]]},
};
const BAL_FROM = {N: [51.95, 30.6], NE: [51.8, 32.6], E: [50.5, 33.6], S: [48.7, 31.2]};
// Складність: кількість цілей, стартовий ресурс, нагорода, час наведення розвідником, с
const DIFF = [
  {name: 'Новобранець', count: .6, res: 300, reward: 1.5, spot: 600},
  {name: 'Легко', count: .8, res: 220, reward: 1.2, spot: 450},
  {name: 'Нормально', count: 1, res: 160, reward: 1, spot: 300},
  {name: 'Складно', count: 1.3, res: 120, reward: .85, spot: 240},
  {name: 'Ветеран', count: 1.7, res: 90, reward: .7, spot: 180},
];
const CITIES0 = [['Київ',50.45,30.52,60,6],['Бровари',50.511,30.79,10,1],['Бориспіль',50.35,30.955,10,1],['Вишгород',50.585,30.49,10,1],
 ['Ірпінь',50.52,30.25,8,1],['Біла Церква',49.8,30.11,10,1],['Фастів',50.08,29.92,8,1],['Обухів',50.11,30.62,8,1]];
const BASE = {...toXY(50.235, 30.3), name: 'Аеродром Васильків'};
const LAUNCH = toXY(50.15, 30.75);
const EXIT = toXY(51.75, 32.6);
const SPEEDS = [0, 1, 10, 30, 60]; // множник реального часу: 1× — усе летить із реальною швидкістю

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const horizon = hKm => 4.12 * (5 + Math.sqrt(hKm * 1000)); // радіогоризонт, антена ~25 м
const sum = (o, f = () => 1) => Object.entries(o).reduce((s, [k, n]) => s + n * f(k), 0);

// точка зустрічі для перехоплювача зі швидкістю v (км/с); null — не наздожене
function intercept(o, e, v) {
  const dx = e.x - o.x, dy = e.y - o.y, evx = e.vx || 0, evy = e.vy || 0;
  const a = evx * evx + evy * evy - v * v, b = 2 * (dx * evx + dy * evy), c = dx * dx + dy * dy;
  let t;
  if (Math.abs(a) < 1e-12) t = b < 0 ? -c / b : -1;
  else {
    const D = b * b - 4 * a * c; if (D < 0) return null;
    const s = Math.sqrt(D), t1 = (-b - s) / (2 * a), t2 = (-b + s) / (2 * a);
    t = Math.min(t1, t2) > 0 ? Math.min(t1, t2) : Math.max(t1, t2);
  }
  return t > 0 ? {x: e.x + evx * t, y: e.y + evy * t, t} : null;
}


// ================= СТАН ГРИ («СУДДЯ») =================
// Уся логіка бою тут: без DOM, карти, звуку. Все, що має показати екран, іде подіями в G.out:
// ['say', текст, клас] ['snd', назва] ['boom', x, y, життя, радіус, колір] ['burst', x, y, n, колір, швидкість]
// ['tracer', x1, y1, x2, y2] ['shake', сила, спалах] ['end', перемога]
let G = null;
const emit = (...ev) => { if (G) G.out.push(ev); };
const say = (text, cls = '') => emit('say', text, cls);
const snd = name => emit('snd', name);
const toLatLng = (x, y) => [LAT0 + y / KY, LNG0 + x / KX];
const label = e => e.ident ? e.def.short : PRELIM(e);

function newGame(diff = 2) {
  return {
    wave: 0, phase: 'deploy', time: 0, waveT: 0, diff, res: DIFF[diff].res, kills: 0, leaks: 0, spent: 0, nextMult: 1,
    events: [], out: [], nid: 1, over: false, win: false,
    cities: CITIES0.map(([name, lat, lng, hp, w]) => ({name, ...toXY(lat, lng), hp, max: hp, w})),
    sams: [], enemies: [], shots: [], air: [], uavs: [],
  };
}
const newId = () => G.nid++;
function byId(id) {
  for (const arr of [G.sams, G.air, G.uavs, G.enemies]) { const o = arr.find(o => o.id === id); if (o) return o; }
  return null;
}
function pay(n) { if (G.res < n) { say(`Бракує ресурсу (потрібно ${n} ⛁).`, 'bad'); return false; } G.res -= n; G.spent += n; return true; }

// ================= ЗАКУПІВЛЯ =================
const maxFuel = a => a.d.fuel * (1 + a.ptb * a.d.ptbK);
const maxMsl = a => Math.max(0, a.d.msl - a.ptb * a.d.ptbSlot);
const used = (o, tbl) => sum(o, k => tbl[k].size || 1);
function buySam(s, mid, n) {
  const d = s.d, m = SAM_MSL[mid]; let bought = 0;
  if (!m || !d.msl.includes(mid)) return 0;
  while (bought < n && G.res >= m.cost) {
    if (s.reload <= 0 && used(s.load, SAM_MSL) + m.size <= d.cap) s.load[mid] = (s.load[mid] || 0) + 1;
    else if (used(s.stock, SAM_MSL) + m.size <= d.cap * 2) s.stock[mid] = (s.stock[mid] || 0) + 1;
    else break;
    G.res -= m.cost; G.spent += m.cost; bought++;
  }
  if (bought) snd('coin'); else if (G.res < m.cost) say(`Бракує ресурсу на ${m.name}.`, 'bad'); else say('ПУ і резерв заповнені.');
  return bought;
}
function buyAam(a, mid, n) { // тільки на базі
  const m = AAM[mid]; let bought = 0;
  if (!m || !a.d.aam.includes(mid)) return 0;
  while (bought < n && sum(a.load) < maxMsl(a) && G.res >= m.cost) { a.load[mid] = (a.load[mid] || 0) + 1; G.res -= m.cost; G.spent += m.cost; bought++; }
  if (bought) snd('coin'); else if (G.res < m.cost) say(`Бракує ресурсу на ${m.name}.`, 'bad');
  return bought;
}
const GUN_COST = 2;
function buyGun(a) { if (!a.d.gun || a.gun >= a.d.gun.bursts || !pay(GUN_COST)) return false; a.gun = a.d.gun.bursts; snd('coin'); return true; }
function serviceRearm(a) {
  for (const [mid, n] of Object.entries(a.want)) { const need = n - (a.load[mid] || 0); if (need > 0) buyAam(a, mid, need); }
  if (a.gunWant) buyGun(a);
}
function goHome(a, why) { a.state = 'rtb'; a.tgt = null; a.lock = null; a.rtbShots = 2; if (why) say(`${a.d.name}: ${why} — повертається (дорогою може випустити до 2 ракет).`, 'warn'); }

// ================= КОМАНДИ ГРАВЦЯ =================
// Єдиний вхід для дій гравця. У мережевій грі ці самі обʼєкти полетять на сервер.
// {t:'startWave'} {t:'buyAir', def} {t:'kamikaze', def} {t:'place', kind:'sam'|'uav', def, x, y}
// {t:'assign', unit, target} {t:'move', unit, x, y} {t:'act', unit, act, arg}
function command(c) {
  if (!G || G.over || !c) return null;
  const u = c.unit != null ? byId(c.unit) : null;
  if (c.t === 'startWave') { startWave(); return null; }
  if (c.t === 'buyAir') {
    const d = AIR.find(a => a.id === c.def);
    if (!d || G.air.filter(a => a.d === d).length >= d.count || !pay(d.cost)) return null;
    const a = {id: newId(), kind: 'air', d, x: BASE.x, y: BASE.y, tx: BASE.x, ty: BASE.y, state: 'base', fuel: d.fuel, ptb: 0, load: {}, want: {}, gun: 0, gunWant: false,
      cd: 0, orb: 0, rot: 0, aimT: 0, gunT: 0, lock: null, tgt: null, rtbShots: 0, gunMode: d.role === 'hunter', filt: {drone: true, cruise: true}, turn: d.heli ? .6 : d.role === 'strike' ? .25 : .3};
    G.air.push(a);
    say(`${d.name} прибув на ${BASE.name}. Купіть ракети${d.gun ? ' і снаряди' : ''} в панелі борту.`, 'warn');
    return a;
  }
  if (c.t === 'kamikaze') {
    const d = UAV.find(x => x.id === c.def && x.role === 'kamikaze');
    if (!d || !pay(d.cost)) return null;
    G.uavs.push({id: newId(), kind: 'uav', d, ...LAUNCH, rot: 0, state: 'strike', turn: .4});
    say(`${d.name} запущено по пускових позиціях противника.`, 'ok');
    return null;
  }
  if (c.t === 'place') {
    const d = (c.kind === 'sam' ? SAM : UAV).find(x => x.id === c.def);
    if (!d || (c.kind === 'uav' && d.role === 'kamikaze') || !isFinite(c.x) || !isFinite(c.y)) return null;
    const [lat, lng] = toLatLng(c.x, c.y);
    if (!inObl(lat, lng)) { say('Тільки в межах Київської області.', 'bad'); return null; }
    if (!pay(d.cost)) return null;
    if (c.kind === 'sam') {
      const s = {id: newId(), kind: 'sam', d, x: c.x, y: c.y, load: {}, stock: {}, buyType: d.msl[0], reload: 0, cd: 0, rot: 0, force: null, auto: false, lock: null, hot: 0,
        filt: {drone: true, cruise: true, bal: !!d.bm}};
      G.sams.push(s); say(`${d.name} розгорнуто. Оберіть і купіть ракети!`, 'warn');
      return s;
    }
    const v = {id: newId(), kind: 'uav', d, x: c.x, y: c.y, hx: c.x, hy: c.y, orb: 0, rot: 0, fuel: d.role === 'recon' ? d.endur * 3600 : d.range, state: 'loiter',
      turn: d.id === 'winfly' ? 2 : d.role === 'interceptor' ? .9 : .5};
    G.uavs.push(v); say(`${d.name} у повітрі.`, 'ok');
    return v;
  }
  if (!u) return null;
  if (c.t === 'assign') { const e = byId(c.target); if (e && e.kind === 'enemy' && e.det) assign(u, e); return null; }
  if (c.t === 'move' && isFinite(c.x) && isFinite(c.y)) {
    if (u.kind === 'air' && u.d.role !== 'strike') {
      if (u.state === 'service') { say(`${u.d.name} ще обслуговується.`, 'bad'); return null; }
      if (u.state === 'base') { if (!sum(u.load) && !u.gun) say(`${u.d.name} злітає без озброєння — лише розвідка радаром.`, 'warn'); else say(`${u.d.name}: зліт з ${BASE.name}.`, 'ok'); }
      u.state = 'move'; u.tx = c.x; u.ty = c.y; u.tgt = null;
    } else if (u.kind === 'uav' && u.d.role !== 'kamikaze') { u.hx = c.x; u.hy = c.y; u.tgt = null; u.forced = false; }
    return null;
  }
  if (c.t === 'act') unitAct(u, c.act, c.arg);
  return null;
}
function assign(u, e) {
  if (u.kind === 'sam') {
    if (e.def.kind === 'bal' && !u.d.bm) { say(`${u.d.name} не може збивати балістику.`, 'bad'); return; }
    u.force = e; say(`${u.d.name}: пріоритетна ціль — ${label(e)}.`);
  } else if (u.kind === 'air') {
    if (u.d.role === 'strike') return;
    if (e.def.kind === 'bal') { say('Авіація не перехоплює балістику.', 'bad'); return; }
    if (u.state === 'service') { say(`${u.d.name} ще обслуговується.`, 'bad'); return; }
    if (!sum(u.load) && !u.gun) { say(`${u.d.name}: немає ні ракет, ні снарядів!`, 'bad'); return; }
    u.tgt = e; u.state = 'intercept'; say(`${u.d.name}: перехоплення — ${label(e)}.`);
  } else if (u.kind === 'uav' && u.d.role === 'interceptor') {
    u.tgt = e; u.forced = true;
    say(intercept(u, e, u.d.vmax / 3600) ? `${u.d.name}: ціль призначено.` : `${u.d.name}: ціль швидша і віддаляється — не наздожене, спробуйте назустріч.`, 'warn');
  }
}
// дії з панелі юніта; сервер перевіряє все сам (кнопку могли натиснути не вчасно)
function unitAct(u, act, arg) {
  const base = u.kind === 'air' && u.state === 'base';
  if (u.kind === 'sam') {
    if (act === 'f' && arg in u.filt) u.filt[arg] = !u.filt[arg];
    else if (act === 'pick' && u.d.msl.includes(arg)) u.buyType = arg;
    else if (act === 'b1' && u.d.msl.includes(arg)) { u.buyType = arg; buySam(u, arg, 1); }
    else if (act === 'bf' && u.d.msl.includes(arg)) { u.buyType = arg; buySam(u, arg, 99); }
    else if (act === 'auto') u.auto = !u.auto;
    else if (act === 'unforce') u.force = null;
    else if (act === 'sell') { G.sams = G.sams.filter(s => s !== u); G.res += Math.round(u.d.cost / 2); say(`${u.d.name} демонтовано.`); }
  } else if (u.kind === 'air') {
    const d = u.d;
    if (act === 'f' && arg in u.filt) u.filt[arg] = !u.filt[arg];
    else if (act === 'a+' && base) { if (buyAam(u, arg, 1)) u.want = {...u.load}; }
    else if (act === 'a-' && base && u.load[arg] > 0) { u.load[arg]--; G.res += AAM[arg].cost; u.want = {...u.load}; }
    else if (act === 'ptb+' && base && u.ptb < d.ptb && sum(u.load) <= maxMsl(u) - d.ptbSlot) { u.ptb++; u.fuel = maxFuel(u); }
    else if (act === 'ptb-' && base && u.ptb > 0) { u.ptb--; u.fuel = maxFuel(u); }
    else if (act === 'gun' && base) { if (buyGun(u)) u.gunWant = true; }
    else if (act === 'gm') u.gunMode = !u.gunMode;
    else if (act === 'rtb' && !['base', 'service', 'rtb'].includes(u.state)) goHome(u, 'наказ');
    else if (act === 'strike' && base && d.role === 'strike') { u.state = 'strikeOut'; u.tx = EXIT.x; u.ty = EXIT.y; say(`${d.name}: виліт на удар по пускових позиціях.`, 'ok'); }
  }
}

// ================= ХВИЛІ =================
function applyStrike(power, name) {
  const left = G.events.filter(e => !e.done);
  if (G.phase === 'wave' && left.length) {
    const n = Math.max(1, Math.round(left.length * power));
    left.sort(() => Math.random() - .5).slice(0, n).forEach(e => e.done = true);
    say(`${name}: удар успішний — зірвано ${n} пусків.`, 'ok');
  } else {
    G.nextMult = Math.max(.4, G.nextMult * (1 - power));
    say(`${name}: удар успішний — наступна хвиля слабша (−${Math.round((1 - G.nextMult) * 100)}%).`, 'ok');
  }
}
const routesOf = d => d.id === 'kalibr' ? ['S', 'SW'] : d.kind === 'cruise' ? ['N', 'NW', 'W'] : d.recon ? ['N', 'NW', 'E'] : ['N', 'N', 'NW', 'W', 'E', 'S', 'SW'];
const jit = ([lat, lng], km) => { const p = toXY(lat, lng); return {x: p.x + rnd(-km, km), y: p.y + rnd(-km, km)}; };
function startWave() {
  if (G.phase !== 'deploy' || G.wave >= WAVES.length) return;
  const w = WAVES[G.wave++];
  G.events = [];
  for (const [type, n0] of Object.entries(w)) {
    const d = ENEMY[type], k = d.recon || d.kind === 'bal' ? Math.min(1.3, DIFF[G.diff].count) : DIFF[G.diff].count;
    let n = Math.max(1, Math.round(n0 * G.nextMult * k));
    while (n > 0) {
      const size = d.kind === 'drone' && !d.recon ? Math.min(n, 2 + (Math.random() * 4 | 0)) : 1;
      const t = d.recon ? rnd(0, 500) : d.kind === 'bal' ? rnd(1600, 2600) : d.kind === 'cruise' || d.v > 400 ? rnd(800, 2200) : rnd(0, 1700);
      const dir = d.kind === 'bal' ? pick(d.dirs) : pick(routesOf(d)); // рій летить одним коридором
      for (let i = 0; i < size; i++) G.events.push({type, dir, t: t + i * rnd(10, 40)});
      n -= size;
    }
  }
  G.events.sort((a, b) => a.t - b.t);
  G.nextMult = 1; G.phase = 'wave'; G.waveT = 0;
  snd('siren'); say(`Повітряна тривога! Хвиля ${G.wave}: ${G.events.length} цілей.`, 'bad');
}
function spawnEnemy(type, dir, samT) {
  const d = ENEMY[type];
  let route = null, p;
  if (d.kind === 'bal') p = jit(BAL_FROM[dir && BAL_FROM[dir] ? dir : pick(d.dirs)], 25);
  else { route = ROUTES[dir && ROUTES[dir] ? dir : pick(routesOf(d))]; p = jit(route.pts[0], 6); }
  let city = null, tgt;
  if (samT) tgt = {x: samT.x, y: samT.y};
  else if (d.recon) tgt = {x: rnd(-40, 40), y: rnd(-30, 50)};
  else {
    const alv = G.cities.filter(c => c.hp > 0); if (!alv.length) return;
    let r = Math.random() * alv.reduce((s, c) => s + c.w, 0); city = alv[0];
    for (const c of alv) if ((r -= c.w) <= 0) { city = c; break; }
    const spread = city.w > 1 ? 6 : 2; tgt = {x: city.x + rnd(-spread, spread), y: city.y + rnd(-spread, spread)};
  }
  // маршрут: точки коридору (з розкидом ±6 км), потім ціль; ракета по ППО — напряму
  const wps = route && !samT ? route.pts.slice(1).map(q => jit(q, 6)) : [];
  wps.push(tgt);
  G.enemies.push({id: newId(), kind: 'enemy', def: d, type, ...p, home: p, v: rnd(...d.vr) / 3600, vx: 0, vy: 0, alt: rnd(...d.alt), wps, city, samT, eng: 0, det: false, ident: false, rot: 0,
    turn: d.kind === 'bal' ? 0 : d.kind === 'cruise' ? .15 : d.v > 400 ? .2 : d.recon ? .4 : .3, loiter: d.recon ? 1500 : 0, spot: 0, orb: 0, route: route?.name});
}

// ================= ФІЗИКА =================
// o.turn — макс. кутова швидкість, рад/с: тоді обʼєкт розвертається поступово, а не миттєво
function moveTo(o, tx, ty, v, dt) {
  const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy), s = v * dt, want = Math.atan2(dx, dy);
  if (o.turn) {
    if (o.hd == null) o.hd = want;
    const da = ((want - o.hd + Math.PI * 3) % (Math.PI * 2)) - Math.PI, mx = o.turn * dt;
    o.hd += Math.max(-mx, Math.min(mx, da)); o.rot = o.hd;
    o.vx = Math.sin(o.hd) * v; o.vy = Math.cos(o.hd) * v; o.x += o.vx * dt; o.y += o.vy * dt;
    return d <= Math.max(s, v / o.turn * .9); // «прибув» у межах радіуса розвороту
  }
  o.rot = want;
  if (d <= s) { o.vx = d ? dx / d * v : o.vx; o.vy = d ? dy / d * v : o.vy; o.x = tx; o.y = ty; return true; }
  o.vx = dx / d * v; o.vy = dy / d * v; o.x += o.vx * dt; o.y += o.vy * dt; return false;
}
function orbit(o, cx, cy, R, v, dt) { o.orb += v / R * dt; moveTo(o, cx + Math.cos(o.orb) * R, cy + Math.sin(o.orb) * R, v, dt); }
function lead(o, e, v) { return intercept(o, e, v) || {x: e.x, y: e.y}; }

function fire(src, e, vKms, pk, maxKm, name) {
  e.eng++;
  G.shots.push({x: src.x, y: src.y, v: vKms, e, pk, left: maxKm, name, trail: []});
  snd('launch');
}
function kill(e, by) {
  if (e.dead) return;
  e.dead = true; G.kills++; const rw = Math.round(e.def.reward * DIFF[G.diff].reward); G.res += rw;
  emit('boom', e.x, e.y, 1, 14, '#ffe08a'); emit('burst', e.x, e.y, 14, '#ffd27a', 2.5);
  snd('boom'); say(`${e.def.short} знищено — ${by}. +${rw} ⛁`, 'ok');
}
function impact(e) {
  e.dead = true;
  emit('boom', e.x, e.y, 2.5, e.def.warhead ? 26 : 8, '#ff5a3a');
  if (!e.def.warhead) { say(`${e.def.short} впала без вибуху.`); return; }
  G.leaks++; snd('impact'); emit('burst', e.x, e.y, 26, '#ff7a3a', 4); emit('shake', e.def.warhead / 40, e.def.warhead / 2000);
  if (e.samT) {
    const s = G.sams.find(s => s === e.samT && dist(s, e) < 4);
    if (s) { G.sams = G.sams.filter(x => x !== s); say(`Позицію ${s.d.name} знищено ударом ${e.def.short}!`, 'bad'); }
    return;
  }
  const c = e.city; if (!c || c.hp <= 0) return;
  c.hp = Math.max(0, c.hp - e.def.warhead / 50);
  say(`Влучання: ${c.name} (${e.def.short}).`, 'bad');
  if (c.hp === 0) say(`${c.name}: критичні руйнування!`, 'bad');
}
function detect() {
  for (const e of G.enemies) {
    const hz = horizon(e.alt);
    e.det = G.sams.some(s => dist(s, e) <= Math.min(s.d.det, hz))
      || G.air.some(a => !['base', 'service'].includes(a.state) && dist(a, e) <= a.d.radar)
      || G.uavs.some(u => (u.d.role === 'recon' && dist(u, e) <= u.d.sensor) || (u.d.role === 'interceptor' && (dist({x: u.hx, y: u.hy}, e) <= 10 || dist(u, e) <= 3)))
      || G.cities.some(c => dist(c, e) <= 6);
    // ідентифікація типу: оптика/візуально зблизька; балістика й КР — за траєкторією одразу
    if (!e.ident && e.det && (e.def.kind !== 'drone'
      || G.uavs.some(u => u.state !== 'strike' && dist(u, e) <= 15) || G.air.some(a => !['base', 'service'].includes(a.state) && dist(a, e) <= 15)
      || G.cities.some(c => dist(c, e) <= 8) || G.sams.some(s => dist(s, e) <= 8))) e.ident = true;
  }
}
const okFor = (u, e) => !!u.filt[e.def.kind] && !(e.ident && e.def.decoy);
const samMaxRange = s => Math.max(0, ...Object.entries(s.load).filter(([, n]) => n > 0).map(([k]) => SAM_MSL[k].range));
function pickMissile(load, tbl, d, bal) {
  let best = null;
  for (const [k, n] of Object.entries(load)) { const m = tbl[k]; if (n > 0 && m.range >= d && (!bal || m.bm) && (!best || m.cost < best.cost)) best = m; }
  return best;
}
// захоплення: ціль резервується (eng++) на час прицілювання, щоб інші не стріляли по ній паралельно
function startLock(u, e, t) { if (u.lock) dropLock(u); u.lock = {e, t, t0: t}; e.eng++; snd('lock'); }
function dropLock(u) { if (u.lock) { u.lock.e.eng = Math.max(0, u.lock.e.eng - 1); u.lock = null; } }

// крок часу: dt ігрових секунд, ділиться на підкроки ≤ 0,1 с
function tick(gdt) {
  if (!G || G.over || !(gdt > 0)) return;
  detect();
  const n = Math.ceil(gdt / .1);
  for (let i = 0; i < n && !G.over; i++) step(gdt / n);
}
function step(dt) {
  G.time += dt;
  if (G.phase === 'wave') {
    G.waveT += dt;
    for (const ev of G.events) if (!ev.done && ev.t <= G.waveT) { ev.done = true; spawnEnemy(ev.type, ev.dir); }
  }
  // противник
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.def.recon) {
      if (e.wps.length) { if (moveTo(e, e.wps[0].x, e.wps[0].y, e.v, dt)) { e.c = {x: e.x, y: e.y}; e.wps.shift(); } }
      else if (e.loiter > 0) {
        e.loiter -= dt; orbit(e, e.c.x, e.c.y, 6, e.v, dt);
        const s = G.sams.find(s => dist(s, e) < 22);
        if (s && !e.called && (e.spot += dt) > DIFF[G.diff].spot) {
          e.called = true; snd('warn');
          spawnEnemy(G.wave >= 5 ? 'iskander' : 'kh101', null, s);
          say(`⚠ ${e.ident ? e.def.short : 'Розвідувальний БпЛА'} навів удар на позицію ${s.d.name}! Збийте розвідника або демонтуйте ППО.`, 'warn');
        }
      } else if (moveTo(e, e.home.x, e.home.y, e.v, dt)) e.dead = true;
      continue;
    }
    if (e.def.retarget && !e.samT) { // оператор бачить ППО через камеру — перенацілює дрон
      const s = G.sams.find(s => dist(s, e) < 25);
      if (s) { e.samT = s; e.city = null; e.wps = [{x: s.x, y: s.y}]; if (e.det) say(`⚠ ${e.ident ? e.def.short : 'БпЛА'} змінив курс — атакує позицію ${s.d.name}!`, 'warn'); }
    }
    const w = e.wps[0];
    if (moveTo(e, w.x, w.y, e.v, dt)) { e.wps.shift(); if (!e.wps.length) impact(e); }
  }
  // ППО
  for (const s of G.sams) {
    const d = s.d;
    s.hot = Math.max(0, s.hot - dt);
    if (s.reload > 0) {
      if ((s.reload -= dt) <= 0) {
        for (const [k, n] of Object.entries(s.stock)) for (let i = 0; i < n && used(s.load, SAM_MSL) + SAM_MSL[k].size <= d.cap; i++) { s.load[k] = (s.load[k] || 0) + 1; s.stock[k]--; }
      }
      continue;
    }
    if (!used(s.load, SAM_MSL)) {
      dropLock(s);
      if (used(s.stock, SAM_MSL)) s.reload = d.reload;
      else if (s.auto) buySam(s, s.buyType, 99);
      continue;
    }
    s.cd -= dt;
    const range = samMaxRange(s);
    const can = e => !e.dead && e.det && (e.def.kind !== 'bal' || d.bm) && e.alt >= d.minAlt && e.alt <= d.alt && dist(s, e) <= range
      && pickMissile(s.load, SAM_MSL, dist(s, e), e.def.kind === 'bal');
    const cap = e => e.def.kind === 'bal' ? 2 : 1; // ракет на ціль одночасно
    if (s.force && (s.force.dead || !G.enemies.includes(s.force))) s.force = null;
    if (s.lock && (s.lock.e.dead || !G.enemies.includes(s.lock.e))) s.lock = null;
    if (s.lock && !can(s.lock.e)) dropLock(s);
    // ручна ціль має пріоритет над поточним захопленням
    if (s.force && can(s.force) && (!s.lock || s.lock.e !== s.force) && s.force.eng < cap(s.force)) startLock(s, s.force, s.hot ? d.relock : d.react);
    if (!s.lock && !(s.force && can(s.force))) { // ручна ціль поза зоною — поки працюємо по інших
      let best = null, bs = 1e9;
      for (const e of G.enemies) {
        if (!okFor(s, e) || e.eng >= cap(e) || !can(e)) continue;
        const score = dist(s, e) - (e.def.kind === 'bal' ? 1000 : e.def.warhead > 100 ? 300 : 0) - (e.samT === s ? 2000 : 0);
        if (score < bs) { bs = score; best = e; }
      }
      if (best) startLock(s, best, s.hot ? d.relock : d.react);
    }
    if (s.lock && (s.lock.t -= dt) <= 0 && s.cd <= 0) {
      const e = s.lock.e, dd = dist(s, e), bal = e.def.kind === 'bal', m = pickMissile(s.load, SAM_MSL, dd, bal);
      s.rot = Math.atan2(e.x - s.x, e.y - s.y);
      const pk = e.def.kind === 'drone' && d.pkDrone ? d.pkDrone : bal ? m.pkBal : m.pk;
      e.eng--; s.lock = null; // резерв переходить у ракету
      fire(s, e, m.v / 1000, pk, m.range * 1.3, `${d.name} (${m.name})`);
      s.load[m.id]--; s.cd = 3; s.hot = 300;
    }
  }
  // авіація
  for (const a of G.air) {
    const d = a.d, v = d.cruise / 3600, vd = d.dash / 3600;
    if (a.state === 'base') continue;
    if (a.state === 'service') { if ((a.svc -= dt) <= 0) { a.state = 'base'; a.fuel = maxFuel(a); serviceRearm(a); say(`${d.name} готовий до вильоту.`, 'ok'); } continue; }
    a.fuel -= dt * (a.state === 'intercept' ? 2.5 : 1); a.cd -= dt;
    if (a.state !== 'rtb' && a.fuel < dist(a, BASE) / v + 120) goHome(a, 'мінімальний залишок палива');
    if (a.lock && (a.lock.e.dead || !G.enemies.includes(a.lock.e))) a.lock = null;
    // ракета: захоплення ціллю, потім пуск
    const missile = (e, forced) => {
      if (!e || e.dead || !e.det || e.alt > d.ceil || e.def.kind === 'bal') { if (a.lock && a.lock.e === e) dropLock(a); return false; }
      const dd = dist(a, e), m = pickMissile(a.load, AAM, dd, false);
      if (!m || (!forced && !okFor(a, e))) { if (a.lock?.e === e) dropLock(a); return false; }
      if (!a.lock || a.lock.e !== e) { if (a.cd > 0 || e.eng >= 1) return false; startLock(a, e, m.lock); return false; }
      if ((a.lock.t -= dt) > 0) return false;
      e.eng--; a.lock = null;
      fire(a, e, m.v / 1000, m.pk * (e.def.kind === 'drone' ? .9 : 1), m.range * 1.3, `${d.name} (${m.name})`);
      a.load[m.id]--; a.cd = 4; return true;
    };
    const autoFire = () => {
      if (a.lock) return missile(a.lock.e, false);
      for (const e of G.enemies) if (!e.dead && e.eng < 1 && e.def.kind !== 'bal' && pickMissile(a.load, AAM, dist(a, e), false) && okFor(a, e)) { missile(e, false); break; }
      return false;
    };
    // гармата: зближення до ~1 км, ~4 с прицілювання, далі черги кожні 3 с
    const gunAt = e => {
      if (a.gun <= 0) return;
      if (dist(a, e) > (d.heli ? 1.2 : 1)) { a.aimT = 0; return; }
      a.aimT += dt;
      if (a.aimT < 4) return;
      if ((a.gunT += dt) >= 3) {
        a.gunT = 0; a.gun--; snd('gun'); emit('tracer', a.x, a.y, e.x, e.y);
        if (Math.random() < .3) { kill(e, `${d.name} (${d.gun.name})`); a.aimT = 0; }
        if (!a.gun) say(`${d.name}: снаряди скінчились.`, 'warn');
      }
    };
    if (a.state === 'move') { if (moveTo(a, a.tx, a.ty, v, dt)) a.state = 'patrol'; autoFire(); }
    else if (a.state === 'strikeOut') {
      if (moveTo(a, a.tx, a.ty, v, dt)) { applyStrike(d.power, d.name); a.state = 'rtb'; a.rtbShots = 0; }
    } else if (a.state === 'intercept') {
      const e = a.tgt;
      if (!e || e.dead || !G.enemies.includes(e)) { a.tgt = null; a.aimT = 0; a.state = 'patrol'; a.tx = a.x; a.ty = a.y; continue; }
      // на дрон повільніше — щоб не проскочити і встигнути прицілитись
      const close = dist(a, e) < 5 && e.def.kind === 'drone', sp = close ? Math.max(e.v * 1.3, Math.min(vd, 300 / 3600)) : vd;
      const p = lead(a, e, sp); moveTo(a, p.x, p.y, sp, dt);
      if (!missile(e, true) && !pickMissile(a.load, AAM, dist(a, e), false)) gunAt(e);
      if (!sum(a.load) && !a.gun) goHome(a, 'боєкомплект вичерпано');
    } else if (a.state === 'patrol') {
      const home = {x: a.tx, y: a.ty};
      if (a.gunMode && a.gun > 0 && a.filt.drone) {
        if (!a.tgt || a.tgt.dead || !G.enemies.includes(a.tgt) || dist(a.tgt, home) > 35 || !a.tgt.det) {
          a.tgt = null; a.aimT = 0; let bd = 30;
          for (const e of G.enemies) if (!e.dead && e.det && e.def.kind === 'drone' && !(e.ident && e.def.decoy) && e.v * 3600 <= d.dash && dist(e, home) < bd) { bd = dist(e, home); a.tgt = e; }
        }
      } else if (a.tgt && !G.enemies.includes(a.tgt)) a.tgt = null;
      if (a.tgt && a.gunMode && a.gun > 0) {
        const close = dist(a, a.tgt) < 5, sp = close ? Math.max(a.tgt.v * 1.3, Math.min(v, 300 / 3600)) : v;
        const p = lead(a, a.tgt, sp); moveTo(a, p.x, p.y, sp, dt); gunAt(a.tgt);
      } else orbit(a, a.tx, a.ty, d.heli ? 3 : 8, v, dt);
      autoFire();
    } else if (a.state === 'rtb') {
      if (a.rtbShots > 0 && autoFire()) a.rtbShots--;
      if (moveTo(a, BASE.x, BASE.y, v, dt)) { dropLock(a); a.state = 'service'; a.svc = 900; a.tgt = null; a.aimT = 0; say(`${d.name} приземлився: дозаправка й дозарядка.`); }
    }
  }
  // БпЛА
  for (const u of G.uavs) {
    const d = u.d;
    if (d.role === 'recon') {
      orbit(u, u.hx, u.hy, 2, d.cruise / 3600, dt);
      if ((u.fuel -= dt) <= 0) { u.gone = true; say(`${d.name} завершив політ.`); }
    } else if (d.role === 'interceptor') {
      const v = d.vmax / 3600;
      if (u.tgt && (u.tgt.dead || !G.enemies.includes(u.tgt))) { u.tgt = null; u.forced = false; }
      if (!u.tgt) {
        let bt = 1e9;
        for (const e of G.enemies) {
          if (e.dead || !e.det || e.def.kind !== 'drone' || (e.ident && e.def.decoy)) continue;
          const ip = intercept(u, e, v);
          if (ip && ip.t * v < u.fuel && ip.t < bt) { bt = ip.t; u.tgt = e; }
        }
      }
      if (u.tgt) { const p = lead(u, u.tgt, v); moveTo(u, p.x, p.y, v, dt); }
      else orbit(u, u.hx, u.hy, 1, v * .6, dt);
      u.fuel -= (u.tgt ? v : v * .6) * dt;
      if (u.tgt && dist(u, u.tgt) < .2) { u.gone = true; if (Math.random() < d.pk) kill(u.tgt, d.name); else { say(`${d.name}: промах.`); emit('burst', u.x, u.y, 5, '#9f9', 1); } }
      else if (u.fuel <= 0) { u.gone = true; say(`${d.name}: розряджено.`); }
    } else if (moveTo(u, EXIT.x, EXIT.y, d.cruise / 3600, dt)) { u.gone = true; applyStrike(d.power, d.name); }
  }
  // ракети
  for (const s of G.shots) {
    const e = s.e;
    if (e.dead) { s.dead = true; continue; }
    if (dist(s, e) <= s.v * dt + .5) {
      s.dead = true; e.eng = Math.max(0, e.eng - 1);
      if (Math.random() < s.pk) kill(e, s.name);
      else { emit('boom', s.x, s.y, .6, 5, '#9cf'); emit('burst', s.x, s.y, 5, '#9cf', 1.5); say(`${s.name}: промах по ${label(e)}.`, 'warn'); }
      continue;
    }
    s.trail.push(s.x, s.y); if (s.trail.length > 24) s.trail.splice(0, 2);
    moveTo(s, e.x, e.y, s.v, dt);
    if ((s.left -= s.v * dt) <= 0) { s.dead = true; e.eng = Math.max(0, e.eng - 1); }
  }
  G.enemies = G.enemies.filter(e => !e.dead);
  G.shots = G.shots.filter(s => !s.dead);
  G.uavs = G.uavs.filter(u => !u.gone);

  if (G.cities[0].hp <= 0 || G.cities.filter(c => c.hp <= 0).length >= 4) return endOp(false);
  if (G.phase === 'wave' && G.events.every(e => e.done) && !G.enemies.length) {
    G.phase = 'deploy';
    if (G.wave >= WAVES.length) return endOp(true);
    const bonus = 40 + G.wave * 15; G.res += bonus;
    snd('chime'); say(`Відбій тривоги. Хвиля ${G.wave} відбита. +${bonus} ⛁ на посилення.`, 'ok');
  }
}
function endOp(win) { G.over = true; G.win = win; emit('end', win); }

// ================= ЕКСПОРТ =================
// У браузері всі імена вище — глобальні. У Node (майбутній сервер) — через require('./sim.js').
// Сервер з кількома кімнатами: перед роботою з кімнатою викликає use(room.state).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    newGame, command, tick, use: g => { G = g; }, state: () => G,
    SAM, AIR, UAV, ENEMY, WAVES, DIFF, CITIES0, BASE, toXY, inObl, label,
  };
}
