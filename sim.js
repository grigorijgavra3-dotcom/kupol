// sim.js — «суддя» гри «Купол»: дані техніки, хвилі, фізика, стрільба, закупівля.
// Без DOM, карти й звуку: однаково працює в браузері (як звичайний <script>) і в Node (сервер мережевої гри).
'use strict';

// ================= РАКЕТИ ЗРК І БОЄПРИПАСИ (публічні дані; «~» — оцінки) =================
// pk — базова ймовірність ураження (літаки/КР), pkD — по дронах, pkC — по КР, pkBal — по балістиці (лише bm).
// sup — склад, з якого постачається: west (західні ракети), soviet (радянські), ammo (набої МВГ/ПЗРК).
// gun — черга з гармати/кулемета: летить миттєво, pack — скільки черг за одну покупку.
// dim — [довжина, діаметр] м (оцінки ~), для 3D/2D вигляду.
const SAM_MSL = {
 pac2b: {name:'PAC-2 (базова)', range:160, v:1700, pk:.7, pkD:.9, cost:8, size:12, sup:'west', note:'4 на ПУ, лише літаки/КР/дрони', dim:[5.3,.41]},
 pac2:  {name:'PAC-2 GEM+', range:160, v:1564, pk:.75, pkD:.9, bm:true, pkBal:.5, cost:11, size:12, sup:'west', note:'4 на ПУ, балістика обмежено', dim:[5.3,.41]},
 pac3:  {name:'PAC-3 CRI', range:70, v:1714, pk:.9, pkD:.95, bm:true, pkBal:.85, cost:18, size:3, sup:'west', note:'16 на ПУ, ~70 км'},
 mse:   {name:'PAC-3 MSE', range:120, v:1714, pk:.92, pkD:.95, bm:true, pkBal:.9, cost:24, size:4, sup:'west', note:'~12 на ПУ, ~120 км'},
 aster30:{name:'Aster 30 B1', range:120, v:1400, pk:.9, bm:true, pkBal:.75, cost:19, size:1, sup:'west', note:'~120 км, ~4,5 М'},
 aster30nt:{name:'Aster 30 B1NT', range:150, v:1500, pk:.92, bm:true, pkBal:.88, cost:26, size:1, sup:'west', note:'~150 км, нова ГСН проти БР'},
 v55k:  {name:'5В55К', range:47, v:1700, pk:.65, cost:4, sup:'soviet', note:'~47 км'},
 v55r:  {name:'5В55Р', range:75, v:1700, pk:.7, cost:5, sup:'soviet', note:'~75 км'},
 n6:    {name:'48Н6', range:150, v:2000, pk:.75, bm:true, pkBal:.55, cost:7, sup:'soviet', note:'150 км, ПРО'},
 v21:   {name:'5В21', range:160, v:900, pk:.55, pkD:.45, cost:3, sup:'soviet', note:'~160 км'},
 v28:   {name:'5В28', range:300, v:1200, pk:.6, pkD:.45, cost:5, sup:'soviet', note:'до 300 км (С-200Д)'},
 irisSL:{name:'IRIS-T SL', range:40, v:1000, pk:.9, cost:8, sup:'west', note:'40 км'},
 m38:   {name:'9М38', range:30, v:850, pk:.7, cost:3, sup:'soviet', note:'~30 км'},
 m38m1: {name:'9М38М1', range:35, v:850, pk:.75, cost:4, sup:'soviet', note:'~35 км'},
 aim9x: {name:'AIM-9X', range:10, v:900, pk:.8, cost:3, sup:'west', note:'~10 км, ІЧ'},
 amr:   {name:'AIM-120C', range:30, v:1200, pk:.85, cost:6, sup:'west', note:'~30 км'},
 amrer: {name:'AMRAAM-ER', range:50, v:1300, pk:.85, cost:9, sup:'west', note:'~50 км'},
 m23a:  {name:'MIM-23A', range:25, v:750, pk:.55, cost:3, sup:'west', note:'~25 км'},
 m23b:  {name:'MIM-23B', range:40, v:800, pk:.65, cost:4, sup:'west', note:'~40 км'},
 v27:   {name:'5В27Д', range:25, v:700, pk:.6, cost:2, sup:'soviet', note:'~25 км'},
 vt1:   {name:'VT1', range:11, v:1250, pk:.75, cost:3, sup:'west', note:'~11 км, ~3,5 М'},
 asp1:  {name:'Aspide Mk1', range:15, v:1350, pk:.7, cost:3, sup:'west', note:'~15 км'},
 asp2:  {name:'Aspide 2000', range:25, v:1350, pk:.75, cost:4, sup:'west', note:'~25 км'},
 // мобільні вогневі групи та зенітні гармати
 mg127: {name:'12,7 мм (кулемет)', range:1.5, v:850, pk:.05, pkD:.07, pkC:.02, cost:1, pack:10, gun:true, sup:'ammo', note:'черга ДШК/M2, ~1,5 км', dim:[.138,.0127]},
 zu23:  {name:'23 мм ЗУ-23-2', range:2.5, v:970, pk:.08, pkD:.12, pkC:.04, cost:1, pack:6, gun:true, sup:'ammo', note:'черга, ~2,5 км', dim:[.2,.023]},
 manpads:{name:'ПЗРК Igla / Stinger', range:5, v:650, pk:.45, pkD:.45, pkC:.3, cost:3, size:4, sup:'ammo', note:'~5 км, ІЧ', dim:[1.57,.072]},
 g35:   {name:'35 мм Gepard', range:4, v:1175, pk:.3, pkD:.4, pkC:.2, cost:1, pack:4, gun:true, sup:'ammo', note:'черга з радарним наведенням, ~4 км', dim:[.387,.035]},
};
const SAM_DIM = {pac3:[5.2,.255], mse:[5.2,.29], aster30:[4.9,.18], aster30nt:[4.9,.18], v55k:[7.25,.51], v55r:[7.25,.51], n6:[7.5,.51], v21:[10.8,.86], v28:[10.7,.86], irisSL:[3,.127], m38:[5.55,.4], m38m1:[5.55,.4],
  aim9x:[3.02,.13], amr:[3.65,.18], amrer:[4.3,.25], m23a:[5.03,.37], m23b:[5.03,.37], v27:[5.95,.55], vt1:[2.29,.165], asp1:[3.7,.2], asp2:[3.7,.2]};
for (const [id, m] of Object.entries(SAM_MSL)) { m.id = id; m.tbl = 'sam'; m.size ||= 1; m.dim ||= SAM_DIM[id]; }
const balText = m => m.bm ? (m.pkBal >= .8 ? `так (~${Math.round(m.pkBal * 100)}%)` : `обмежено (~${Math.round(m.pkBal * 100)}%)`) : 'ні';

// ППО. react — час реакції (перше захоплення), relock — наступні цілі в бойовому режимі, с (оцінки ~).
// mobile — може переїжджати (speed км/год), за переїзд платиться 1 ⛁ пального.
const SAM = [
 {id:'patriot',limit:2,name:'Patriot MIM-104',country:'США',alt:24,minAlt:.06,cap:48,det:150,reload:900,react:9,relock:3,bm:true,cost:60,msl:['pac2b','pac2','pac3','mse'],
  info:[['Клас','велика дальність'],['Дальність','160 км'],['Висота','~24 км'],['Ракети','PAC-3: 1714 м/с, PAC-2 GEM+: 1564 м/с'],['ПУ','16 PAC-3 або 4 PAC-2'],['Балістика','PAC-3 CRI і MSE — так; PAC-2 GEM+ — обмежено; базова PAC-2 — ні']]},
 {id:'sampt',limit:1,name:'SAMP/T «Mamba»',country:'Франція/Італія',alt:20,minAlt:.05,cap:8,det:150,reload:900,react:8,relock:3,bm:true,cost:55,msl:['aster30','aster30nt'],
  info:[['Клас','велика дальність'],['Дальність','~120 км (B1NT ~150)'],['Висота','~20 км'],['Ракета','Aster 30, ~1400 м/с'],['ПУ','8 ракет'],['Радар','Arabel, ~100–150 км'],['Балістика','так (B1NT — краще)']]},
 {id:'s300',name:'С-300ПМУ',country:'СРСР',alt:27,minAlt:.025,cap:4,det:300,reload:900,react:10,relock:3,bm:true,cost:26,msl:['v55k','v55r','n6'],
  info:[['Клас','середня/велика дальність'],['Дальність','150–300 км'],['Висота','27 км'],['Ракета','до 2000 м/с'],['ПУ','~4 ракети'],['ПРО','так (48Н6)']]},
 {id:'s200',name:'С-200',country:'СРСР',alt:40,minAlt:.3,cap:1,det:400,reload:900,react:60,relock:20,cost:18,msl:['v21','v28'],
  info:[['Клас','велика дальність'],['Дальність','до 300 км'],['Висота','40 км'],['Ракета','700–1200 м/с'],['ПУ','1 ракета'],['Мін. висота','~0,3 км (не бачить КР)']]},
 {id:'iris',limit:3,name:'IRIS-T SLM',country:'Німеччина',alt:25,minAlt:.02,cap:8,det:250,reload:600,react:6,relock:2,cost:35,msl:['irisSL'],
  info:[['Клас','середня дальність'],['Дальність','40 км'],['Висота','25 км'],['Ракета','~1000 м/с (~3 М)'],['ПУ','8 ракет'],['Радар','~250 км (TRML-4D)']]},
 {id:'buk',name:'Бук-М1 ★',country:'СРСР',alt:22,minAlt:.015,cap:4,det:160,reload:600,react:22,relock:4,cost:18,msl:['m38','m38m1'],
  info:[['Клас','середня дальність'],['Дальність','~35 км'],['Висота','~22 км'],['Ракета','~850 м/с'],['ПУ','4 ракети'],['Радар','~160 км']]},
 {id:'nasams',limit:2,name:'NASAMS ★',country:'Норвегія/США',alt:15,minAlt:.03,cap:6,det:75,reload:600,react:5,relock:2,cost:30,msl:['aim9x','amr','amrer'],
  info:[['Клас','середня дальність'],['Дальність','~30–50 км (від ракети)'],['Висота','~15 км'],['ПУ','6 ракет'],['Радар','~75 км']]},
 {id:'hawk',limit:3,name:'MIM-23 HAWK',country:'США',alt:18,minAlt:.06,cap:3,det:100,reload:600,react:15,relock:5,cost:18,msl:['m23a','m23b'],
  info:[['Клас','середня дальність'],['Дальність','~40 км'],['Висота','~18 км'],['Ракета','~800 м/с'],['ПУ','3 ракети']]},
 {id:'s125',name:'С-125М',country:'СРСР',alt:20,minAlt:.02,cap:4,det:110,reload:600,react:26,relock:6,cost:9,msl:['v27'],
  info:[['Клас','мала дальність'],['Дальність','12 км (С-125), до 40 км (модерн.)'],['Висота','20–25 км'],['Ракета','~700 м/с'],['ПУ','4 ракети']]},
 {id:'crotale',limit:2,name:'Crotale NG',country:'Франція',alt:6,minAlt:.015,cap:8,det:20,reload:500,react:6,relock:2,cost:12,msl:['vt1'],
  info:[['Клас','мала дальність'],['Дальність','~11 км'],['Висота','~6 км'],['Ракета','~1250 м/с'],['ПУ','~8 ракет']]},
 {id:'aspide',limit:2,name:'Skyguard Aspide',country:'Швейцарія/Італія',alt:5,minAlt:.015,cap:4,det:20,reload:500,react:8,relock:3,cost:12,msl:['asp1','asp2'],
  info:[['Клас','мала–середня'],['Дальність','~15–25 км'],['Висота','~5 км'],['Ракета','~1350 м/с (~4 М)'],['ПУ','~4 ракети']]},
 {id:'gepard',limit:4,name:'Gepard',country:'Німеччина',alt:3,minAlt:0,cap:24,det:15,reload:300,react:4,relock:2,cost:18,msl:['g35'],mobile:true,speed:50,gunCd:4,
  info:[['Клас','зенітна самохідна установка'],['Озброєння','2×35 мм, ~550 постр./хв кожна'],['Дальність','~4 км'],['Висота','~3 км'],['Радар','~15 км'],['У грі','дуже добре по Shahed, мобільна']]},
 {id:'mvg',name:'Мобільна вогнева група',country:'Україна',alt:1.5,minAlt:0,cap:40,det:6,reload:120,react:4,relock:2,cost:4,msl:['mg127','zu23','manpads'],mobile:true,speed:70,gunCd:6,
  info:[['Клас','МВГ на пікапі'],['Озброєння','кулемет 12,7 мм / ЗУ-23-2 / ПЗРК'],['Дальність','1,5–5 км'],['Висота','до ~1,5 км'],['Виявлення','акустика, прожектор, ~6 км'],['У грі','дешева, але шанс збиття малий; мобільна']]},
];
SAM.forEach(d => d.info.push(['Час реакції', `~${d.react} с (наступна ціль ~${d.relock} с)`]));
const samRange = d => Math.max(...d.msl.map(k => SAM_MSL[k].range));

// ================= РАКЕТИ «ПОВІТРЯ-ПОВІТРЯ» (lock — час захоплення, с) =================
const AAM = {
 r60:  {name:'Р-60', range:8, v:900, pk:.7, cost:1, lock:3, sup:'soviet', note:'~8 км, ІЧ'},
 r73:  {name:'Р-73', range:30, v:850, pk:.8, cost:2, lock:3, sup:'soviet', note:'~30 км, ІЧ'},
 r27r: {name:'Р-27Р', range:60, v:1300, pk:.7, cost:3, lock:6, sup:'soviet', note:'~60 км, радіо'},
 r27t: {name:'Р-27Т', range:70, v:1300, pk:.72, cost:3, lock:4, sup:'soviet', note:'~70 км, ІЧ'},
 r27er:{name:'Р-27ЕР', range:95, v:1300, pk:.75, cost:4, lock:6, sup:'soviet', note:'до 95 км'},
 aim9m:{name:'AIM-9M', range:18, v:900, pk:.8, cost:3, lock:3, sup:'west', note:'~18 км, ІЧ'},
 aim9x:{name:'AIM-9X', range:35, v:900, pk:.85, cost:4, lock:2, sup:'west', note:'~35 км, ІЧ'},
 aim120:{name:'AIM-120C', range:70, v:1200, pk:.85, cost:8, lock:4, sup:'west', note:'~70 км, АРГСН'},
 apkws:{name:'APKWS II', range:5, v:1000, pk:.4, pkD:.85, pkC:.35, cost:2, lock:2, sup:'west', note:'~5 км, лазерна 70 мм, дешева проти дронів'},
 mica: {name:'MICA', range:60, v:1100, pk:.85, cost:7, lock:4, sup:'west', note:'~60 км'},
 magic:{name:'Magic II', range:15, v:900, pk:.75, cost:3, lock:3, sup:'west', note:'~15 км, ІЧ'},
 irist:{name:'IRIS-T', range:25, v:1000, pk:.9, cost:6, lock:2, sup:'west', note:'~25 км, ІЧ'},
 meteor:{name:'Meteor', range:150, v:1300, pk:.9, cost:15, lock:5, sup:'west', note:'>100 км, ПРД'},
 igla: {name:'Ігла', range:5, v:570, pk:.6, cost:1, lock:4, sup:'soviet', note:'~5 км, ПЗРК'},
};
for (const [id, m] of Object.entries(AAM)) { m.id = id; m.tbl = 'aam'; m.pkD ??= +(m.pk * .9).toFixed(2); }

