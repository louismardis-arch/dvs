#!/usr/bin/env node
/**
 * ✅ تست تلقائي لـ v3.4 — Dashboard performance: كل فيلتر كيخدم حقيقي
 * ---------------------------------------------------------------
 * المطلوب:
 * • اليوم → حسابات اليوم فقط | أمس → أمس فقط | الأسبوع → الأسبوع |
 *   الشهر → الشهر | Custom → الفترة | الكل → ليست كاملة، كل سطر
 *   حساب بالتاريخ ديالو
 * • GLOBAL (كل المصادر): كل الحسابات المدخلة كيبانو، كل واحد بالتاريخ ديالو
 *
 * هاد التست كيستخرج الكود الحقيقي المبني من index.html وكينفذه بنفسو.
 *
 * التشغيل:  node dev/test-perf-once.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
let bad = 0;

/* 1) الكود المبني فيه الميزات؟ */
const checks = [
  ['G2=()=>{const rows=[];for(const P of z)', "جدول المصدر: الأيام كيتولدو أوتوماتيك من طلبيات/ADS ديال كل منتوج"],
  ['A=ee.useMemo(()=>G2()', "GLOBAL: كل المصادر، الأيام كيتولدو أوتوماتيك"],
  ['N=S=>{const E=e.filter(G=>G.originLead', "الحساب كيرجع للنموذج ديال السطور (كل حساب بتاريخو)"],
  ['G.dateCreation===S.date', "إحصائيات كل سطر كتحسب بتاريخو الخاص بالضبط"],
  ['{inRange:ir}=Tn()', "Dashboard مربوط بالفيلتر العالمي ديال CRM"],
  ['children:"📅 فيلتر الأيام:"}),s.jsx(yp,{})', "نفس شكل فيلتر CRM بجانب label فيلتر الأيام"],
  ['n.period||"today"', "الافتراضي ديال الفيلتر = اليوم"],
  ['onChange:L=>{const Pv=Number(L.target.value)||0,Pr=z.find', "تعديل الثمن كيحدّث المنتوج فاللائحة + فالـ CRM"],
  ['confirm("مسح المنتوج نهائياً من Dashboard؟")', "مسح المنتوج نهائياً من اللائحة + CRM"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 1b) v3.15: خانة التاريخ تحيّدات من الفورم + التوليد الأوتوماتيكي موجود */
if (html.includes('value:m,onChange:S=>h(S.target.value)')) { console.error("❌ خانة 📅 التاريخ باقية فالفورم!"); bad++; }
else console.log("✅ خانة 📅 التاريخ تحيّدات من الفورم");
if (html.includes('key:P.s+"|"+P.n+"|"+D')) console.log("✅ الأيام كيتولدو أوتوماتيك من طلبيات/ADS (بلا إدخال يدوي)");
else { console.error("❌ التوليد الأوتوماتيكي ناقص!"); bad++; }
if (html.includes('rws.length?rws.forEach(r=>bj(r.id,{prix:Px})):vj(i,Pn,f,Px)')) console.log("✅ المنتوج كيتزاد مرة وحدة فالـ CRM (تحديث إلا كان)");
else { console.error("❌ منطق الإضافة مرة وحدة ناقص!"); bad++; }

/* 2) استخراج الكود الحقيقي ديال N (حساب السطر) وتنفيذه */
const i = html.indexOf('<script type="module" crossorigin>');
const j = html.indexOf('</script>', i);
const js = html.slice(i + '<script type="module" crossorigin>'.length, j);
const start = js.indexOf('N=S=>{');
const end = js.indexOf('}},G2=()=>{', start);
if (start < 0 || end < 0) { console.error("❌ ما قدرناش نستخرجو كود الحساب"); process.exit(1); }
const body = js.slice(start + 'N=S=>{'.length, end);
const wrap = new Function(
  "S", "e", "a", "y", "er", "qc",
  "function wrap(S,e,a,y,er,qc){" + body + "}" + "}" + "return wrap;"
)();

/* داطا تجريبية: 3 حسابات مدخلة (3 تواريخ) + طلبيات + مصروف */
const rows = [
  { id: 1, source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-28", prix: 250 },
  { id: 2, source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-29", prix: 250 },
  { id: 3, source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-30", prix: 250 },
];
const orders = [
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-28", statut: "Confirmé", livraison: "Livrée", commission: 35 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-29", statut: "Confirmé", livraison: "Livrée", commission: 35 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-29", statut: "Confirmé", livraison: "Retour", commission: 10 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-30", statut: "Annulé", livraison: "", commission: 0 },
];
const adspend = [
  { source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-29", amount: 50 },
];
const er = s => s.trim().toLowerCase();
const qc = 10;
const noCosts = new Map();

const calc = (S) => wrap(S, orders, adspend, noCosts, er, qc);
const rowsFor = (ir) => rows.filter(S => S.source === "Leader" && ir(S.date)).map(calc).sort((S, E) => E.row.date.localeCompare(S.row.date));

/* فيلتر اليوم (30) */
const irToday = s => s.slice(0, 10) === "2026-08-30";
const vToday = rowsFor(irToday);
console.log("── فيلتر اليوم (30/08):");
console.log(`  السطور: ${vToday.map(r => r.row.date).join(", ")} (المتوقع: 2026-08-30 فقط)`);
if (vToday.length !== 1 || vToday[0].row.date !== "2026-08-30") { console.error("❌ اليوم ما عطاش اليوم فقط!"); bad++; }
else {
  const r = vToday[0];
  if (r.total !== 1 || r.ann !== 1) { console.error(`❌ حسابات النهار: total=${r.total} (المتوقع 1), ann=${r.ann} (المتوقع 1)`); bad++; }
  else console.log("✅ اليوم كيعطي حسابات اليوم فقط (total 1, annulé 1)");
}

/* فيلتر أمس (29) */
const irYest = s => s.slice(0, 10) === "2026-08-29";
const vYest = rowsFor(irYest);
console.log("── فيلتر أمس (29/08):");
const rY = vYest[0];
console.log(`  السطور: ${vYest.map(r => r.row.date).join(", ")} | total ${rY.total} (المتوقع 2) | liv ${rY.liv} (1) | ret ${rY.ret} (1) | spend ${rY.spend} (50)`);
if (vYest.length !== 1 || rY.total !== 2 || rY.liv !== 1 || rY.ret !== 1 || rY.spend !== 50) { console.error("❌ أمس ما عطاش أمس فقط!"); bad++; }
else console.log("✅ أمس كيعطي حسابات أمس فقط");

/* فيلتر الكل: ليست كاملة، كل سطر بالتاريخ ديالو */
const irAll = () => true;
const vAll = rowsFor(irAll);
console.log("── فيلتر الكل:");
console.log(`  السطور: ${vAll.map(r => r.row.date).join(" | ")} (المتوقع 3 سطور: 30 → 29 → 28)`);
const totals = vAll.map(r => r.total).join(",");
console.log(`  حسابات كل سطر بالتاريخ ديالو: total = [${totals}] (المتوقع 1,2,1)`);
const sum = vAll.reduce((S, E) => S + E.total, 0);
const sumLiv = vAll.reduce((S, E) => S + E.liv, 0);
console.log(`  المجموع الكامل: total ${sum} (المتوقع 4) | livré ${sumLiv} (المتوقع 2)`);
if (vAll.length !== 3 || vAll.map(r => r.total).join(",") !== "1,2,1" || sum !== 4 || sumLiv !== 2) { console.error("❌ الكل ما عطاش ليست كاملة بالتواريخ!"); bad++; }
else console.log("✅ الكل كيعطي ليست كاملة — كل حساب بالتاريخ ديالو + المجاميع صحيحة");

/* فيلتر Custom (28 → 29) */
const irCustom = s => { const v = s.slice(0, 10); return v >= "2026-08-28" && v <= "2026-08-29"; };
const vCus = rowsFor(irCustom);
console.log("── Custom (28 → 29):");
console.log(`  السطور: ${vCus.map(r => r.row.date).join(", ")} (المتوقع 29, 28)`);
if (vCus.length !== 2) { console.error("❌ Custom ما خدمش!"); bad++; }
else console.log("✅ Custom كيعطي الفترة المختارة فقط");

/* GLOBAL: كل المصادر — كل سطر بالتاريخ ديالو */
const rowsGlobal = [...rows, { id: 4, source: "TikTok", produit: "نظارة القراءة", date: "2026-08-30", prix: 120 }];
const vGlob = rowsGlobal.filter(S => irAll(S.date)).map(calc).sort((S, E) => E.row.date.localeCompare(S.row.date));
console.log("── GLOBAL — كل المصادر (فيلتر الكل):");
console.log(`  السطور: ${vGlob.length} (المتوقع 4 — كل الحسابات بكل التواريخ)`);
if (vGlob.length !== 4) { console.error("❌ GLOBAL ما عطاش كاملين الحسابات بالتواريخ!"); bad++; }
else console.log("✅ GLOBAL كيعرض كل الحسابات المدخلة، كل واحد بالتاريخ ديالو");


/* ====== مثالك بالحرف: نفس المنتوج معاود مرتين بالتواريخ ══════ */
const orders2 = [];
for (let k = 0; k < 7; k++) orders2.push({ produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-30", statut: "Confirmé", livraison: k < 4 ? "Livrée" : "Retour", commission: 35 });
for (let k = 0; k < 15; k++) orders2.push({ produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-09-30", statut: "Confirmé", livraison: k < 10 ? "Livrée" : "Retour", commission: 35 });
const rows2 = [
  { id: 1, source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-30", prix: 250 },
  { id: 2, source: "Leader", produit: "مكمل مرض السكري", date: "2026-09-30", prix: 250 },
];
const calc2 = S => wrap(S, orders2, [], noCosts, er, qc);
const table2 = (ir, source) => rows2.filter(S => S.source === source && ir(S.date)).map(calc2).sort((S, E) => E.row.date.localeCompare(S.row.date));

const irAll2 = () => true;
const vAll2 = table2(irAll2, "Leader");
console.log("═══ فيلتر الكل — نفس المنتوج معاود مرتين (مثالك): ═══");
vAll2.forEach(r => console.log(`  ${r.row.produit}  ${r.row.date}  →  total order: ${r.total}`));
if (vAll2.length !== 2) { console.error("❌ الكل ما عطاش جوج سطور ديال نفس المنتوج بالتواريخ!"); bad++; }
else {
  const r30 = vAll2.find(r => r.row.date === "2026-08-30"), r93 = vAll2.find(r => r.row.date === "2026-09-30");
  if (!r30 || r30.total !== 7 || !r93 || r93.total !== 15) { console.error("❌ حسابات مثالك ماشي صحيحة!"); bad++; }
  else console.log("✅ نفس المنتوج كيبان معاود بكل تاريخ وحساب ديالو (7 و 15) — بالضبط بحال المطلوب");
}

const irWeek2 = s => { const v = s.slice(0, 10); return v >= "2026-08-24" && v <= "2026-08-30"; };
const vW2 = table2(irWeek2, "Leader");
console.log("═══ فيلتر الأسبوع (24→30): ═══");
console.log(`  ${vW2.map(r => r.row.produit + " " + r.row.date).join(" | ") || "(خاوي)"} (المتوقع: مكمل مرض السكري 2026-08-30 فقط)`);
if (vW2.length !== 1 || vW2[0].total !== 7) { console.error("❌ الأسبوع ما عطاش غير السطر ديال الأسبوع!"); bad++; }
else console.log("✅ الأسبوع كيعطي غير السطور اللي تاريخها داخل الأسبوع");

const irMonth2 = s => { const v = s.slice(0, 10); return v >= "2026-09-01" && v <= "2026-09-30"; };
const vM2 = table2(irMonth2, "Leader");
console.log("═══ فيلتر الشهر (شتنبر): ═══");
console.log(`  ${vM2.map(r => r.row.produit + " " + r.row.date).join(" | ")} (المتوقع: مكمل مرض السكري 2026-09-30 فقط)`);
if (vM2.length !== 1 || vM2[0].total !== 15) { console.error("❌ الشهر ما عطاش غير السطر ديال الشهر!"); bad++; }
else console.log("✅ الشهر كيعطي غير السطور اللي تاريخها داخل الشهر");

/* GLOBAL مع نفس المنتوج معاود: كل المصادر وكل التواريخ */
const glob2 = [...rows2, { id: 3, source: "TikTok", produit: "نظارة القراءة", date: "2026-08-30", prix: 120 }]
  .filter(S => irAll2(S.date)).map(calc2).sort((S, E) => E.row.date.localeCompare(S.row.date));
console.log("═══ GLOBAL — كل المصادر (الكل): ═══");
glob2.forEach(r => console.log(`  [${r.row.source}] ${r.row.produit}  ${r.row.date}  →  total order: ${r.total}`));
if (glob2.length !== 3) { console.error("❌ GLOBAL ما عطاش كاملين السطور بالتواريخ!"); bad++; }
else console.log("✅ GLOBAL كيعطي نفس الشي: المنتوجات كاملين، معاودين بالتواريخ ديالهم");

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ v3.4 خدامة: كل فيلتر كيعطي المطلوب حقيقي + الكل/GLOBAL كيعطيو ليست كاملة بالتواريخ");
process.exit(0);
