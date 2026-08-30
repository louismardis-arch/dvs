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
  ['v=ee.useMemo(()=>n.filter(S=>S.source===i&&ir(S.date)).map(N)', "جدول المصدر: السطور المدخلة + الفيلتر، كل سطر بالتاريخ ديالو"],
  ['A=ee.useMemo(()=>n.filter(S=>ir(S.date)).map(N)', "GLOBAL: كل المصادر، كل سطر حساب بالتاريخ ديالو"],
  ['N=S=>{const E=e.filter(G=>G.originLead', "الحساب كيرجع للنموذج ديال السطور (كل حساب بتاريخو)"],
  ['G.dateCreation===S.date', "إحصائيات كل سطر كتحسب بتاريخو الخاص بالضبط"],
  ['{inRange:ir}=Tn()', "Dashboard مربوط بالفيلتر العالمي ديال CRM"],
  ['children:"📅 فيلتر الأيام:"}),s.jsx(yp,{})', "نفس شكل فيلتر CRM بجانب label فيلتر الأيام"],
  ['n.period||"today"', "الافتراضي ديال الفيلتر = اليوم"],
  ['onChange:L=>bj(C.row.id,{prix:Number(L.target.value)||0})', "تعديل الثمن على السطر مباشرة"],
  ['confirm("مسح السطر؟")&&yj(C.row.id)', "مسح السطر مباشرة"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 2) استخراج الكود الحقيقي ديال N (حساب السطر) وتنفيذه */
const i = html.indexOf('<script type="module" crossorigin>');
const j = html.indexOf('</script>', i);
const js = html.slice(i + '<script type="module" crossorigin>'.length, j);
const start = js.indexOf('N=S=>{');
const end = js.indexOf('}},v=ee.useMemo', start);
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

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ v3.4 خدامة: كل فيلتر كيعطي المطلوب حقيقي + الكل/GLOBAL كيعطيو ليست كاملة بالتواريخ");
process.exit(0);