// Авіація. fuel — внутрішнє паливо, с польоту (оцінки ~). ptb — макс. підвісних баків (кожен −slot ракет, +ptbK палива).
// gun.pk — шанс збити дрон однією чергою.
const AIR = [
 {id:'mig29',name:'МіГ-29',role:'fighter',country:'СРСР',vmax:2450,cruise:900,dash:1500,ceil:18,span:11.36,len:17.32,count:3,radar:70,msl:6,aam:['r27r','r27t','r27er','r73','r60'],gun:{name:'ГШ-301',rounds:150,bursts:5,pk:.3},fuel:5400,ptb:2,cost:30,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','2450 км/год (біля землі 1500)'],['Крейсерська','~900 км/год'],['Бойовий радіус','700 км'],['Стеля','18 км'],['Розмах / довжина','11,36 / 17,32 м']]},
 {id:'su27',name:'Су-27',role:'fighter',country:'СРСР',vmax:2500,cruise:900,dash:1400,ceil:18.5,span:14.7,len:21.9,count:2,radar:100,msl:8,aam:['r27r','r27t','r27er','r73'],gun:{name:'ГШ-301',rounds:150,bursts:5,pk:.3},fuel:10800,ptb:0,cost:40,
  info:[['Роль','винищувач-перехоплювач'],['Макс. швидкість','2500 км/год (біля землі 1400)'],['Крейсерська','~900 км/год'],['Бойовий радіус','1500 км'],['Стеля','18,5 км'],['Розмах / довжина','14,7 / 21,9 м'],['ПТБ','не використовує (великий внутрішній запас)']]},
 {id:'f16',svc:1.6,name:'F-16',role:'fighter',country:'США',vmax:2120,cruise:900,dash:1470,ceil:15.2,span:9.96,len:15.06,count:1,radar:110,msl:6,aam:['aim120','aim9x','aim9m','apkws'],gun:{name:'M61A1',rounds:511,bursts:5,pk:.35},fuel:7200,ptb:2,cost:110,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','~2120 км/год (2 М; біля землі ~1470)'],['Крейсерська','~900 км/год'],['Бойовий радіус','550 км'],['Стеля','~15,2 км'],['Розмах / довжина','9,96 / 15,06 м'],['Проти дронів','APKWS II — дешеві лазерні ракети']]},
 {id:'m2000',svc:1.6,name:'Mirage 2000',role:'fighter',country:'Франція',vmax:2340,cruise:900,dash:1470,ceil:17,span:9.13,len:14.36,count:1,radar:100,msl:6,aam:['mica','magic'],gun:{name:'2×DEFA 554',rounds:250,bursts:5,pk:.3},fuel:7200,ptb:2,cost:85,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','2340 км/год (2,2 М)'],['Крейсерська','~900 км/год'],['Бойовий радіус','1550 км'],['Стеля','~17 км'],['Розмах / довжина','9,13 / 14,36 м']]},
 {id:'gripen',svc:1.6,name:'JAS 39 Gripen',role:'fighter',country:'Швеція',vmax:2200,cruise:900,dash:1400,ceil:15.24,span:8.4,len:14.1,count:1,radar:120,msl:6,aam:['meteor','aim120','irist'],gun:{name:'BK-27',rounds:120,bursts:4,pk:.3},fuel:7200,ptb:2,cost:95,
  info:[['Роль','багатоцільовий винищувач'],['Макс. швидкість','~2200 км/год (2 М)'],['Крейсерська','~900 км/год'],['Бойовий радіус','~800 км'],['Стеля','~15,2 км'],['Розмах / довжина','~8,4 / ~14,1 м']]},
 {id:'asc890',name:'Saab 340 AEW (ASC 890)',role:'awacs',country:'Швеція',vmax:528,cruise:480,dash:500,ceil:7.6,span:21.44,len:19.73,count:1,radar:350,msl:0,aam:[],fuel:18000,ptb:0,cost:90,
  info:[['Роль','літак ДРЛО (радіолокаційний дозор)'],['Радар','Erieye, ~350 км'],['Швидкість','~528 км/год'],['Тривалість','~5 год'],['Стеля','~7,6 км'],['Розмах / довжина','21,44 / 19,73 м'],['У грі','бачить низьколетючі КР далеко за радіогоризонтом наземних РЛС']]},
 {id:'su24',name:'Су-24М',role:'strike',country:'СРСР',vmax:1654,cruise:870,dash:1315,ceil:11,span:17.64,len:22.67,count:2,radar:0,msl:0,aam:[],fuel:7200,ptb:2,cost:40,power:.3,pSucc:.7,
  info:[['Роль','фронтовий бомбардувальник'],['Макс. швидкість','1654 км/год на висоті, 1315 біля землі'],['Бойовий радіус','~560 км'],['Стеля','11 км'],['Розмах / довжина','17,64 (16°) / 22,67 м'],['Озброєння','Storm Shadow / SCALP, ~250 км'],['У грі','удар по пускових → менше цілей']]},
 {id:'su25',name:'Су-25',role:'hunter',country:'СРСР',vmax:950,cruise:750,dash:900,ceil:7,span:14.36,len:15.36,count:2,radar:10,msl:2,aam:['r60'],gun:{name:'ГШ-30-2',rounds:250,bursts:10,pk:.35},fuel:5400,ptb:2,cost:20,
  info:[['Роль','штурмовик'],['Макс. швидкість','~950 км/год'],['Крейсерська','~750 км/год'],['Бойовий радіус','~750 км'],['Стеля','7 км'],['Розмах / довжина','14,36 / 15,36 м']]},
 {id:'l39',name:'L-39 «Альбатрос»',role:'hunter',country:'Чехословаччина',vmax:750,cruise:600,dash:700,ceil:11,span:9.46,len:12.13,count:2,radar:8,msl:2,aam:['r60'],gun:{name:'ГШ-23',rounds:150,bursts:8,pk:.3},fuel:9000,ptb:0,cost:15,
  info:[['Роль','навчально-бойовий'],['Макс. швидкість','750 км/год'],['Крейсерська','~600 км/год'],['Дальність','1100 км'],['Стеля','~11 км'],['Розмах / довжина','~9,46 / ~12,13 м'],['ПТБ','кінцеві баки вже на крилі']]},
 {id:'yak52',name:'Як-52',role:'hunter',country:'СРСР/Румунія',vmax:285,cruise:190,dash:270,ceil:4,span:9.3,len:7.75,count:3,radar:5,msl:0,aam:[],gun:{name:'стрілець у задній кабіні',rounds:300,bursts:14,pk:.22},fuel:9000,ptb:0,cost:8,
  info:[['Роль','навчальний, «мисливець» на розвідувальні дрони'],['Макс. швидкість','~285 км/год'],['Крейсерська','~190 км/год'],['Дальність','~550 км'],['Стеля','~4 км'],['Розмах / довжина','~9,3 / ~7,75 м'],['У грі','дешевий, але повільний і шанс влучити малий']]},
 {id:'mi24',name:'Мі-24',role:'hunter',heli:true,country:'СРСР',vmax:335,cruise:270,dash:320,ceil:4.5,span:17.3,len:17.5,count:2,radar:8,msl:2,aam:['igla'],gun:{name:'ЯкБ-12,7',rounds:1470,bursts:20,pk:.35},fuel:7200,ptb:2,cost:20,
  info:[['Роль','ударний гелікоптер'],['Макс. швидкість','~335 км/год'],['Крейсерська','~270 км/год'],['Дальність','~450 км'],['Стеля','~4,5 км'],['Гвинт / довжина','~17,3 / ~17,5 м']]},
 {id:'mi8',name:'Мі-8',role:'hunter',heli:true,country:'СРСР',vmax:250,cruise:225,dash:250,ceil:4.2,span:21.3,len:18.3,count:3,radar:6,msl:0,aam:[],gun:{name:'кулемети ПКТ',rounds:2000,bursts:24,pk:.3},fuel:9000,ptb:2,cost:15,
  info:[['Роль','багатоцільовий вертоліт'],['Макс. швидкість','~250–270 км/год'],['Крейсерська','~225 км/год'],['Дальність','~425–715 км'],['Стеля','~4,2 км'],['Гвинт / фюзеляж','~21,3 / ~18,3 м']]},
];
AIR.forEach(d => { d.ptbK = d.heli ? .25 : .3; d.ptbSlot = d.heli ? 1 : 2; d.info.push(['Паливо', `~${(d.fuel / 3600).toFixed(1)} год польоту${d.ptb ? `, до ${d.ptb} ПТБ (+${d.ptbK * 100}% кожен, −${d.ptbSlot} ракети)` : ''}`]); });

// БпЛА. pSucc/power — для ударів по пускових: шанс прорватися і частка зірваних пусків.
const UAV = [
 {id:'tb2',name:'Bayraktar TB2',role:'recon',span:12,len:6.5,vmax:220,cruise:130,endur:27,sensor:25,cost:25,
  info:[['Роль','ударно-розвідувальний'],['Розмах / довжина','~12 / ~6,5 м'],['Швидкість','~220 (крейс. ~130) км/год'],['Радіус','~150 км'],['Тривалість','~27 год'],['Навантаження','~150 кг']]},
 {id:'shark',name:'Shark (Ukrspecsystems)',role:'recon',span:3.4,len:1.95,vmax:150,cruise:90,endur:7,sensor:20,cost:10,
  info:[['Роль','розвідка, коригування'],['Розмах / довжина','~3,4 / ~2 м'],['Швидкість','~150 (крейс. ~90) км/год'],['Радіус','~60 км'],['Тривалість','~7 год']]},
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
 {id:'sting',name:'Sting (Wild Hornets)',role:'interceptor',span:.35,len:.35,vmax:315,range:25,pk:.7,cost:3,
  info:[['Роль','дрон-перехоплювач'],['Швидкість','до ~315 км/год'],['Дальність','~25 км'],['Схема','«куля»-квадрокоптер'],['Тактика','швидший за Shahed — наздоганяє']]},
 {id:'pysyun',name:'«Пісюн»',role:'interceptor',span:.5,len:.65,vmax:280,range:20,pk:.65,cost:2,
  info:[['Роль','дешевий дрон-перехоплювач'],['Швидкість','~280 км/год (умовно)'],['Дальність','~20 км (умовно)'],['Схема','кулеподібний корпус'],['У грі','дешевий і швидкий, трохи гірша точність']]},
 {id:'darts',name:'Darts',role:'kamikaze',span:1.5,len:1.2,vmax:160,cruise:140,power:.05,pSucc:.25,cost:4,
  info:[['Роль','дрон-камікадзе (середня дальність)'],['Швидкість','160 км/год'],['Дальність','40–50 км'],['БЧ','4 кг'],['У грі','малий шанс дістати пускову']]},
 {id:'lutyi',name:'Ан-196 «Лютий»',role:'kamikaze',span:6.7,len:4.2,vmax:200,cruise:170,power:.2,pSucc:.55,cost:20,
  info:[['Роль','далекобійний камікадзе'],['Розмах / довжина','~6,7 / ~4,2 м'],['Швидкість','~200 км/год'],['Дальність','~1000 км'],['БЧ','~75 кг']]},
 {id:'bober',name:'«Бобер»',role:'kamikaze',span:2.5,len:2.5,vmax:150,cruise:140,power:.12,pSucc:.45,cost:10,
  info:[['Роль','далекобійний камікадзе'],['Розмах / довжина','~2,5 / ~2,5 м'],['Швидкість','~150 км/год'],['Дальність','~1000 км'],['БЧ','~20 кг'],['Схема','~«качка»']]},
 {id:'fp1',name:'FP-1',role:'kamikaze',span:6,len:4,vmax:160,cruise:150,power:.22,pSucc:.6,cost:20,
  info:[['Роль','далекобійний ударний'],['Розмах / довжина','~6 / ~4 м'],['Швидкість','~160 км/год'],['Дальність','~1600 км'],['Навантаження','~60–120 кг'],['Старт','з рампи, ракетний прискорювач']]},
];

// РЛС (публічні оцінки «~»). det — дальність, км; ant — висота антени, м (щогла/вежа: що вище, то раніше видно низьколетючі КР);
// small — частка дальності по малих дронах; cue — множник часу захоплення для ППО, яким РЛС дає цілевказівку (у радіусі 100 км).
const RADAR = [
 {id:'p18',name:'П-18 «Терек»',country:'СРСР/Україна',det:250,ant:12,small:.5,cue:.75,cost:10,speed:40,
  info:[['Тип','РЛС кругового огляду метрового діапазону'],['Дальність','~250 км'],['Антена','~12 м (на шасі)'],['Малі дрони','бачить гірше (~½ дальності)'],['У грі','дешева й далекоглядна, але КР біля землі помічає пізно']]},
 {id:'st68',name:'36Д6-М',country:'Україна',det:180,ant:30,small:.7,cue:.6,cost:22,speed:30,
  info:[['Тип','3D РЛС («Іскра», Запоріжжя)'],['Дальність','~180 км'],['Антена','на щоглі ~30 м'],['У грі','найкраще бачить крилаті ракети біля землі']]},
 {id:'k80',name:'80К6М',country:'Україна',det:220,ant:15,small:.7,cue:.55,cost:26,speed:50,
  info:[['Тип','3D РЛС кругового огляду («Іскра»)'],['Дальність','~220 км'],['Шасі','КрАЗ, розгортання ~5 хв'],['У грі','універсальна']]},
 {id:'sentinel',name:'AN/MPQ-64 Sentinel',country:'США',det:75,ant:5,small:.9,cue:.45,cost:12,speed:60,
  info:[['Тип','3D РЛС X-діапазону (для NASAMS)'],['Дальність','~75 км'],['У грі','найшвидша цілевказівка для ППО малої й середньої дальності']]},
 {id:'trml',name:'TRML-4D',country:'Німеччина',det:250,ant:12,small:.95,cue:.5,cost:30,speed:60,
  info:[['Тип','AESA 3D РЛС (Hensoldt), радар IRIS-T SLM'],['Дальність','~250 км'],['У грі','найкраще бачить малі дрони, швидка цілевказівка']]},
];
RADAR.forEach(d => { d.mobile = true; d.info.push(['Цілевказівка', `ППО в радіусі 100 км захоплює ціль у ${Math.round(1 / d.cue * 10) / 10} раза швидше`], ['Розгортання', `${d.cost} ⛁, переїзд 1 ⛁`]); });
const LINK_KM = 100, NO_RADAR_K = 1.25; // без РЛС комплекс шукає ціль сам — захоплення на 25% довше

// Противник (публічні оцінки, все «~»). vr — розкид швидкості км/год. w — частка серед дальніх пусків, % (усереднено за рік).
// pkr — протикорабельна/надзвукова (для оповіщення «високий рівень небезпеки»).
const ENEMY = {
 shahed:{name:'Shahed-136 («Герань-2»)',short:'Герань-2',kind:'drone',vr:[150,185],warhead:50,alt:[.1,2],reward:3,w:40,
  info:[['Тип','ударний дрон-камікадзе'],['Розмах / довжина','~2,5 / ~3,5 м'],['Швидкість','~150–185 км/год'],['БЧ','~50 кг'],['Висота','~0,1–2 км'],['Двигун','поршневий, штовхальний гвинт']]},
 garpiya:{name:'«Гарпія-А1»',short:'Гарпія-А1',kind:'drone',model:'shahed',vr:[150,190],warhead:50,alt:[.1,2],reward:3,w:6,
  info:[['Тип','ударний дрон-камікадзе (російське виробництво)'],['Схема','як Shahed-136'],['Швидкість','~150–190 км/год'],['БЧ','~50 кг']]},
 shahedMS:{name:'«Герань-2» з mesh-модемом',short:'Герань-2 (керований)',kind:'drone',model:'shahed',retarget:true,vr:[150,185],warhead:50,alt:[.1,2],reward:5,w:3.5,
  info:[['Тип','ударний дрон з камерою і модемом'],['Швидкість','~150–185 км/год'],['БЧ','~50 кг'],['Особливість','оператор перенацілює в польоті'],['У грі','помітивши ППО ближче 25 км — атакує її']]},
 gerbera:{name:'«Гербера» (імітатор)',short:'Гербера-імітатор',kind:'drone',decoy:true,vr:[120,160],warhead:0,alt:[.1,2],reward:1,w:12.5,
  info:[['Тип','дрон-імітатор із пінопласту й фанери'],['Розмах / довжина','~2,4 / ~2,2 м'],['Швидкість','~120–160 км/год'],['БЧ','немає'],['На радарі','як Shahed']]},
 gerbera2:{name:'«Гербера-2»',short:'Гербера-2',kind:'drone',model:'gerbera',decoy:true,vr:[130,170],warhead:0,alt:[.2,2.5],reward:1,w:4,
  info:[['Тип','імітатор нового зразка'],['Швидкість','~130–170 км/год'],['БЧ','немає'],['Особливість','літає вище й довше']]},
 gerberaW:{name:'«Гербера» з БЧ',short:'Гербера з БЧ',kind:'drone',model:'gerbera',vr:[120,160],warhead:10,alt:[.1,2],reward:2,w:4,
  info:[['Тип','імітатор з малою бойовою частиною'],['Швидкість','~120–160 км/год'],['БЧ','~5–10 кг'],['На радарі','як Shahed']]},
 parodiya:{name:'«Пародія»',short:'Пародія (імітатор)',kind:'drone',decoy:true,vr:[120,150],warhead:0,alt:[.2,1.5],reward:1,w:7,
  info:[['Тип','дешевий дрон-імітатор'],['Розмах / довжина','~2 / ~2,5 м'],['Швидкість','~120–150 км/год'],['БЧ','немає'],['На радарі','як Shahed']]},
 italmas:{name:'«Італмас»',short:'Італмас',kind:'drone',vr:[150,200],warhead:30,alt:[.2,1.5],reward:3,w:5.5,
  info:[['Тип','дрон-камікадзе / розвідник'],['Розмах / довжина','~3 / ~2,5 м'],['Швидкість','~150–200 км/год'],['БЧ','~5–35 кг'],['Двигун','поршневий']]},
 geran3:{name:'Shahed-238 («Герань-3»)',short:'Герань-3',kind:'drone',vr:[500,600],warhead:50,alt:[1,3],reward:6,w:6,
  info:[['Тип','реактивний ударний дрон'],['Розмах / довжина','~2,5 / ~3,2 м'],['Швидкість','~500–600 км/год'],['БЧ','~50 кг'],['Висота','~1–3 км']]},
 geran4:{name:'«Герань-4»',short:'Герань-4',kind:'drone',model:'geran3',vr:[550,700],warhead:90,alt:[.5,4],reward:7,w:3.5,
  info:[['Тип','реактивний ударний дрон'],['Швидкість','~550–700 км/год'],['БЧ','~90 кг'],['Висота','~0,5–4 км']]},
 geran5:{name:'«Герань-5» (К5-К)',short:'Герань-5',kind:'drone',vr:[600,750],warhead:90,alt:[.5,6],reward:9,w:3,
  info:[['Тип','реактивний дрон, схожий на малу крилату ракету'],['Розмах / довжина','~5,5 / ~6 м'],['Швидкість','~600–750 км/год'],['БЧ','~90 кг'],['Висота','~0,5–6 км']]},
 banderol:{name:'«Бандероль»',short:'Бандероль',kind:'drone',vr:[350,450],warhead:25,alt:[.1,1],reward:5,w:.6,
  info:[['Тип','реактивний міні-боєприпас (мала КР)'],['Швидкість','~350–450 км/год'],['БЧ','~20–30 кг'],['Носій','БпЛА / літак']]},
 klin:{name:'«Клин»',short:'Клин',kind:'drone',model:'banderol',vr:[400,500],warhead:20,alt:[.1,1.5],reward:5,w:.4,
  info:[['Тип','реактивний міні-боєприпас'],['Швидкість','~400–500 км/год (оцінка)'],['БЧ','~20 кг (оцінка)']]},
 filin:{name:'«Філін»',short:'Філін',kind:'drone',model:'banderol',vr:[400,500],warhead:20,alt:[.1,1.5],reward:5,w:.5,
  info:[['Тип','реактивний міні-боєприпас'],['Швидкість','~400–500 км/год (оцінка)'],['БЧ','~20 кг (оцінка)']]},
 orlan:{name:'Орлан-10',short:'Орлан-10',kind:'drone',recon:true,vr:[90,150],warhead:0,alt:[1,3],reward:5,
  info:[['Тип','розвідувальний БпЛА'],['Розмах / довжина','~3,1 / ~1,8 м'],['Швидкість','~90–150 км/год'],['Тривалість','до ~16 год'],['У грі','наводить удари на ваші ППО']]},
 zala:{name:'ZALA 421-16Е',short:'ZALA 421-16Е',kind:'drone',recon:true,vr:[65,110],warhead:0,alt:[.8,2.5],reward:5,
  info:[['Тип','розвідувальний БпЛА'],['Схема','літаюче крило'],['Розмах','~1,8 м'],['Швидкість','~65–110 км/год'],['У грі','наводить удари на ваші ППО']]},
 supercam:{name:'Supercam S350',short:'Supercam S350',kind:'drone',recon:true,vr:[65,120],warhead:0,alt:[.5,2.5],reward:5,
  info:[['Тип','розвідувальний БпЛА'],['Розмах / довжина','~3,2 / ~1,4 м'],['Швидкість','~65–120 км/год'],['Тривалість','~4 год'],['У грі','наводить удари на ваші ППО']]},
 gerberaR:{name:'«Гербера»-розвідник',short:'Гербера-розвідник',kind:'drone',model:'gerbera',recon:true,vr:[120,160],warhead:0,alt:[.5,2],reward:4,
  info:[['Тип','імітатор з камерою і модемом'],['Швидкість','~120–160 км/год'],['У грі','шукає ваші ППО і наводить удар']]},
 forpost:{name:'«Форпост-Р»',short:'Форпост-Р',kind:'drone',recon:true,vr:[120,200],warhead:0,alt:[2,5],reward:8,
  info:[['Тип','розвідувально-ударний БпЛА'],['Розмах / довжина','~8,5 / ~5,9 м'],['Швидкість','~120–200 км/год'],['Тривалість','~18 год'],['Схема','двобалкова, штовхальний гвинт']]},
 orion:{name:'«Оріон» («Іноходець»)',short:'Оріон',kind:'drone',recon:true,vr:[120,200],warhead:0,alt:[3,6],reward:10,
  info:[['Тип','розвідувально-ударний БпЛА'],['Розмах / довжина','~16,3 / ~8,1 м'],['Швидкість','~120–200 км/год'],['Тривалість','~24 год'],['Навантаження','~200 кг']]},
 // ракети (~3–4% дальніх пусків)
 iskander:{name:'Іскандер-М (9М723)',short:'Іскандер-М',kind:'bal',vr:[6000,6000],warhead:480,alt:[15,15],reward:15,dirs:['N','NE','E'],w:.9,
  info:[['Тип','балістична ракета'],['Довжина','~7,3 м'],['Швидкість','~6 М'],['БЧ','~480 кг'],['Збивають','Patriot, SAMP/T, С-300 (48Н6)']]},
 kn23:{name:'KN-23 (Hwasong-11, КНДР)',short:'KN-23',kind:'bal',model:'iskander',vr:[6200,7000],warhead:500,alt:[15,15],reward:16,dirs:['N','NE','E'],w:.4,korea:true,
  info:[['Тип','північнокорейська балістична ракета'],['Довжина','~7,5 м'],['Швидкість','~6–7 М'],['БЧ','~500 кг'],['Точність','гірша за Іскандер'],['Збивають','Patriot, SAMP/T, С-300 (48Н6)']]},
 s300g:{name:'С-300/С-400 по наземних цілях',short:'С-300 (по землі)',kind:'bal',model:'iskander',vr:[4000,6000],warhead:145,alt:[12,12],reward:8,dirs:['N','NE'],w:.5,
  info:[['Тип','зенітна ракета 48Н6 у режимі «земля–земля»'],['Швидкість','до ~6 М'],['БЧ','~145 кг'],['Особливість','майже без попередження']]},
 kh101:{name:'Х-101',short:'Х-101',kind:'cruise',vr:[700,750],warhead:400,alt:[.03,.08],reward:10,w:.7,
  info:[['Тип','крилата ракета'],['Довжина','~7,45 м'],['Швидкість','~720 (макс. ~970) км/год'],['БЧ','~400 кг'],['Висота','~30–80 м — нижче радіогоризонту']]},
 kh555:{name:'Х-555',short:'Х-555',kind:'cruise',vr:[720,770],warhead:410,alt:[.04,.1],reward:9,w:.3,
  info:[['Тип','крилата ракета (стара)'],['Довжина','~6 м'],['Швидкість','~770 км/год'],['БЧ','~410 кг'],['Висота','~40–100 м']]},
 kalibr:{name:'«Калібр» 3М-14',short:'Калібр',kind:'cruise',sea:true,vr:[850,900],warhead:450,alt:[.05,.15],reward:10,w:.25,
  info:[['Тип','крилата ракета морського базування'],['Довжина','~6,2 м'],['Швидкість','~880 км/год'],['БЧ','~450 кг'],['Висота','~50–150 м']]},
 iskK:{name:'Іскандер-К (9М728)',short:'Іскандер-К',kind:'cruise',model:'kalibr',land:true,vr:[800,900],warhead:480,alt:[.03,.1],reward:10,w:.15,
  info:[['Тип','крилата ракета наземного базування'],['Довжина','~6,2 м'],['Швидкість','~850 км/год'],['БЧ','~480 кг']]},
 kh59:{name:'Х-59 / Х-59МК2',short:'Х-59',kind:'cruise',sea:true,vr:[800,1000],warhead:320,alt:[.05,.3],reward:8,w:.12,
  info:[['Тип','авіаційна крилата ракета'],['Швидкість','~800–1000 км/год'],['БЧ','~300 кг'],['Носій','Су-34 / Су-35']]},
 kh69:{name:'Х-69',short:'Х-69',kind:'cruise',model:'kalibr',sea:true,vr:[900,1000],warhead:310,alt:[.03,.15],reward:9,w:.08,
  info:[['Тип','авіаційна малопомітна крилата ракета'],['Швидкість','~900–1000 км/год'],['БЧ','~310 кг'],['Висота','~20–150 м']]},
 kinzhal:{name:'Х-47М2 «Кинджал»',short:'Кинджал',kind:'bal',vr:[9000,9000],warhead:480,alt:[15,15],reward:20,dirs:['E','SE','S'],w:.04,
  info:[['Тип','аеробалістична ракета'],['Довжина','~7,2 м'],['Швидкість','до ~10 М (заявлено)'],['БЧ','~480 кг'],['Збивають','Patriot, SAMP/T']]},
 tsirkon:{name:'3М22 «Циркон»',short:'Циркон',kind:'bal',model:'kinzhal',pkr:true,vr:[7000,9000],warhead:300,alt:[15,15],reward:20,dirs:['S','SE'],w:.02,
  info:[['Тип','гіперзвукова протикорабельна ракета'],['Швидкість','~6–8 М (заявлено)'],['БЧ','~300 кг'],['Запуск','з Криму / моря']]},
 kh22:{name:'Х-22 / Х-32',short:'Х-22',kind:'bal',pkr:true,vr:[3500,4300],warhead:950,alt:[12,12],reward:18,dirs:['NE','E','SE'],w:.02,
  info:[['Тип','надзвукова протикорабельна (ПКР), пікірує з висоти'],['Довжина','~11,7 м'],['Швидкість','~3,5–4 М'],['БЧ','~950 кг'],['Збивають','Patriot, SAMP/T']]},
 oniks:{name:'П-800 «Онікс»',short:'Онікс',kind:'cruise',model:'kalibr',sea:true,pkr:true,vr:[2500,3000],warhead:250,alt:[.01,.5],reward:14,w:.02,
  info:[['Тип','надзвукова протикорабельна ракета'],['Швидкість','~2,5 М'],['БЧ','~250 кг'],['Висота','біля самої землі на кінцевій ділянці']]},
};
for (const [id, e] of Object.entries(ENEMY)) { e.id = id; e.v = (e.vr[0] + e.vr[1]) / 2; e.dirs ||= []; }
const KIND = {drone: 'БпЛА', cruise: 'КР', bal: 'БР'};
// що бачить оператор до ідентифікації
const PRELIM = e => e.def.kind === 'bal' ? 'Балістична ціль' : e.def.kind === 'cruise' ? (e.def.pkr ? 'Надзвукова ціль' : 'Крилата ракета') : e.def.recon ? 'Малий БпЛА' : e.def.v > 300 ? 'Реактивний БпЛА' : 'БпЛА типу Shahed';
const RECON = ['orlan', 'zala', 'supercam', 'gerberaR', 'forpost', 'orion'];
// хвилі: n — дальніх пусків (×складність), recon — розвідників, msl — множник частки ракет (комбінований удар — більше ракет)
const WAVES = [
 {n: 10, recon: 0, msl: 0}, {n: 16, recon: 1, msl: 0}, {n: 24, recon: 1, msl: 1}, {n: 32, recon: 2, msl: 3, combo: true},
 {n: 42, recon: 2, msl: 1}, {n: 54, recon: 3, msl: 3, combo: true}, {n: 68, recon: 3, msl: 1.5}, {n: 90, recon: 4, msl: 4, combo: true},
];

// ================= GEO =================
// ================= GEO: операції (райони оборони) з ops.js =================
// Координати гри — кілометри від головного міста операції (x — схід, y — північ).
const OPS_DATA_ = typeof module !== 'undefined' && module.exports && typeof window === 'undefined' ? require('./ops.js') : OPS_DATA;
let OP = null, OP_ID = 'kyiv', LAT0 = 50.45, LNG0 = 30.52, KX = 111.32 * Math.cos(LAT0 * Math.PI / 180);
const KY = 110.57;
const toXY = (lat, lng) => ({x: (lng - LNG0) * KX, y: (lat - LAT0) * KY});
const toLatLng = (x, y) => [LAT0 + y / KY, LNG0 + x / KX];
const UKR = [[44.3, 22.1], [52.4, 40.2]];
function inPoly(poly, lat, lng) { // промінь — точка всередині багатокутника [[lat,lng]]
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ya, xa] = poly[i], [yb, xb] = poly[j];
    if ((ya > lat) !== (yb > lat) && lng < (xb - xa) * (lat - ya) / (yb - ya) + xa) ins = !ins;
  }
  return ins;
}
function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
function edgeDist(poly, p) { let m = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) m = Math.min(m, segDist(p, poly[j], poly[i])); return m; }
function inXY(poly, p) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) ins = !ins;
  }
  return ins;
}
// Пускові майданчики ударних дронів (публічно відомі; наближено). dirs — коридори, які вони «живлять».
const SITES = [
  {id: 'navlia', name: 'Навля (Брянщина)', ll: [52.83, 34.5], dirs: ['N', 'NE', 'NW']},
  {id: 'oryol', name: 'Орел', ll: [52.97, 36.06], dirs: ['N', 'NE', 'NW', 'E']},
  {id: 'kursk', name: 'Курськ (Хальїно)', ll: [51.75, 36.3], dirs: ['NE', 'E']},
  {id: 'primorsk', name: 'Приморсько-Ахтарськ', ll: [46.05, 38.17], dirs: ['E', 'SE', 'S']},
  {id: 'crimea', name: 'Гвардійське (Крим)', ll: [45.11, 33.98], dirs: ['S', 'SW', 'W', 'SE']},
];
// Поточна операція: усе нижче перераховується в setOp()
let OBL, OBL_POLY, OBL_XY, ZONES, BY_POLY, ROUTES, BAL_FROM, BAL_NAME, CITIES0, OBJS0, DEPOTS0, RAIONS, BASE, LAUNCH;
const inObl = (lat, lng) => inPoly(OBL_POLY, lat, lng);
// заборонені зони (Білорусь — ворожа; Молдова, Румунія — нейтральні): дрони їх обходять, наша авіація туди не летить
// межі точні (OpenStreetMap, тисячі точок) — тому кешуємо по клітинках ~2 км: клітинка цілком усередині чи цілком поза зоною
// береться з кешу, а клітинка, через яку проходить кордон, перевіряється точно
const ZCELL = .02, zcache = new Map();
function zoneCell(la0, ln0) {
  const c = Math.cos(la0 * Math.PI / 180), half = ZCELL * .75;
  for (const q of ZONES) {
    if (la0 < q.bb[0] - ZCELL || la0 > q.bb[2] + ZCELL || ln0 < q.bb[1] - ZCELL || ln0 > q.bb[3] + ZCELL) continue;
    let md = 1e9; const r = q.ring;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const ax = (r[j][1] - ln0) * c, ay = r[j][0] - la0, bx = (r[i][1] - ln0) * c, by = r[i][0] - la0, dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
      const t = l ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l)) : 0; md = Math.min(md, Math.hypot(ax + t * dx, ay + t * dy));
    }
    if (md < half) return 'B'; // через клітинку йде кордон
    if (inPoly(r, la0, ln0)) return q;
  }
  return null;
}
const zoneAt = (x, y) => {
  const [la, ln] = toLatLng(x, y), i = Math.round(la / ZCELL), j = Math.round(ln / ZCELL), key = i * 100000 + j;
  let z = zcache.get(key);
  if (z === undefined) { z = zoneCell(i * ZCELL, j * ZCELL); zcache.set(key, z); }
  if (z !== 'B') return z;
  return ZONES.find(q => la >= q.bb[0] && la <= q.bb[2] && ln >= q.bb[1] && ln <= q.bb[3] && inPoly(q.ring, la, ln)) || null;
};
const inBY = (lat, lng) => ZONES.some(z => inPoly(z.ring, lat, lng));
const pIn = (x, y) => !!zoneAt(x, y);
function zoneNear(p) { let best = null, bd = 1e9; for (const z of ZONES) { const d = inXY(z.xy, p) ? 0 : edgeDist(z.xy, p); if (d < bd) { bd = d; best = z; } } return {z: best, d: bd}; }
const byDist = p => zoneNear(p).d;
// витягнути точку із забороненої зони в бік головного міста
function outBY(p, margin = 0) {
  const q = {x: p.x, y: p.y}, was = pIn(q.x, q.y), step = () => { const d = Math.hypot(q.x, q.y) || 1; q.x -= q.x / d * 2; q.y -= q.y / d * 2; };
  for (let i = 0; i < 400 && pIn(q.x, q.y); i++) step();
  if (was) for (let i = 0; i < margin / 2; i++) step(); // запас від кордону
  return q;
}
// маршрут (точки x,y) без жодного відрізка над забороненою зоною
function avoidBY(pts) {
  const out = pts.map(p => outBY(p, 4));
  for (let guard = 0; guard < 60; guard++) {
    let fixed = false;
    for (let i = 1; i < out.length && !fixed; i++) {
      const a = out[i - 1], b = out[i], n = Math.max(12, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / .5));
      for (let k = 1; k < n; k++) {
        const t = k / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        if (pIn(x, y)) { out.splice(i, 0, outBY({x, y}, 6)); fixed = true; break; }
      }
    }
    if (!fixed) break;
  }
  return out;
}
const OPS = Object.fromEntries(Object.entries(OPS_DATA_).map(([id, o]) => [id, {id, name: o.name, short: o.short, center: o.center}]));
function setOp(id = 'kyiv') {
  const o = OPS_DATA_[id] || OPS_DATA_.kyiv; OP_ID = OPS_DATA_[id] ? id : 'kyiv'; OP = o;
  [LAT0, LNG0] = o.center; KX = 111.32 * Math.cos(LAT0 * Math.PI / 180);
  OBL = o.bounds; OBL_POLY = o.obl; OBL_XY = OBL_POLY.map(([a, b]) => toXY(a, b));
  ZONES = o.zones.map(z => ({...z, xy: z.ring.map(([a, b]) => toXY(a, b)),
    bb: [Math.min(...z.ring.map(q => q[0])), Math.min(...z.ring.map(q => q[1])), Math.max(...z.ring.map(q => q[0])), Math.max(...z.ring.map(q => q[1]))]}));
  BY_POLY = ZONES.find(z => z.hostile)?.ring || null; zcache.clear();
  ROUTES = o.routes; BAL_FROM = o.bal; BAL_NAME = o.balName;
  CITIES0 = o.cities; OBJS0 = o.objs; DEPOTS0 = o.depots;
  const R = r => { const poly = r.ring.map(([a, b]) => toXY(a, b)); return {name: r.name, poly, ll: r.ring, c: poly.reduce((s, q) => ({x: s.x + q.x / poly.length, y: s.y + q.y / poly.length}), {x: 0, y: 0})}; };
  RAIONS = [...o.raions.map(R), R(o.city)];
  BASE = {...toXY(o.base[0], o.base[1]), name: o.base[2]}; LAUNCH = toXY(...o.launch);
  for (const s of SITES) { const p = toXY(...s.ll); s.x = p.x; s.y = p.y; s.km = Math.round(Math.hypot(p.x, p.y)); s.dirs = o.sites[s.id] || []; }
  return OP;
}
setOp('kyiv');
// Складність: кількість цілей, стартовий ресурс, нагорода, час наведення розвідником (с), частка зруйнованих міст для поразки,
// частка дронів, що полюють на ППО, множник часу обслуговування, ground — літак після посадки пропускає наступну хвилю.
const DIFF = [
  {name: 'Новобранець', count: .6, res: 300, reward: 1.5, spot: 600, lose: .5, hunt: .02, svcK: 1},
  {name: 'Легко', count: .8, res: 220, reward: 1.2, spot: 450, lose: .45, hunt: .04, svcK: 1},
  {name: 'Нормально', count: 1, res: 180, reward: 1, spot: 300, lose: .4, hunt: .06, svcK: 1},
  {name: 'Складно', count: 1.3, res: 130, reward: .85, spot: 240, lose: .3, hunt: .09, svcK: 1.5},
  {name: 'Ветеран', count: 1.7, res: 100, reward: .7, spot: 180, lose: .25, hunt: .12, svcK: 1.5},
];
const OBJ_INFO = {energy: 'енергетика: кожен зруйнований обʼєкт −12% бонусу після хвилі (знеструмлення)', air: 'аеропорт: −5% бонусу після хвилі', base: 'ваш аеродром: обслуговування літаків удвічі довше, літаки на землі можуть загинути',
  fuel: 'нафтобаза: обслуговування літака дорожче (+1 ⛁)', port: 'порт: −8% бонусу після хвилі (експорт зерна)', rail: 'залізниця: ракети дорожчі на 25% (логістика)', misc: 'місце частих падінь дронів', depot: 'склад'};
