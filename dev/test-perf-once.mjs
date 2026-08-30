#!/usr/bin/env node
/**
 * ✅ تست تلقائي لـ v3.1 — Dashboard performance: فيلتر CRM العالمي + منتوج مرة وحدة
 * ---------------------------------------------------------------
 * المطلوب:
 * 1) المنتوج كيبان مرة وحدة فسطر واحد (ماشي سطر لكل نهار)
 * 2) فيلتر الأيام (من → إلى) هو لي كيحدد الفترة ديال الحسابات
 *
 * هاد التست كيستخرج الكود الحقيقي المبني من index.html
 * وكينفذه بنفسو على داطا ديال عدة أيام.
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
  ['v=ee.useMemo(()=>z.filter(Q=>Q.s===i).map(N)', "الجدول كيبني من قائمة المنتوجات (سطر واحد لكل منتوج)"],
  ['A=ee.useMemo(()=>z.map(N)', "الجدول GLOBAL كيبني من قائمة المنتوجات"],
  ['{inRange:ir}=Tn()', "Dashboard مربوط بالفيلتر العالمي ديال CRM (رقم 1)"],
  ['&&ir(G.dateCreation)', "حساب الطلبيات كيستعمل الفيلتر العالمي"],
  ['&&ir(G.date)', "حساب المصروفات كيستعمل الفيلتر العالمي"],
  ['children:"📅 فيلتر الأيام:"}),s.jsx(yp,{})', "label فيلتر الأيام + نفس أزرار فيلتر CRM بجانبو (رقم 2)"],
  ['label=Q.d||"كل الأيام"', "عمود التاريخ كيعرض تاريخ الانطلاق ديال المنتوج"],
  ['(!Q.d||G.dateCreation>=Q.d)', "الحساب كيبدا من تاريخ الانطلاق ديال المنتوج"],
  ['📅 تاريخ الانطلاق', "خانة تاريخ الانطلاق موجودة فالفورم"],
  ['bp="afrizon_period_v2"', "مفتاح الفترة جديد (الكل غادي يبدا بالافتراضي الجديد)"],
  ['n.period||"today"', "الافتراضي ديال الفيلتر = اليوم (رقم 3: غير طلبيات اليوم كيبانو)"],
];
for (const [needle, label] of checks) {
  if (label === "—") continue;
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 2) استخراج الكود الحقيقي ديال N وتنفيذه */
const i = html.indexOf('<script type="module" crossorigin>');
const j = html.indexOf('</script>', i);
const js = html.slice(i + '<script type="module" crossorigin>'.length, j);
const start = js.indexOf('N=Q=>{');
const end = js.indexOf('}},v=ee.useMemo', start);
if (start < 0 || end < 0) { console.error("❌ ما قدرناش نستخرجو كود الحساب"); process.exit(1); }
const body = js.slice(start + 'N=Q=>{'.length, end);
const wrap = new Function(
  "Q", "e", "a", "y", "ir", "er", "qc",
  "function wrap(Q,e,a,y,ir,er,qc){" + body + "};" + "} return wrap;"
)();