const SUP_NAME = {west: 'західних ракет', soviet: 'радянських ракет', ammo: 'набоїв і ПЗРК'};
const SPEEDS = [0, 1, 10, 30, 60]; // множник реального часу: 1× — усе летить із реальною швидкістю
// ===== РЕЖИМ «ЗА ПРОТИВНИКА»: гравець планує пуски, ППО розставляє ШІ =====
// ціна засобу ураження для атакувальника, ⛁
const ATK_COST = {shahed: 2, garpiya: 2, shahedMS: 4, gerbera: 1, gerbera2: 1, gerberaW: 1, parodiya: 1, italmas: 2, geran3: 6, geran4: 8, geran5: 12,
  banderol: 6, klin: 6, filin: 6, orlan: 3, zala: 3, supercam: 3, gerberaR: 2, forpost: 8, orion: 12,
  iskander: 30, kn23: 26, s300g: 12, kh101: 24, kh555: 18, kalibr: 24, iskK: 26, kh59: 20, kh69: 24, kinzhal: 45, tsirkon: 50, kh22: 35, oniks: 30};
const ATK_START = [300, 250, 210, 180, 150]; // стартовий бюджет атаки за складністю (чим складніше — тим сильніша ППО ШІ)
const AI_UNITS = [[3, 1], [4, 1], [5, 2], [7, 2], [9, 3]]; // ППО ШІ: [на старті, додає щохвилі]
const DMG_DIV = 30; // урон місту/обʼєкту = БЧ (кг) / 30
const OPT_DEF = {debris: .2, balWarn: .75, hunt: null, pk: {}};

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const horizon = (hKm, ant = 25) => 4.12 * (Math.sqrt(ant) + Math.sqrt(hKm * 1000)); // радіогоризонт, км; ant — висота антени, м
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
// ['tracer', x1, y1, x2, y2] ['shake', сила, спалах] ['end', перемога] ['voice', ключ, дод.] ['balwarn', напрямок, тип]
let G = null;
const emit = (...ev) => { if (G) G.out.push(ev); };
const say = (text, cls = '') => emit('say', text, cls);
const snd = name => emit('snd', name);
const label = e => e.ident ? e.def.short : PRELIM(e);

// ймовірність ураження: з розширених налаштувань (G.opt.pk['sam:pac3'].drone) або стандартна
function pkDefault(m, kind) {
  if (kind === 'bal') return m.bm ? m.pkBal : 0;
  if (kind === 'drone') return m.pkD ?? m.pk;
  return m.pkC ?? m.pk;
}
function pkOf(key, kind, def) {
  const o = G?.opt?.pk?.[key], v = o ? o[kind] : null;
  return v != null && isFinite(v) ? Math.max(0, Math.min(1, v)) : def;
}
const mslPk = (m, kind) => pkOf(m.tbl + ':' + m.id, kind, pkDefault(m, kind));
const gunPk = (d, kind) => pkOf('gun:' + d.id, kind, kind === 'drone' ? d.gun.pk : kind === 'cruise' ? d.gun.pk / 2 : 0);
const uavPk = d => pkOf('uav:' + d.id, 'drone', d.pk);

function newGame(diff = 2, opt = {}, op = 'kyiv', mode = 'defend') {
  setOp(op);
  const objs = OBJS0.map(([name, lat, lng, t]) => ({name, ...toXY(lat, lng), hp: 6, max: 6, w: t === 'misc' ? 1.5 : 2, t}));
  const deps = DEPOTS0.map(([name, lat, lng, sup]) => ({name, ...toXY(lat, lng), hp: 8, max: 8, w: 1.5, t: 'depot', sup, down: 0}));
  const g = {
    wave: 0, phase: 'deploy', time: 0, waveT: 0, diff, res: DIFF[diff].res, kills: 0, leaks: 0, spent: 0,
    events: [], warns: [], out: [], nid: 1, over: false, win: false, opt: {...OPT_DEF, ...opt, pk: {...(opt.pk || {})}},
    cities: [...CITIES0.map(([name, lat, lng, hp, w]) => ({name, ...toXY(lat, lng), hp, max: hp, w, t: 'city'})), ...objs, ...deps],
    sams: [], radars: [], enemies: [], shots: [], air: [], uavs: [], debris: [], strikes: [],
    op: OP_ID, mode, plan: [], hits: 0, lost: 0, routes: null, siteMult: Object.fromEntries(SITES.map(s => [s.id, 1])), alerts: RAIONS.map(() => ({lvl: 0, quiet: 0})), hi: {},
  };
  for (const c of g.cities) c.id = g.nid++;
  if (mode === 'attack') { g.res = ATK_START[diff]; g.cities[0].hp = g.cities[0].max = 90; const prev = G; G = g; aiDefend(AI_UNITS[diff][0]); G = prev; }
  return g;
}
const newId = () => G.nid++;
function byId(id) {
  for (const arr of [G.sams, G.radars, G.air, G.uavs, G.enemies, G.cities]) { const o = arr.find(o => o.id === id); if (o) return o; }
  return null;
}
function pay(n) { if (G.res < n) { say(`Бракує ресурсу (потрібно ${n} ⛁).`, 'bad'); return false; } G.res -= n; G.spent += n; return true; }
const objDown = t => G.cities.filter(c => c.t === t && c.hp <= 0).length;
const lostCities = () => G.cities.filter((c, i) => i > 0 && c.t === 'city' && c.hp <= 0).length;
const loseLimit = () => Math.max(2, Math.ceil(G.cities.filter((c, i) => i > 0 && c.t === 'city').length * (G.mode === 'attack' ? .55 : DIFF[G.diff].lose)));
const supplyDown = sup => G.cities.find(c => c.t === 'depot' && c.sup === sup && c.hp <= 0);
const price = m => Math.ceil(m.cost * (objDown('rail') ? 1.25 : 1));
function supplyOk(m) {
  const dp = m.sup && supplyDown(m.sup);
  if (dp) { say(`${dp.name} знищено: постачання ${SUP_NAME[m.sup]} відновиться через ${dp.down} хвил. (або відновіть склад за 30 ⛁).`, 'bad'); return false; }
  return true;
}

// ================= ЗАКУПІВЛЯ =================
const maxFuel = a => a.d.fuel * (1 + a.ptb * a.d.ptbK);
const maxMsl = a => Math.max(0, a.d.msl - a.ptb * a.d.ptbSlot);
const used = (o, tbl) => sum(o, k => tbl[k].size || 1);
function buySam(s, mid, n) {
  const d = s.d, m = SAM_MSL[mid]; let bought = 0;
  if (!m || !d.msl.includes(mid) || !supplyOk(m)) return 0;
  const c = price(m), pk = m.pack || 1;
  while (bought < n && G.res >= c) {
    const free = d.cap - used(s.load, SAM_MSL), freeS = d.cap * 2 - used(s.stock, SAM_MSL), k = Math.min(pk, Math.floor((s.reload <= 0 ? free : 0) / m.size));
    if (k > 0) s.load[mid] = (s.load[mid] || 0) + k;
    else if (Math.floor(freeS / m.size) > 0) s.stock[mid] = (s.stock[mid] || 0) + Math.min(pk, Math.floor(freeS / m.size));
    else break;
    G.res -= c; G.spent += c; bought++;
  }
  if (bought) snd('coin'); else if (G.res < c) say(`Бракує ресурсу на ${m.name}.`, 'bad'); else say('ПУ і резерв заповнені.');
  return bought;
}
function buyAam(a, mid, n) { // тільки на базі
  const m = AAM[mid]; let bought = 0;
  if (!m || !a.d.aam.includes(mid) || !supplyOk(m)) return 0;
  const c = price(m);
  while (bought < n && sum(a.load) < maxMsl(a) && G.res >= c) { a.load[mid] = (a.load[mid] || 0) + 1; G.res -= c; G.spent += c; bought++; }
  if (bought) snd('coin'); else if (G.res < c) say(`Бракує ресурсу на ${m.name}.`, 'bad');
  return bought;
}
const GUN_COST = 2;
function buyGun(a) { if (!a.d.gun || a.gun >= a.d.gun.bursts || !supplyOk({sup: 'ammo'}) || !pay(GUN_COST)) return false; a.gun = a.d.gun.bursts; snd('coin'); return true; }
function serviceRearm(a) {
  for (const [mid, n] of Object.entries(a.want)) { const need = n - (a.load[mid] || 0); if (need > 0) buyAam(a, mid, need); }
  if (a.gunWant) buyGun(a);
}
function goHome(a, why) { a.state = 'rtb'; a.tgt = null; a.lock = null; a.rtbShots = 2; if (why) say(`${a.d.name}: ${why} — повертається (дорогою може випустити до 2 ракет).`, 'warn'); }
// Ветеран: після посадки літак пропускає наступну хвилю (крім фінальної — на ній літають усі)
const grounded = a => !!a.groundUntil && (G.wave < a.groundUntil || (G.wave === a.groundUntil && G.phase === 'wave'));
function canFly(a) {
  if (a.state === 'service') { say(`${a.d.name} ще обслуговується.`, 'bad'); return false; }
  if (grounded(a)) { say(`${a.d.name}: технічне обслуговування — пропускає хвилю ${a.groundUntil}.`, 'bad'); return false; }
  return true;
}
// точка виходу на удар у бік пускового майданчика (≈140 км від Києва)
function exitTo(site) { const k = Math.min(1, 140 / site.km); return {x: site.x * k, y: site.y * k}; }