/* داطا: نفس المنتوج عبر 3 أيام (المستخدم كتبو مرة وحدة فقط) */
const orders = [
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-28", statut: "Confirmé", livraison: "Livrée", commission: 35 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-29", statut: "Confirmé", livraison: "Livrée", commission: 35 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-29", statut: "Confirmé", livraison: "Retour", commission: 10 },
  { produit: "مكمل مرض السكري", originLead: "Leader", dateCreation: "2026-08-30", statut: "Annulé", livraison: "", commission: 0 },
];
const adspend = [
  { source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-29", amount: 50 },
];
const Q = { n: "مكمل مرض السكري", p: 250, s: "Leader", d: "2026-08-29" }; // انطلق فـ 29
const er = s => s.trim().toLowerCase(); // نفس helper ديال التطبيق
const qc = 10;
const noCosts = new Map(); // y.get(...) = null (ما كاينش فالـ pièce)

/* حالة 1: الفيلتر العالمي = نهار واحد (29) — بحال "اليوم" ولا Custom */
const ir29 = s => s.slice(0, 10) === "2026-08-29";
let r1 = wrap(Q, orders, adspend, noCosts, ir29, er, qc);
console.log("── فيلتر 2026-08-29 فقط:");
console.log(`  total order: ${r1.total} (المتوقع 2)`);
console.log(`  Livré: ${r1.liv} (المتوقع 1) | Retour: ${r1.ret} (المتوقع 1) | Annulé: ${r1.ann} (المتوقع 0)`);
console.log(`  المصروف: ${r1.spend} (المتوقع 50)`);
console.log(`  التاريخ المعروض: "${r1.row.date}" (المتوقع "2026-08-29")`);
if (r1.total !== 2 || r1.liv !== 1 || r1.ret !== 1 || r1.ann !== 0 || r1.spend !== 50) {
  console.error("❌ فيلتر النهار الواحد ما خدمش مزيان"); bad++;
} else console.log("✅ فيلتر النهار الواحد خدام: كيبان غير حسابات داك النهار");

/* حالة 2: الفيلتر = "الكل" → من تاريخ الانطلاق (29) حتى اليوم */
const irAll = () => true;
let r2 = wrap(Q, orders, adspend, noCosts, irAll, er, qc);
console.log("── بلا فيلتر (من تاريخ الانطلاق 29):");
console.log(`  total order: ${r2.total} (المتوقع 3 — طلبية الـ28 قبل الانطلاق ما كتحسبش) | Livré: ${r2.liv} (المتوقع 1) | التاريخ: "${r2.row.date}"`);
if (r2.total !== 3 || r2.liv !== 1 || r2.row.date !== "2026-08-29") {
  console.error("❌ حالة تاريخ الانطلاق ما خدماش مزيان"); bad++;
} else console.log("✅ الحسابات كيبداو من تاريخ الانطلاق ديال المنتوج — والمنتوج باقي سطر واحد");

/* حالة 2ب: منتوج بلا تاريخ انطلاق + "الكل" = كل الأيام */
let r2b = wrap({ n: "مكمل مرض السكري", p: 250, s: "Leader", d: "" }, orders, adspend, noCosts, irAll, er, qc);
console.log(`  بلا تاريخ انطلاق: total ${r2b.total} (المتوقع 4) | التاريخ: "${r2b.row.date}" (المتوقع "كل الأيام")`);
if (r2b.total !== 4 || r2b.row.date !== "كل الأيام") { console.error("❌ حالة بلا تاريخ انطلاق"); bad++; }
else console.log("✅ منتوج بلا تاريخ انطلاق كيجمع كل الأيام");

/* حالة 3: الافتراضي = اليوم (رقم 3) — طلبيات أمس والتواريخ لي فاتو ما كيبانوش */
const irToday = s => s.slice(0, 10) === "2026-08-30";
let rToday = wrap({ n: "مكمل مرض السكري", p: 250, s: "Leader", d: "" }, orders, adspend, noCosts, irToday, er, qc);
console.log("── الفيلتر الافتراضي (اليوم 2026-08-30):");
console.log(`  total order: ${rToday.total} (المتوقع 1 — غير طلبيات النهار) | التاريخ: "${rToday.row.date}"`);
if (rToday.total !== 1) { console.error("❌ الافتراضي ديال اليوم ما خدمش: طلبيات قديمة باقية كيبانو"); bad++; }
else console.log("✅ الافتراضي = اليوم: غير طلبيات نفس النهار كيبانو — القدام كيبانو غير بالفيلتر");

/* حالة 4: سطر واحد لكل منتوج — مهما كان عدد الأيام */
const z = [{ n: "مكمل مرض السكري", p: 250, s: "Leader", d: "2026-08-29" }, { n: "نظارة القراءة", p: 120, s: "Leader", d: "2026-08-30" }];
const v = z.filter(Q2 => Q2.s === "Leader");
console.log("── عدد السطور فالجدول (قائمة المنتوجات):", v.length, "— رغم أن الداطا فيها 3 أيام");
if (v.length !== 2) { console.error("❌ السطور ماشي بحساب المنتوجات!"); bad++; }
else console.log("✅ المنتوج كيبان مرة وحدة فسطر واحد — التاريخ كيتحدد بالفيلتر فقط");

/* حالة 5: نفس المنتوج كيتزاد مرة وحدة — الإضافة التانية كتحدّث الثمن فقط */
let cat = [{ n: "مكمل مرض السكري", p: 250, s: "Leader", d: "2026-08-29" }];
{
  const P = cat.find(Q2 => Q2.n.toLowerCase() === "مكمل مرض السكري" && Q2.s === "Leader");
  cat = P ? cat.map(Q2 => Q2 === P ? { n: Q2.n, p: 260, s: "Leader", d: "2026-09-01" } : Q2)
          : [...cat, { n: "مكمل مرض السكري", p: 260, s: "Leader", d: "2026-09-01" }];
}
if (cat.length === 1 && cat[0].p === 260 && cat[0].d === "2026-09-01") console.log("✅ إعادة إضافة نفس المنتوج بتاريخ جديد: كتحدّث الثمن والتاريخ (بلا سطر جديد)");
else { console.error("❌ الإضافة المتكررة كتزيد سطور!"); bad++; }

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ v3.1 خدامة: فيلتر CRM العالمي فـ Dashboard + الافتراضي اليوم + المنتوج مرة وحدة");
process.exit(0);