// ================= КОМАНДИ ГРАВЦЯ =================
// Єдиний вхід для дій гравця. У мережевій грі ці самі обʼєкти полетять на сервер.
// {t:'startWave'} {t:'buyAir', def} {t:'kamikaze', def, site} {t:'place', kind:'sam'|'uav', def, x, y}
// {t:'assign', unit, target} {t:'move', unit, x, y} {t:'act', unit, act, arg} {t:'repair', obj}
function command(c) {
  if (!G || G.over || !c) return null;
  const u = c.unit != null ? byId(c.unit) : null;
  if (c.t === 'startWave') { startWave(); return null; }
  if (c.t === 'plan' && G.mode === 'attack' && G.phase === 'deploy') {
    const d = ENEMY[c.type], n = Math.max(1, Math.min(50, c.n | 0 || 1)); if (!d || !ATK_COST[c.type]) return null;
    const dir = d.kind === 'bal' ? (BAL_FROM[c.dir] ? c.dir : Object.keys(BAL_FROM)[0]) : (ROUTES[c.dir] ? c.dir : Object.keys(ROUTES)[0]);
    const tgt = c.target != null && G.cities.some(q => q.id === c.target) ? c.target : null;
    if (!pay(ATK_COST[c.type] * n)) return null;
    const ex = G.plan.find(q => q.type === c.type && q.dir === dir && q.target === tgt);
    if (ex) ex.n += n; else G.plan.push({type: c.type, dir, target: tgt, n});
    snd('coin'); return G.plan;
  }
  if (c.t === 'unplan' && G.mode === 'attack' && G.phase === 'deploy') {
    const q = G.plan[c.i]; if (!q) return null;
    const n = Math.min(q.n, Math.max(1, c.n | 0 || q.n)); q.n -= n; G.res += ATK_COST[q.type] * n; G.spent -= ATK_COST[q.type] * n;
    if (q.n <= 0) G.plan.splice(c.i, 1); return G.plan;
  }
  if (c.t === 'buyAir') {
    const d = AIR.find(a => a.id === c.def);
    if (!d || G.air.filter(a => a.d === d).length >= d.count || !pay(d.cost)) return null;
    const a = {id: newId(), kind: 'air', d, x: BASE.x, y: BASE.y, tx: BASE.x, ty: BASE.y, state: 'base', fuel: d.fuel, ptb: 0, load: {}, want: {}, gun: 0, gunWant: false,
      cd: 0, orb: 0, rot: 0, aimT: 0, gunT: 0, lock: null, tgt: null, rtbShots: 0, gunMode: d.role === 'hunter', filt: {drone: true, cruise: true}, hunt: true, autoRet: false, duty: null, turn: d.heli ? .6 : d.role === 'strike' || d.role === 'awacs' ? .25 : .3};
    G.air.push(a);
    say(`${d.name} прибув на ${BASE.name}.${d.aam.length || d.gun ? ` Купіть ${d.aam.length ? 'ракети' : ''}${d.aam.length && d.gun ? ' і ' : ''}${d.gun ? 'набої' : ''} в панелі борту.` : ''}`, 'warn');
    return a;
  }
  if (c.t === 'kamikaze') {
    const d = UAV.find(x => x.id === c.def && x.role === 'kamikaze'), site = SITES.find(s => s.id === c.site) || SITES[0];
    if (!d || !pay(d.cost)) return null;
    const ex = exitTo(site);
    G.uavs.push({id: newId(), kind: 'uav', d, ...LAUNCH, tx: ex.x, ty: ex.y, site: site.id, rot: 0, state: 'strike', turn: .4});
    say(`${d.name} запущено по пусковому майданчику «${site.name}» (~${site.km} км).`, 'ok');
    return null;
  }
  if (c.t === 'relocate') {
    const u2 = byId(c.unit); if (!u2 || !['sam', 'radar'].includes(u2.kind) || !isFinite(c.x) || !isFinite(c.y)) return null;
    if (!inObl(...toLatLng(c.x, c.y))) { say(`Тільки в межах області (${OP.short}).`, 'bad'); return null; }
    if (G.phase !== 'wave') { u2.x = c.x; u2.y = c.y; u2.mv = null; if (u2.kind === 'sam') dropLock(u2); say(`${u2.d.name}: переставлено.`); return u2; }
    if (!pay(1)) return null;
    if (u2.kind === 'sam') dropLock(u2);
    u2.mv = {x: c.x, y: c.y}; say(`${u2.d.name}: ${u2.d.mobile ? 'переїзд' : 'згортання й переїзд (стаціонарний комплекс, повільно)'} — 1 ⛁ пального. Під час руху не працює.`);
    return u2;
  }
  if (c.t === 'repair') {
    const o = byId(c.obj);
    if (!o || !o.t || o.t === 'city' || o.hp >= o.max) return null;
    const cost = o.t === 'depot' ? 30 : 20;
    if (!pay(cost)) return null;
    o.hp = o.max; o.down = 0; say(`${o.name}: відновлено (−${cost} ⛁).`, 'ok'); snd('coin');
    return o;
  }
  if (c.t === 'place' && c.kind === 'radar') {
    const d = RADAR.find(x => x.id === c.def);
    if (!d || !isFinite(c.x) || !isFinite(c.y)) return null;
    if (!inObl(...toLatLng(c.x, c.y))) { say(`Тільки в межах області (${OP.short}).`, 'bad'); return null; }
    if (!pay(d.cost)) return null;
    const r = {id: newId(), kind: 'radar', d, x: c.x, y: c.y, on: true, hp: 100, rot: 0};
    G.radars.push(r); say(`${d.name} розгорнуто й випромінює. Ворог може її запеленгувати — за потреби вимкніть випромінювання.`, 'ok');
    return r;
  }
  if (c.t === 'place') {
    const d = (c.kind === 'sam' ? SAM : UAV).find(x => x.id === c.def);
    if (!d || (c.kind === 'uav' && d.role === 'kamikaze') || !isFinite(c.x) || !isFinite(c.y)) return null;
    if (c.kind === 'sam' && d.limit && G.sams.filter(q => q.d === d).length >= d.limit) { say(`${d.name}: партнери передали лише ${d.limit} — більше немає.`, 'bad'); return null; }
    const [lat, lng] = toLatLng(c.x, c.y);
    if (!inObl(lat, lng)) { say(`Тільки в межах області (${OP.short}).`, 'bad'); return null; }
    if (!pay(d.cost)) return null;
    if (c.kind === 'sam') {
      const s = {id: newId(), kind: 'sam', d, x: c.x, y: c.y, load: {}, stock: {}, buyType: d.msl[0], reload: 0, cd: 0, rot: 0, force: null, auto: false, lock: null, hot: 0, hp: 100,
        filt: {drone: true, cruise: true, bal: !!d.bm}};
      G.sams.push(s); say(`${d.name} розгорнуто. Оберіть і купіть ${d.msl.some(k => SAM_MSL[k].gun) ? 'боєкомплект' : 'ракети'}!`, 'warn');
      return s;
    }
    const v = {id: newId(), kind: 'uav', d, x: c.x, y: c.y, hx: c.x, hy: c.y, orb: 0, rot: 0, fuel: d.role === 'recon' ? d.endur * 3600 : d.range, state: 'loiter',
      turn: d.id === 'winfly' || d.id === 'sting' ? 2 : d.id === 'pysyun' ? 1.5 : d.role === 'interceptor' ? .9 : .5};
    G.uavs.push(v); say(`${d.name} у повітрі.`, 'ok');
    return v;
  }
  if (!u) return null;
  if (c.t === 'assign') { const e = byId(c.target); if (e && e.kind === 'enemy' && e.det) assign(u, e); return null; }
  if (c.t === 'move' && isFinite(c.x) && isFinite(c.y)) {
    if (u.kind === 'air' && u.d.role !== 'strike') {
      if (!canFly(u)) return null;
      if (u.state === 'base') { if (!sum(u.load) && !u.gun) say(`${u.d.name} злітає ${u.d.role === 'awacs' ? 'на чергування' : 'без озброєння — лише розвідка радаром'}.`, u.d.role === 'awacs' ? 'ok' : 'warn'); else say(`${u.d.name}: зліт з ${BASE.name}.`, 'ok'); }
      if (u.state === 'base') u.armed = !!(sum(u.load) || u.gun); // без озброєння — лише розвідка радаром
      u.state = 'move'; u.tx = c.x; u.ty = c.y; u.tgt = null; u.duty = {x: c.x, y: c.y};
    } else if (u.kind === 'uav' && u.d.role !== 'kamikaze') { u.hx = c.x; u.hy = c.y; u.tgt = null; u.forced = false; }
    else if ((u.kind === 'sam' || u.kind === 'radar') && u.d.mobile) {
      if (!inObl(...toLatLng(c.x, c.y))) { say(`Тільки в межах області (${OP.short}).`, 'bad'); return null; }
      if (!pay(1)) return null;
      dropLock(u); u.mv = {x: c.x, y: c.y}; say(`${u.d.name}: переїзд (пальне −1 ⛁). Під час руху не стріляє.`);
    }
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
    if (u.d.role === 'strike' || u.d.role === 'awacs') return;
    if (e.def.kind === 'bal') { say('Авіація не перехоплює балістику.', 'bad'); return; }
    if (!canFly(u)) return;
    if (!sum(u.load) && !u.gun) { say(`${u.d.name}: немає ні ракет, ні набоїв!`, 'bad'); return; }
    u.tgt = e; u.state = 'intercept'; u.auto = false; u.duty = {x: e.x, y: e.y}; say(`${u.d.name}: перехоплення — ${label(e)}. Зона чергування — там, де ціль.`);
  } else if (u.kind === 'uav' && u.d.role === 'interceptor') {
    u.tgt = e; u.forced = true; u.hx = e.x; u.hy = e.y; // після перехоплення чергуватиме там
    say(intercept(u, e, u.d.vmax / 3600) ? `${u.d.name}: ціль призначено.` : `${u.d.name}: ціль швидша і віддаляється — не наздожене, спробуйте назустріч.`, 'warn');
  }
}
// дії з панелі юніта; сервер перевіряє все сам (кнопку могли натиснути не вчасно)
function unitAct(u, act, arg) {
  const base = u.kind === 'air' && u.state === 'base';
  if (u.kind === 'radar') {
    if (act === 'emit') { u.on = !u.on; say(u.on ? `${u.d.name}: випромінювання увімкнено.` : `${u.d.name}: тихий режим — не бачить цілей, але й ворог її не пеленгує.`, u.on ? 'ok' : 'warn'); }
    else if (act === 'stop') u.mv = null;
    else if (act === 'sell') { G.radars = G.radars.filter(r => r !== u); G.res += Math.round(u.d.cost / 2 * u.hp / 100); say(`${u.d.name} демонтовано.`); }
    return;
  }
  if (u.kind === 'sam') {
    if (act === 'f' && arg in u.filt) u.filt[arg] = !u.filt[arg];
    else if (act === 'pick' && u.d.msl.includes(arg)) u.buyType = arg;
    else if (act === 'b1' && u.d.msl.includes(arg)) { u.buyType = arg; buySam(u, arg, 1); }
    else if (act === 'bf' && u.d.msl.includes(arg)) { u.buyType = arg; buySam(u, arg, 99); }
    else if (act === 'auto') u.auto = !u.auto;
    else if (act === 'unforce') u.force = null;
    else if (act === 'stop') u.mv = null;
    else if (act === 'sell') { G.sams = G.sams.filter(s => s !== u); G.res += Math.round(u.d.cost / 2 * u.hp / 100); say(`${u.d.name} демонтовано.`); }
  } else if (u.kind === 'air') {
    const d = u.d;
    if (act === 'f' && arg in u.filt) u.filt[arg] = !u.filt[arg];
    else if (act === 'a+' && base) { if (buyAam(u, arg, 1)) u.want = {...u.load}; }
    else if (act === 'a-' && base && u.load[arg] > 0) { u.load[arg]--; G.res += AAM[arg].cost; u.want = {...u.load}; }
    else if (act === 'ptb+' && base && u.ptb < d.ptb && sum(u.load) <= maxMsl(u) - d.ptbSlot) { u.ptb++; u.fuel = maxFuel(u); }
    else if (act === 'ptb-' && base && u.ptb > 0) { u.ptb--; u.fuel = maxFuel(u); }
    else if (act === 'gun' && base) { if (buyGun(u)) u.gunWant = true; }
    else if (act === 'gm') u.gunMode = !u.gunMode;
    else if (act === 'rtb' && !['base', 'service', 'rtb'].includes(u.state)) { u.duty = null; goHome(u, 'наказ'); }
    else if (act === 'hunt') u.hunt = !u.hunt;
    else if (act === 'autoRet') u.autoRet = !u.autoRet;
    else if (act === 'strike' && base && d.role === 'strike' && canFly(u)) {
      const site = SITES.find(s => s.id === arg) || SITES[0], ex = exitTo(site);
      u.state = 'strikeOut'; u.site = site.id; u.tx = ex.x; u.ty = ex.y; say(`${d.name}: виліт на рубіж пуску Storm Shadow по «${site.name}».`, 'ok');
    }
  }
}

// ================= УДАРИ ПО ПУСКОВИХ =================
// Удар летить до майданчика (час = відстань / швидкість), там прориває ППО противника з шансом pSucc.
// Успіх: у поточній хвилі зривається частка power ще не виконаних пусків з цього майданчика,
// а наступна хвиля з його коридорів слабша (майданчик відновлюється на +20% за хвилю).
function launchStrike(site, d, rest, v) {
  G.strikes.push({site, name: d.name, power: d.power, p: d.pSucc, eta: G.time + rest / v});
}
function applyStrike(s) {
  const site = SITES.find(x => x.id === s.site);
  if (Math.random() > s.p) { say(`${s.name}: удар по «${site.name}» не вдався — збито ППО противника.`, 'warn'); return; }
  const left = G.events.filter(e => !e.done && e.site === site.id);
  let n = 0;
  if (G.phase === 'wave' && left.length) { n = Math.max(1, Math.round(left.length * s.power)); left.sort(() => Math.random() - .5).slice(0, n).forEach(e => e.done = true); }
  G.siteMult[site.id] = Math.max(.3, G.siteMult[site.id] * (1 - s.power));
  snd('chime');
  say(`${s.name}: влучання в «${site.name}»!${n ? ` Зірвано ${n} пусків.` : ''} Наступна хвиля з цього напрямку −${Math.round((1 - G.siteMult[site.id]) * 100)}%.`, 'ok');
}

// ================= ХВИЛІ =================
const routesOf = d => OP.use[d.sea ? 'sea' : d.land ? 'land' : d.kind === 'cruise' ? 'cruise' : d.recon ? 'recon' : 'drone'];
// звідки летить балістика: у Київській операції — за типом ракети, в інших — за напрямками операції
const balDirs = d => OP.balDirs || d.dirs;
const jit = (p, km) => ({x: p.x + rnd(-km, km), y: p.y + rnd(-km, km)});
// щохвилі коридори трохи інші: зсув точок, іноді обхідний маневр (петля), жодного заходу в Білорусь
function varyRoutes() {
  const out = {};
  for (const [k, r] of Object.entries(ROUTES)) {
    const pts = r.pts.map(([la, ln], i) => jit(toXY(la, ln), i === 0 ? 10 : 14));
    let loop = false;
    if (Math.random() < .35) {
      const i = 1 + (Math.random() * (pts.length - 1) | 0), a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy) || 1, s = rnd(18, 35) * (Math.random() < .5 ? -1 : 1);
      pts.splice(i, 0, {x: (a.x + b.x) / 2 - dy / L * s, y: (a.y + b.y) / 2 + dx / L * s}); loop = true;
    }
    out[k] = {name: r.name + (loop ? ' (з обхідним маневром)' : ''), pts: avoidBY(pts)};
  }
  return out;
}
const roundRnd = x => Math.floor(x) + (Math.random() < x % 1 ? 1 : 0);
function startWave() {
  if (G.phase !== 'deploy' || G.wave >= WAVES.length) return;
  if (G.mode === 'attack') return startAttack();
  const w = WAVES[G.wave++], k = DIFF[G.diff].count;
  G.events = []; G.warns = []; G.hi = {}; G.routes = varyRoutes();
  const plan = {};
  // склад хвилі — за частками реальних дальніх пусків; ракет більше в комбінованих ударах
  for (const d of Object.values(ENEMY)) if (d.w) plan[d.id] = roundRnd(w.n * k * d.w / 100 * (d.kind === 'drone' ? 1 : w.msl) * (OP.mix[d.id] ?? 1));
  for (let i = 0; i < Math.round(w.recon * Math.min(1.3, k)); i++) { const r = pick(RECON); plan[r] = (plan[r] || 0) + 1; }
  if (!Object.values(plan).some(n => n > 0)) plan.shahed = 1;
  for (const [type, n0] of Object.entries(plan)) {
    const d = ENEMY[type]; let n = n0;
    while (n > 0) {
      const size = d.kind === 'drone' && !d.recon ? Math.min(n, 2 + (Math.random() * 4 | 0)) : 1;
      const t = d.recon ? rnd(0, 500) : d.kind === 'bal' ? rnd(1600, 2600) : d.kind === 'cruise' || d.v > 400 ? rnd(800, 2200) : rnd(0, 1700);
      const dir = d.kind === 'bal' ? pick(balDirs(d)) : pick(routesOf(d)); // рій летить одним коридором
      const site = d.kind === 'drone' && !d.recon ? pick(SITES.filter(s => s.dirs.includes(dir)))?.id : null;
      n -= size;
      if (site && Math.random() > G.siteMult[site]) continue; // майданчик пошкоджено ударом
      for (let i = 0; i < size; i++) G.events.push({type, dir, site, t: t + i * rnd(10, 40)});
      // попередження партнерів про пуск балістики за ~20 с (приходить не завжди)
      if (d.kind === 'bal' && Math.random() < G.opt.balWarn) G.warns.push({t: t - 20, dir, type});
    }
  }
  if (!G.events.length) G.events.push({type: 'shahed', dir: 'N', site: 'navlia', t: 60});
  G.events.sort((a, b) => a.t - b.t);
  for (const s of SITES) G.siteMult[s.id] = Math.min(1, G.siteMult[s.id] + .2);
  G.phase = 'wave'; G.waveT = 0;
  const nm = G.events.filter(e => ENEMY[e.type].kind !== 'drone').length;
  snd('siren'); say(`Повітряна тривога! Хвиля ${G.wave}${w.combo ? ' — комбінований удар' : ''}: ${G.events.length} цілей${nm ? `, з них ракет: ${nm}` : ''}.`, 'bad');
}
function startAttack() {
  if (!G.plan.length) { say('Спершу заплануйте пуски: оберіть засіб праворуч, коридор і ціль.', 'bad'); return; }
  G.wave++; G.events = []; G.warns = []; G.hi = {}; G.routes = varyRoutes();
  for (const q of G.plan) {
    const d = ENEMY[q.type];
    for (let i = 0; i < q.n; i++) {
      const t = d.recon ? rnd(0, 300) : d.kind === 'bal' ? rnd(1400, 2000) : d.kind === 'cruise' || d.v > 400 ? rnd(700, 1600) : rnd(0, 900) + i * rnd(8, 25);
      G.events.push({type: q.type, dir: q.dir, target: q.target, t});
    }
  }
  G.plan = []; G.events.sort((a, b) => a.t - b.t); G.phase = 'wave'; G.waveT = 0; G.waveHits = 0; G.waveLost = 0;
  say(`Хвиля ${G.wave}: запущено ${G.events.length} засобів. ППО противника приведено в бойову готовність.`, 'warn');
}
// ШІ-оборона: розставляє комплекси біля найцінніших цілей; боєкомплект — безкоштовно
const AI_POOL = [['mvg', 'zu23', 5], ['mvg', 'manpads', 2], ['gepard', 'g35', 4], ['buk', 'm38m1', 3], ['iris', 'irisSL', 3], ['nasams', 'amr', 3], ['s300', 'n6', 2], ['patriot', 'pac3', 1], ['sampt', 'aster30', 1]];
function aiPick() { const tot = AI_POOL.reduce((a, q) => a + q[2], 0); let r = Math.random() * tot; for (const q of AI_POOL) if ((r -= q[2]) <= 0) return q; return AI_POOL[0]; }
function aiFill(s) { const m = SAM_MSL[s.ai]; s.load = {}; s.stock = {}; const k = Math.floor(s.d.cap / m.size); s.load[m.id] = k; s.stock[m.id] = Math.floor(s.d.cap * 2 / m.size); s.resup = 0; }
function aiDefend(n) {
  const tg = G.cities.filter(c => c.hp > 0).sort((a, b) => b.w - a.w + rnd(-1, 1));
  for (let i = 0; i < n; i++) {
    const [id, msl] = aiPick(), d = SAM.find(x => x.id === id), c = tg[i % Math.max(1, Math.min(tg.length, 6 + G.wave))] || {x: 0, y: 0};
    if (d.limit && G.sams.filter(q => q.d === d).length >= d.limit) { i--; if (G.sams.length > 60) break; continue; }
    let p = null; for (let k = 0; k < 20 && !p; k++) { const q = {x: c.x + rnd(-9, 9), y: c.y + rnd(-9, 9)}; if (inObl(...toLatLng(q.x, q.y))) p = q; }
    if (!p) continue;
    const s = {id: newId(), kind: 'sam', d, ...p, load: {}, stock: {}, buyType: msl, reload: 0, cd: 0, rot: 0, force: null, auto: false, lock: null, hot: 0, hp: 100,
      filt: {drone: true, cruise: true, bal: !!d.bm}, ai: msl, spotted: false};
    aiFill(s); G.sams.push(s);
  }
  if (G.radars.length < Math.min(5, 1 + Math.ceil(G.wave / 2))) { const c = pick(tg.slice(0, 4)); G.radars.push({id: newId(), kind: 'radar', d: pick(RADAR), x: c.x + rnd(-12, 12), y: c.y + rnd(-12, 12), on: true, hp: 100, rot: 0, ai: true, spotted: false}); }
  while (G.air.length < Math.min(4, Math.floor(G.wave * .6))) { // винищувачі ШІ на чергуванні
    const aid = pick(['mig29', 'su27', 'mig29']), d = AIR.find(a => a.id === aid), c = pick(tg.slice(0, 4));
    const a = {id: newId(), kind: 'air', d, x: BASE.x, y: BASE.y, tx: c.x, ty: c.y, state: 'move', fuel: d.fuel * 1.3, ptb: 1, load: {[d.aam[d.aam.length - 1]]: 2, [d.aam[0]]: 2}, want: {}, gun: d.gun?.bursts || 0, gunWant: true,
      cd: 0, orb: 0, rot: 0, aimT: 0, gunT: 0, lock: null, tgt: null, rtbShots: 0, gunMode: false, filt: {drone: true, cruise: true}, hunt: true, autoRet: true, duty: {x: c.x, y: c.y}, armed: true, turn: .3, ai: true};
    a.want = {...a.load}; G.air.push(a); if (G.air.length > 6) break;
  }
}
function pickTarget(d) {
  const alv = G.cities.filter(c => c.hp > 0); if (!alv.length) return null;
  const wt = c => c.w * (c.t !== 'city' && d.kind === 'drone' ? 1.4 : 1);
  let r = Math.random() * alv.reduce((s, c) => s + wt(c), 0);
  for (const c of alv) if ((r -= wt(c)) <= 0) return c;
  return alv[0];
}
function spawnEnemy(type, dir, samT, tgtId) {
  const d = ENEMY[type];
  let route = null, p;
  if (d.kind === 'bal') p = jit(toXY(...BAL_FROM[dir && BAL_FROM[dir] ? dir : pick(balDirs(d))]), 25);
  else { const rs = G.routes || varyRoutes(); route = rs[dir && rs[dir] ? dir : pick(routesOf(d))]; p = outBY(jit(route.pts[0], 6)); }
  let city = null, tgt;
  // частина ударних дронів летить на позиції ППО, які вже себе виказали стрільбою
  const hunt = G.opt.hunt ?? DIFF[G.diff].hunt;
  if (!samT && G.mode !== 'attack' && d.kind === 'drone' && d.warhead && !d.recon && Math.random() < hunt) { const known = [...G.sams.filter(s => s.fired), ...G.radars.filter(r => r.on)]; if (known.length) samT = pick(known); }
  if (samT) tgt = {x: samT.x, y: samT.y};
  else if (d.recon) tgt = {x: rnd(-40, 40), y: rnd(-30, 50)};
  else {
    city = tgtId != null ? G.cities.find(q => q.id === tgtId && q.hp > 0) || pickTarget(d) : pickTarget(d); if (!city) return;
    const spread = city.t === 'city' ? (city.w > 1 ? 6 : 2) : .8;
    tgt = {x: city.x + rnd(-spread, spread), y: city.y + rnd(-spread, spread)};
    if (type === 'kn23') { tgt.x += rnd(-1.5, 1.5); tgt.y += rnd(-1.5, 1.5); } // гірша точність
    if (pIn(tgt.x, tgt.y)) tgt = outBY(tgt, 1); // ціль біля кордону — розкид не за кордон
  }
  // балістика летить прямо: якщо траса зачіпає заборонену зону — пуск із безпечного напрямку
  if (d.kind === 'bal') {
    const clear = q => { for (let k = 0; k <= 60; k++) if (pIn(q.x + (tgt.x - q.x) * k / 60, q.y + (tgt.y - q.y) * k / 60)) return false; return true; };
    if (!clear(p)) { // перебрати інші точки пуску, з яких траса чиста
      const alt = Object.values(BAL_FROM).map(ll => jit(toXY(...ll), 15)).filter(clear);
      p = alt.length ? pick(alt) : jit(toXY(...BAL_FROM[OP.balSafe]), 15);
    }
  }
  // маршрут: точки коридору (з розкидом ±5 км, без заборонених зон), іноді «петляння» перед ціллю, потім ціль
  let wps = route && !samT ? route.pts.slice(1).map(q => outBY(jit(q, 5))) : [];
  if (route && !samT && d.kind === 'drone' && Math.random() < .25) wps.push(outBY(jit(tgt, 15)));
  wps.push(tgt);
  if (route) wps = avoidBY([p, ...wps]).slice(1);
  const e = {id: newId(), kind: 'enemy', def: d, type, ...p, home: p, v: rnd(...d.vr) / 3600, vx: 0, vy: 0, alt: rnd(...d.alt), wps, city, samT, eng: 0, det: false, ident: false, rot: 0,
    turn: d.kind === 'bal' ? 0 : d.kind === 'cruise' ? .15 : d.v > 400 ? .2 : d.recon ? .4 : .3, loiter: d.recon ? 1500 : 0, spot: 0, orb: 0, route: route?.name};
  G.enemies.push(e);
  // голосове оповіщення про ракетну загрозу (раз на хвилю для кожного типу)
  const hk = d.pkr ? 'pkr' : d.kind;
  if (hk !== 'drone' && !G.hi[hk]) {
    G.hi[hk] = true; emit('voice', 'high', hk);
    say(`⚠ Увага! Високий рівень небезпеки: ${hk === 'bal' ? 'загроза балістичного озброєння' : hk === 'pkr' ? 'пуски надзвукових ракет (ПКР)' : 'пуски крилатих ракет'}${d.korea ? ' (північнокорейські KN-23)' : ''}!`, 'bad');
  }
  return e;
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

function fire(src, e, vKms, pk, maxKm, name, m) {
  e.eng++;
  G.shots.push({id: newId(), kind: 'shot', x: src.x, y: src.y, v: vKms, e, pk, left: maxKm, max: maxKm, name, trail: [], mid: m?.id, tbl: m?.tbl, src, t0: G.time});
  snd('launch');
}
function gunShot(src, e, pk, name) {
  snd('gun'); emit('tracer', src.x, src.y, e.x, e.y);
  if (Math.random() < pk) kill(e, name); else emit('burst', e.x, e.y, 3, '#ffec8a', 1);
}
function kill(e, by) {
  if (e.dead) return;
  e.dead = true; G.kills++; const rw = G.mode === 'attack' ? 0 : Math.round(e.def.reward * DIFF[G.diff].reward); G.res += rw; if (G.mode === 'attack') { G.lost++; G.waveLost++; }
  emit('boom', e.x, e.y, 1, 14, '#ffe08a'); emit('burst', e.x, e.y, 14, '#ffd27a', 2.5);
  snd('boom'); say(G.mode === 'attack' ? `Ваш ${e.def.short} збито — ${by}.` : `${e.def.short} знищено — ${by}. +${rw} ⛁`, G.mode === 'attack' ? 'bad' : 'ok');
  // уламки: збита ціль з БЧ з невеликим шансом падає й може пошкодити те, що внизу
  const p = G.opt.debris * (e.def.kind === 'drone' ? 1 : 1.5);
  if (e.def.warhead && Math.random() < p) G.debris.push({x: e.x, y: e.y, vx: (e.vx || 0) * .3, vy: (e.vy || 0) * .3, t: rnd(8, 30), w: e.def.warhead, name: e.def.short});
}
// вибух: ураження позицій ППО і літаків на аеродромі поруч
function blast(x, y, w, name, samT) {
  const R = .5 + w / 120, pt = {x, y};
  for (const s of [...G.sams, ...G.radars]) {
    const dd = dist(s, pt); if (dd > R) continue;
    const dmg = s === samT && dd < 1.2 ? 100 : Math.max(10, Math.round(Math.min(100, w * 1.2) * (1 - dd / R)));
    s.hp -= dmg;
    if (s.hp <= 0) { G.sams = G.sams.filter(q => q !== s); G.radars = G.radars.filter(q => q !== s); say(`Позицію ${s.d.name} знищено (${name})!`, 'bad'); }
    else say(`${s.d.name} пошкоджено (${name}): стан ${s.hp}%. Реакція повільніша.`, 'warn');
  }
  if (dist(BASE, pt) < R + 1.5) for (const a of G.air) if ((a.state === 'base' || a.state === 'service') && Math.random() < .35) { a.lost = true; say(`${a.d.name} знищено на землі під час удару по аеродрому!`, 'bad'); }
}
function damage(c, w, name, debris) {
  if (!c || c.hp <= 0) return;
  c.hp = Math.max(0, c.hp - w / DMG_DIV);
  if (debris) say(`Уламки ${name}: пошкодження — ${c.name}.`, 'warn'); else say(`Влучання: ${c.name} (${name}).`, 'bad');
  if (c.hp > 0) return;
  if (c.t === 'city') say(`${c.name}: критичні руйнування!`, 'bad');
  else if (c.t === 'depot') { c.down = 2; say(`${c.name} знищено! Постачання ${SUP_NAME[c.sup]} зупинено на 2 хвилі.`, 'bad'); }
  else say(`${c.name} виведено з ладу — ${OBJ_INFO[c.t]}.`, 'bad');
}
function impact(e) {
  e.dead = true;
  emit('boom', e.x, e.y, 2.5, e.def.warhead ? 26 : 8, '#ff5a3a');
  if (!e.def.warhead) { say(`${e.def.short} впала без вибуху.`); return; }
  G.leaks++; snd('impact'); emit('burst', e.x, e.y, 26, '#ff7a3a', 4); emit('shake', e.def.warhead / 40, e.def.warhead / 2000);
  blast(e.x, e.y, e.def.warhead, e.def.short, e.samT);
  if (G.mode === 'attack') { const rw = Math.round(e.def.warhead / 25 + (e.city && e.city.t !== 'city' ? 3 : 1)); G.res += rw; G.hits++; G.waveHits++; say(`Влучання ${e.def.short}${e.city ? ' — ' + e.city.name : ''}. +${rw} ⛁`, 'ok'); }
  if (e.samT) return;
  damage(e.city, e.def.warhead, e.def.short);
}
function landDebris(b) {
  emit('boom', b.x, b.y, 1.2, 7, '#ff9a5a'); emit('burst', b.x, b.y, 6, '#888', 1.5);
  let c = null, bd = 3;
  for (const q of G.cities) if (q.hp > 0 && dist(q, b) < bd) { bd = dist(q, b); c = q; }
  for (const s of G.sams) if (dist(s, b) < .8) { s.hp -= 10; say(`Уламки ${b.name} впали біля ${s.d.name}: стан ${s.hp}%.`, 'warn'); if (s.hp <= 0) G.sams = G.sams.filter(q => q !== s); }
  if (c) damage(c, b.w / 4, b.name, true);
}
function detect() {
  if (G.mode === 'attack') for (const u of [...G.sams, ...G.radars]) if (!u.spotted) {
    if (u.fired) u.spotted = true;
    else for (const e of G.enemies) if (dist(u, e) <= (e.def.recon ? 25 : 5)) { u.spotted = true; say(`Розвідка: виявлено ${u.d.name}${e.def.recon ? ` (${e.def.short})` : ''}.`, 'warn'); break; }
  }
  const rads = G.radars.filter(r => r.on && !r.mv);
  for (const e of G.enemies) {
    const hz = horizon(e.alt);
    e.seen = null; // РЛС, які бачать ціль (для цілевказівки ППО)
    for (const r of rads) if (dist(r, e) <= Math.min(r.d.det * (e.def.kind === 'drone' ? r.d.small : 1), horizon(e.alt, r.d.ant))) (e.seen ||= []).push(r);
    e.det = !!e.seen || G.sams.some(s => dist(s, e) <= Math.min(s.d.det, hz))
      || G.air.some(a => !['base', 'service'].includes(a.state) && dist(a, e) <= a.d.radar)
      || G.uavs.some(u => (u.d.role === 'recon' && dist(u, e) <= u.d.sensor) || (u.d.role === 'interceptor' && dist(u, e) <= 10))
      || G.cities.some(c => c.t === 'city' && dist(c, e) <= 6);
    // ідентифікація типу: оптика/візуально зблизька; балістика й КР — за траєкторією одразу
    if (!e.ident && e.det && (e.def.kind !== 'drone'
      || G.uavs.some(u => u.state !== 'strike' && dist(u, e) <= 15) || G.air.some(a => !['base', 'service'].includes(a.state) && dist(a, e) <= 15)
      || G.cities.some(c => c.t === 'city' && dist(c, e) <= 8) || G.sams.some(s => dist(s, e) <= 8))) e.ident = true;
  }
}
// ================= ТРИВОГИ ПО РАЙОНАХ =================
// 2 — червона (повітряна тривога), 1 — жовта (загроза поруч), 0 — немає. Відбій — після 2 хв без загрози.
function updateAlerts(dt) {
  const bal = G.enemies.some(e => !e.dead && e.def.kind === 'bal'), was = G.alerts.some(a => a.lvl === 2), on = [], off = [];
  RAIONS.forEach((R, i) => {
    let want = bal ? 2 : 0;
    if (!bal) for (const e of G.enemies) {
      if (e.dead) continue;
      const dd = inXY(R.poly, e) ? 0 : edgeDist(R.poly, e), fast = e.def.kind !== 'drone' || e.v * 3600 > 300;
      if (dd <= (fast ? 60 : 25)) { want = 2; break; }
      if (dd <= (fast ? 150 : 70)) want = 1;
    }
    const A = G.alerts[i];
    if (want >= A.lvl) { if (want === 2 && A.lvl < 2) on.push(R.name); A.lvl = want; A.quiet = 0; }
    else if ((A.quiet += dt) > 120) { if (A.lvl === 2) off.push(R.name); A.lvl = want; A.quiet = 0; }
  });
  if (on.length) say(`🔴 Повітряна тривога: ${on.join(', ')}.`, 'bad');
  if (off.length) say(`🟢 Відбій тривоги: ${off.join(', ')}.`, 'ok');
  const now = G.alerts.some(a => a.lvl === 2);
  if (!was && now) emit('voice', 'alarm');
  if (was && !now) emit('voice', 'clear');
}
const okFor = (u, e) => !!u.filt[e.def.kind] && !(e.ident && e.def.decoy);
// цілевказівка від РЛС поруч (≤100 км), що бачить ціль: швидше захоплення; без РЛС — повільніше
function cueK(s, e) { let k = NO_RADAR_K; for (const r of e.seen || []) if (dist(r, s) <= LINK_KM) k = Math.min(k, r.d.cue); return k; }
const samMaxRange = s => Math.max(0, ...Object.entries(s.load).filter(([, n]) => n > 0).map(([k]) => SAM_MSL[k].range));
// найвигідніша ракета: найменша ціна за ймовірне ураження цього типу цілі
function pickMissile(load, tbl, d, kind) {
  let best = null, bs = 1e9;
  for (const [k, n] of Object.entries(load)) {
    const m = tbl[k]; if (!(n > 0) || m.range < d || (kind === 'bal' && !m.bm)) continue;
    const p = mslPk(m, kind); if (p <= 0) continue;
    const s = m.cost / (m.pack || 1) / p;
    if (s < bs) { bs = s; best = m; }
  }
  return best;
}
// захоплення: ціль резервується (eng++) на час прицілювання, щоб інші не стріляли по ній паралельно
function startLock(u, e, t) { if (u.lock) dropLock(u); u.lock = {e, t, t0: t}; e.eng++; snd('lock'); }
function dropLock(u) { if (u.lock) { u.lock.e.eng = Math.max(0, u.lock.e.eng - 1); u.lock = null; } }
// заборонені зони: попередження за 25 і 10 км; у ворожій (Білорусь) нас збиває ППО противника,
// з нейтральної (Молдова, Румунія) літак сам розвертається — порушувати їхній простір не можна
const ZN = {'Білорусь': ['Білорусі', 'Білоруссю'], 'Молдова': ['Молдови', 'Молдовою'], 'Румунія': ['Румунії', 'Румунією']};
const zGen = z => ZN[z.name]?.[0] || z.name, zIns = z => ZN[z.name]?.[1] || z.name;
function byCheck(o, name, dt) {
  if (!ZONES.length) return false;
  const zin = zoneAt(o.x, o.y);
  if (zin) {
    if (!zin.hostile) { if (!o.byTurn) { o.byTurn = true; snd('warn'); say(`⛔ ${name}: порушення повітряного простору ${zGen(zin)} (нейтральна держава) — розвертається!`, 'bad'); } return 'turn'; }
    if (o.byIn == null) { o.byIn = 0; snd('warn'); say(`⛔ ${name} у повітряному просторі ${zGen(zin)} — по ньому працює ППО противника! Негайно назад!`, 'bad'); }
    o.byIn += dt;
    return o.byIn > 6 && Math.random() < dt * .25 ? 'shot' : false;
  }
  o.byIn = null; o.byTurn = false;
  const {z, d: dd} = zoneNear(o);
  // двоступеневе попередження: 25 км — увага, 10 км — «обережно» з банером і голосом
  if (dd < 25 && !o.byNear) { o.byNear = true; say(`ℹ ${name}: до кордону з ${zIns(z)} ${Math.round(dd)} км.`, 'warn'); }
  if (dd < 10 && !o.byWarn) {
    o.byWarn = true; snd('warn'); emit('caution', name, Math.round(dd), zIns(z), z.hostile);
    say(z.hostile ? `⚠ ОБЕРЕЖНО! ${name}: ${Math.round(dd)} км до кордону з ${zIns(z)}. Далі — зона ППО противника, вас зіб'ють! Розверніться.`
      : `⚠ ОБЕРЕЖНО! ${name}: ${Math.round(dd)} км до кордону з ${zIns(z)}. Далі — нейтральна держава, заходити заборонено!`, 'bad');
  }
  if (dd > 15) o.byWarn = false;
  if (dd > 30) o.byNear = false;
  return false;
}
function shotDownBY(o, name) {
  emit('boom', o.x, o.y, 1.5, 16, '#ff5a3a'); emit('burst', o.x, o.y, 16, '#ff7a3a', 3); snd('boom');
  say(`${name} збито ППО противника над ${zGen(zoneNear(o).z).replace(/і$/, 'ю')}.`, 'bad');
}

// радіус вільного полювання від точки чергування, км: винищувачі — далеко, мисливці — ближче
const huntR = d => d.role === 'fighter' ? Math.max(40, Math.min(70, d.radar * .6)) : d.heli ? 20 : 30;
// найкраща ціль для вільного полювання: крилаті ракети й важкі БЧ — першими; дрони без ракет — лише гарматою, якщо наздоганяємо
function huntTarget(a, home) {
  const d = a.d, R = huntR(d), hasMsl = sum(a.load) > 0; let best = null, bs = 1e9;
  for (const e of G.enemies) {
    if (e.dead || !e.det || e.def.kind === 'bal' || e.eng >= 1 || e.alt > d.ceil || !okFor(a, e) || dist(e, home) > R) continue;
    const gunOnly = !hasMsl || !Object.keys(a.load).some(k => a.load[k] > 0 && mslPk(AAM[k], e.def.kind) > 0);
    if (gunOnly && (!a.gun || e.def.kind !== 'drone' || e.v * 3600 > d.dash * .9)) continue;
    if (!gunOnly && intercept(a, e, d.dash / 3600) === null && dist(a, e) > 15) continue; // не наздожене
    const sc = dist(a, e) - (e.def.kind === 'cruise' ? 60 : 0) - (e.def.warhead > 100 ? 25 : 0) - (e.ident && e.def.decoy ? -100 : 0);
    if (sc < bs) { bs = sc; best = e; }
  }
  return best;
}
// крок часу: dt ігрових секунд, ділиться на підкроки ≤ 0,1 с
function tick(gdt) {
  if (!G || G.over || !(gdt > 0)) return;
  detect();
  updateAlerts(gdt);
  const n = Math.ceil(gdt / .1);
  for (let i = 0; i < n && !G.over; i++) step(gdt / n);
}
function step(dt) {
  G.time += dt;
  if (G.phase === 'wave') {
    G.waveT += dt;
    for (const w of G.warns) if (!w.done && w.t <= G.waveT) {
      w.done = true; emit('balwarn', BAL_NAME[w.dir], ENEMY[w.type].short); snd('warn');
      say(`📡 Попередження від західних партнерів: підготовка пуску балістики (${BAL_NAME[w.dir]}). Пуск ≈ через 20 с!`, 'warn');
    }
    for (const ev of G.events) if (!ev.done && ev.t <= G.waveT) { ev.done = true; spawnEnemy(ev.type, ev.dir, null, ev.target); }
  }
  for (const s of G.strikes) if (!s.done && s.eta <= G.time) { s.done = true; applyStrike(s); }
  G.strikes = G.strikes.filter(s => !s.done);
  // противник
  for (const e of G.enemies) {
    if (e.dead) continue;
    if (e.def.recon) {
      if (pIn(e.x, e.y)) { const q = outBY(e); e.x = q.x; e.y = q.y; } // не заходити в заборонені зони
      if (e.wps.length) { if (moveTo(e, e.wps[0].x, e.wps[0].y, e.v, dt)) { e.c = {x: e.x, y: e.y}; e.wps.shift(); } }
      else if (e.loiter > 0) {
        e.loiter -= dt; orbit(e, e.c.x, e.c.y, 6, e.v, dt);
        const s = G.sams.find(s => dist(s, e) < 22) || G.radars.find(r => r.on && dist(r, e) < 30); // РЛС пеленгують здалеку
        if (s && !e.called && (e.spot += dt) > DIFF[G.diff].spot) {
          e.called = true; snd('warn');
          spawnEnemy(G.wave >= 5 ? pick(['iskander', 'iskander', 'kn23']) : 'kh101', null, s);
          say(`⚠ ${e.ident ? e.def.short : 'Розвідувальний БпЛА'} навів удар на позицію ${s.d.name}! Збийте розвідника або перемістіть/демонтуйте ППО.`, 'warn');
        }
      } else if (moveTo(e, e.home.x, e.home.y, e.v, dt)) e.dead = true;
      continue;
    }
    if (e.def.retarget && !e.samT) { // оператор бачить ППО через камеру — перенацілює дрон
      const s = G.sams.find(s => dist(s, e) < 25) || G.radars.find(r => dist(r, e) < 20);
      if (s) { e.samT = s; e.city = null; e.wps = [{x: s.x, y: s.y}]; if (e.det) say(`⚠ ${e.ident ? e.def.short : 'БпЛА'} змінив курс — атакує позицію ${s.d.name}!`, 'warn'); }
    }
    if (e.samT && (G.sams.includes(e.samT) || G.radars.includes(e.samT))) { const w = e.wps.at(-1); w.x = e.samT.x; w.y = e.samT.y; } // мобільна ціль переїхала — дрон доводять
    const w = e.wps[0];
    if (moveTo(e, w.x, w.y, e.v, dt)) { e.wps.shift(); if (!e.wps.length) impact(e); }
    // на розвороті біля кордону радіус повороту міг зачепити заборонену зону — повертаємо на українську сторону
    if (pIn(e.x, e.y)) { const q = outBY(e); e.x = q.x; e.y = q.y; }
  }
  // уламки
  for (const b of G.debris) { b.x += b.vx * dt; b.y += b.vy * dt; b.vx *= .995; b.vy *= .995; if ((b.t -= dt) <= 0) { b.done = true; landDebris(b); } }
  G.debris = G.debris.filter(b => !b.done);
  // РЛС: переїзд
  for (const r of G.radars) if (r.mv && moveTo(r, r.mv.x, r.mv.y, r.d.speed / 3600, dt)) { r.mv = null; say(`${r.d.name}: на новій позиції.`); }
  // ППО
  for (const s of G.sams) {
    const d = s.d;
    s.hot = Math.max(0, s.hot - dt);
    if (s.mv) { if (moveTo(s, s.mv.x, s.mv.y, (d.speed || 20) / 3600, dt)) { s.mv = null; say(`${d.name}: на новій позиції.`); } continue; }
    if (s.reload > 0) {
      if ((s.reload -= dt) <= 0) {
        for (const [k, n] of Object.entries(s.stock)) for (let i = 0; i < n && used(s.load, SAM_MSL) + SAM_MSL[k].size <= d.cap; i++) { s.load[k] = (s.load[k] || 0) + 1; s.stock[k]--; }
      }
      continue;
    }
    if (!used(s.load, SAM_MSL)) {
      dropLock(s);
      if (used(s.stock, SAM_MSL)) s.reload = d.reload;
      else if (s.ai && s.resup > 0) { s.resup--; const m = SAM_MSL[s.ai]; s.stock[m.id] = Math.floor(s.d.cap * 2 / m.size); s.reload = d.reload * 2; } // ШІ: одне підвезення за хвилю
      else if (s.auto && G.res >= price(SAM_MSL[s.buyType]) && !supplyDown(SAM_MSL[s.buyType].sup)) buySam(s, s.buyType, 99);
      continue;
    }
    s.cd -= dt;
    const range = samMaxRange(s), slow = s.hp < 50 ? 2 : 1;
    const can = e => !e.dead && e.det && (e.def.kind !== 'bal' || d.bm) && e.alt >= d.minAlt && e.alt <= d.alt && dist(s, e) <= range
      && pickMissile(s.load, SAM_MSL, dist(s, e), e.def.kind);
    const cap = e => e.def.kind === 'bal' ? 2 : 1; // ракет на ціль одночасно
    if (s.force && (s.force.dead || !G.enemies.includes(s.force))) s.force = null;
    if (s.lock && (s.lock.e.dead || !G.enemies.includes(s.lock.e))) s.lock = null;
    if (s.lock && !can(s.lock.e)) dropLock(s);
    // ручна ціль має пріоритет над поточним захопленням
    if (s.force && can(s.force) && (!s.lock || s.lock.e !== s.force) && s.force.eng < cap(s.force)) startLock(s, s.force, (s.hot ? d.relock : d.react) * slow * cueK(s, s.force));
    if (!s.lock && !(s.force && can(s.force))) { // ручна ціль поза зоною — поки працюємо по інших
      let best = null, bs = 1e9;
      for (const e of G.enemies) {
        if (!okFor(s, e) || e.eng >= cap(e) || !can(e)) continue;
        const score = dist(s, e) - (e.def.kind === 'bal' ? 1000 : e.def.warhead > 100 ? 300 : 0) - (e.samT === s ? 2000 : 0);
        if (score < bs) { bs = score; best = e; }
      }
      if (best) startLock(s, best, (s.hot ? d.relock : d.react) * slow * cueK(s, best));
    }
    if (s.lock && (s.lock.t -= dt) <= 0 && s.cd <= 0) {
      const e = s.lock.e, dd = dist(s, e), m = pickMissile(s.load, SAM_MSL, dd, e.def.kind);
      s.rot = Math.atan2(e.x - s.x, e.y - s.y);
      const pk = mslPk(m, e.def.kind) * (s.hp < 50 ? .8 : 1);
      e.eng--; s.lock = null; // резерв переходить у ракету
      if (m.gun) { gunShot(s, e, pk, `${d.name} (${m.name})`); s.cd = d.gunCd || 4; }
      else { fire(s, e, m.v / 1000, pk, m.range * 1.3, `${d.name} (${m.name})`, m); s.cd = 3; }
      s.load[m.id]--; s.hot = 300; s.fired = true;
    }
  }
  // авіація
  for (const a of G.air) {
    const d = a.d, v = d.cruise / 3600, vd = d.dash / 3600;
    if (a.state === 'base') continue;
    if (a.state === 'service') {
      if (a.ai) { a.feePaid = true; a.load = {...a.want}; a.gun = a.d.gun?.bursts || 0; }
      if (!a.feePaid) { // заправка й обслуговування: 1 ⛁ з борту (+1, якщо нафтобазу зруйновано)
        const fee = 1 + (objDown('fuel') ? 1 : 0);
        if (G.res < fee) { if (!a.feeWarn) { a.feeWarn = true; say(`${d.name}: немає ${fee} ⛁ на пальне й обслуговування — чекає.`, 'bad'); } continue; }
        G.res -= fee; G.spent += fee; a.feePaid = true;
      }
      if ((a.svc -= dt) <= 0) {
        a.state = 'base'; a.fuel = maxFuel(a); serviceRearm(a);
        if (a.autoRet && a.duty && G.phase === 'wave' && !grounded(a) && (sum(a.load) || a.gun || d.role === 'awacs')) {
          a.state = 'move'; a.tx = a.duty.x; a.ty = a.duty.y; a.armed = !!(sum(a.load) || a.gun); say(`${d.name}: обслуговування завершено — повертається на чергування.`, 'ok');
        } else say(`${d.name} готовий до вильоту${grounded(a) ? ` (але пропускає хвилю ${a.groundUntil})` : ''}.`, 'ok');
      }
      continue;
    }
    const bz = byCheck(a, d.name, dt);
    if (bz === 'shot') { a.lost = true; dropLock(a); shotDownBY(a, d.name); continue; }
    if (bz === 'turn' && a.state !== 'rtb') goHome(a, 'вихід із чужого повітряного простору');
    a.fuel -= dt * (a.state === 'intercept' ? 2.5 : 1); a.cd -= dt;
    if (a.state !== 'rtb' && a.fuel < dist(a, BASE) / v + 120) goHome(a, 'мінімальний залишок палива');
    if (a.lock && (a.lock.e.dead || !G.enemies.includes(a.lock.e))) a.lock = null;
    // ракета: захоплення ціллю, потім пуск
    const missile = (e, forced) => {
      if (!e || e.dead || !e.det || e.alt > d.ceil || e.def.kind === 'bal') { if (a.lock && a.lock.e === e) dropLock(a); return false; }
      const dd = dist(a, e), m = pickMissile(a.load, AAM, dd, e.def.kind);
      if (!m || (!forced && !okFor(a, e))) { if (a.lock?.e === e) dropLock(a); return false; }
      if (!a.lock || a.lock.e !== e) { if (a.cd > 0 || e.eng >= 1) return false; startLock(a, e, m.lock); return false; }
      if ((a.lock.t -= dt) > 0) return false;
      e.eng--; a.lock = null;
      fire(a, e, m.v / 1000, mslPk(m, e.def.kind), m.range * 1.3, `${d.name} (${m.name})`, m);
      a.load[m.id]--; a.cd = 4; return true;
    };
    const autoFire = () => {
      if (a.lock) return missile(a.lock.e, false);
      for (const e of G.enemies) if (!e.dead && e.eng < 1 && e.def.kind !== 'bal' && pickMissile(a.load, AAM, dist(a, e), e.def.kind) && okFor(a, e)) { missile(e, false); break; }
      return false;
    };
    // гармата: зближення до ~1 км, ~4 с прицілювання, далі черги кожні 3 с
    const gunAt = e => {
      if (a.gun <= 0) return;
      if (dist(a, e) > (d.heli || d.id === 'yak52' ? 1.2 : 1)) { a.aimT = 0; return; }
      a.aimT += dt;
      const slow = d.role === 'hunter', aim = slow ? 2.5 : 4, rate = slow ? 2.2 : 3;
      if (a.aimT < aim) return;
      if ((a.gunT += dt) >= rate) {
        a.gunT = 0; a.gun--; snd('gun'); emit('tracer', a.x, a.y, e.x, e.y);
        if (Math.random() < gunPk(d, e.def.kind)) { kill(e, `${d.name} (${d.gun.name})`); a.aimT = 0; }
        if (!a.gun) say(`${d.name}: набої скінчились.`, 'warn');
      }
    };
    if (a.state === 'move') { if (moveTo(a, a.tx, a.ty, v, dt)) a.state = 'patrol'; autoFire(); }
    else if (a.state === 'strikeOut') {
      if (moveTo(a, a.tx, a.ty, v, dt)) {
        const site = SITES.find(s => s.id === a.site) || SITES[0];
        launchStrike(site.id, d, Math.max(0, site.km - 140), 1000 / 3600); // Storm Shadow ~1000 км/год
        say(`${d.name}: пуск Storm Shadow по «${site.name}», підліт ~${Math.round((site.km - 140) / 1000 * 60)} хв.`, 'ok');
        a.state = 'rtb'; a.rtbShots = 0;
      }
    } else if (a.state === 'intercept') {
      const e = a.tgt;
      const backToDuty = () => { a.tgt = null; a.aimT = 0; dropLock(a); if (a.duty) { a.state = 'move'; a.tx = a.duty.x; a.ty = a.duty.y; } else { a.state = 'patrol'; a.tx = a.x; a.ty = a.y; } };
      if (!e || e.dead || !G.enemies.includes(e)) { backToDuty(); continue; }
      if (a.auto && a.duty && dist(e, a.duty) > huntR(d) * 1.4) { backToDuty(); continue; } // ціль пішла з зони відповідальності
      // на дрон повільніше — щоб не проскочити і встигнути прицілитись
      const close = dist(a, e) < 5 && e.def.kind === 'drone', sp = close ? Math.min(vd, Math.max(e.v * 1.3, Math.min(vd, 300 / 3600))) : vd;
      const p = lead(a, e, sp); moveTo(a, p.x, p.y, sp, dt);
      if (!missile(e, true) && !pickMissile(a.load, AAM, dist(a, e), e.def.kind)) gunAt(e);
      if (!sum(a.load) && !a.gun) goHome(a, 'боєкомплект вичерпано');
    } else if (a.state === 'patrol') {
      const home = {x: a.tx, y: a.ty};
      if (a.gunMode && a.gun > 0 && a.filt.drone) {
        if (!a.tgt || a.tgt.dead || !G.enemies.includes(a.tgt) || dist(a.tgt, home) > 35 || !a.tgt.det) {
          a.tgt = null; a.aimT = 0; let bd = 30;
          for (const e of G.enemies) if (!e.dead && e.det && e.def.kind === 'drone' && !(e.ident && e.def.decoy) && e.v * 3600 <= d.dash && dist(e, home) < bd) { bd = dist(e, home); a.tgt = e; }
        }
      } else if (a.tgt && !G.enemies.includes(a.tgt)) a.tgt = null;
      if (a.armed && !sum(a.load) && !a.gun) { goHome(a, 'боєкомплект вичерпано'); continue; }
      // вільне полювання: ціль, яку бачимо (своїм радаром чи мережею РЛС), у зоні чергування — сам іде на перехоплення
      if (a.hunt && !(a.tgt && a.gunMode && a.gun > 0) && d.role !== 'awacs') {
        const e = huntTarget(a, home);
        if (e) { a.tgt = e; a.state = 'intercept'; a.auto = true; if (!a.duty) a.duty = home; continue; }
      }
      if (a.tgt && a.gunMode && a.gun > 0) {
        const close = dist(a, a.tgt) < 5, sp = close ? Math.min(vd, Math.max(a.tgt.v * 1.3, Math.min(v, 300 / 3600))) : v;
        const p = lead(a, a.tgt, sp); moveTo(a, p.x, p.y, sp, dt); gunAt(a.tgt);
      } else orbit(a, a.tx, a.ty, d.heli ? 3 : d.role === 'awacs' ? 20 : 8, v, dt);
      autoFire();
    } else if (a.state === 'rtb') {
      if (a.rtbShots > 0 && autoFire()) a.rtbShots--;
      if (moveTo(a, BASE.x, BASE.y, v, dt)) {
        dropLock(a); a.state = 'service'; a.tgt = null; a.aimT = 0; a.feePaid = false; a.feeWarn = false;
        a.svc = 900 * DIFF[G.diff].svcK * (d.svc || 1) * (objDown('base') ? 2 : 1);
        if (DIFF[G.diff].ground && G.wave + 1 < WAVES.length) a.groundUntil = G.wave + 1;
        say(`${d.name} приземлився: дозаправка й обслуговування${a.groundUntil && grounded(a) ? `; за правилами «Ветерана» пропускає хвилю ${a.groundUntil}` : ''}.`);
      }
    }
  }
  G.air = G.air.filter(a => !a.lost);
  // БпЛА
  for (const u of G.uavs) {
    const d = u.d;
    const bz = d.role !== 'kamikaze' && byCheck(u, d.name, dt);
    if (bz === 'shot') { u.gone = true; shotDownBY(u, d.name); continue; }
    if (bz === 'turn') { const q = outBY(u, 8); u.hx = q.x; u.hy = q.y; u.tgt = null; }
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
      if (u.tgt && dist(u, u.tgt) < .2) { u.gone = true; if (Math.random() < uavPk(d)) kill(u.tgt, d.name); else { say(`${d.name}: промах.`); emit('burst', u.x, u.y, 5, '#9f9', 1); } }
      else if (u.fuel <= 0) { u.gone = true; say(`${d.name}: розряджено.`); }
    } else if (moveTo(u, u.tx, u.ty, d.cruise / 3600, dt)) {
      u.gone = true; const site = SITES.find(s => s.id === u.site) || SITES[0];
      launchStrike(site.id, d, Math.max(0, site.km - 140), d.cruise / 3600);
      say(`${d.name} перетнув лінію фронту, до «${site.name}» ~${Math.round((site.km - 140) / d.cruise * 60)} хв.`);
    }
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

  if (G.cities[0].hp <= 0 || lostCities() >= loseLimit()) return endOp(G.mode === 'attack');
  if (G.phase === 'wave' && G.events.every(e => e.done) && G.enemies.length && G.enemies.every(e => e.def.recon)) {
    say(`Ударні цілі скінчились — розвідники (${G.enemies.length}) відходять на свою територію.`);
    G.enemies.forEach(e => { e.dead = true; dropAll(e); }); G.enemies = [];
  }
  if (G.phase === 'wave' && G.events.every(e => e.done) && !G.enemies.length) {
    G.phase = 'deploy';
    if (G.wave >= WAVES.length) return endOp(G.mode !== 'attack');
    if (G.mode === 'attack') {
      const bonus = 100 + G.wave * 25; G.res += bonus; for (const s of G.sams) if (s.ai) { aiFill(s); s.reload = 0; } aiDefend(AI_UNITS[G.diff][1] + (G.wave % 3 === 0 ? 1 : 0));
      for (const c of G.cities) c.hp = c.hp > 0 ? Math.min(c.max, c.hp + c.max * (c.t === 'city' ? .2 : .35)) : c.hp;
      snd('chime'); say(`Хвиля ${G.wave} завершена: влучань ${G.waveHits}, збито ваших засобів ${G.waveLost}. Новий бюджет +${bonus} ⛁. Противник посилив ППО.`, 'ok');
      return;
    }
    const k = Math.max(.4, 1 - .12 * objDown('energy') - .05 * objDown('air') - .08 * objDown('port'));
    const bonus = Math.round((40 + G.wave * 15) * k); G.res += bonus;
    // ремонтні бригади: обʼєкти +40%, міста +10%; склади — через 2 хвилі
    for (const c of G.cities) {
      if (c.t === 'depot') { if (c.hp <= 0 && --c.down <= 0) { c.hp = c.max; say(`${c.name}: відновлено, постачання ${SUP_NAME[c.sup]} поновлено.`, 'ok'); } continue; }
      c.hp = Math.min(c.max, c.hp + c.max * (c.t === 'city' ? .1 : .4));
    }
    emit('alarmEnd'); say(`Відбій тривоги. Хвиля ${G.wave} відбита. +${bonus} ⛁ на посилення${k < 1 ? ` (−${Math.round((1 - k) * 100)}% через зруйновану інфраструктуру)` : ''}.`, 'ok');
  }
}
// зняти всі захоплення й ракети з цілі, що зникла
function dropAll(e) { for (const u of [...G.sams, ...G.air]) if (u.lock?.e === e) u.lock = null; G.shots = G.shots.filter(s => s.e !== e); }
function endOp(win) { G.over = true; G.win = win; emit('end', win); }

// ================= ЕКСПОРТ =================
// У браузері всі імена вище — глобальні. У Node (майбутній сервер) — через require('./sim.js').
// Сервер з кількома кімнатами: перед роботою з кімнатою викликає use(room.state).
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    newGame, command, tick, use: g => { G = g; if (g && g.op && g.op !== OP_ID) setOp(g.op); }, state: () => G, setOp, OPS, op: () => OP,
    SAM, SAM_MSL, AAM, AIR, UAV, RADAR, ENEMY, ATK_COST, WAVES, DIFF, SITES, toXY, toLatLng, inObl, inBY, label, varyRoutes, pkDefault, price, grounded, lostCities, loseLimit,
  };
  // залежать від операції — читаються щоразу наново
  for (const [k, f] of Object.entries({RAIONS: () => RAIONS, ROUTES: () => ROUTES, BASE: () => BASE, CITIES0: () => CITIES0, ZONES: () => ZONES})) Object.defineProperty(module.exports, k, {get: f, enumerable: true});
}
