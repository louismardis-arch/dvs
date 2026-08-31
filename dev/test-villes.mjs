#!/usr/bin/env node
/**
 * ✅ تست تلقائي لصفحة LES VILLES — تحليل المدن (v3.8)
 * ---------------------------------------------------------------
 * المطلوب:
 * • تحليل المدن كامل ومحسوب أوتوماتيك من الطلبيات:
 *   الطلبيات / Confirmé / Annulé / En cours / Livré / Retour /
 *   المبيعات / رسوم التوصيل / UPSEL / نسبة التسليم
 * • سطر "المجموع" فالأخير
 * • ترتيب (طلبيات / مبيعات / تسليم) + بحث
 * • إضافة مدينة = الاسم + تمن التوصيل فقط
 * • الثمن كيتطبق على CRM كامل (commision + LIVRAISON frais)
 *
 * التشغيل:  node dev/test-villes.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
let bad = 0;

/* 1) الصفحة الجديدة موجودة فالكود المبني */
const checks = [
  ["LES VILLES — تحليل المدن", "عنوان الصفحة المدمجة"],
  ["📊 تحليل المدن", "بلوك تحليل المدن"],
  ["زيد مدينة ماشي فالـ CRM", "بلوك إضافة مدينة"],
  ["الاسم + تمن التوصيل فقط", "توضيح: الإضافة بالاسم + الثمن فقط"],
  ["كيتطبق على CRM كامل", "توضيح: الثمن كيتطبق على CRM كامل"],
  ["UPSEL (DH)", "عمود UPSEL"],
  ["Annulé", "عمود Annulé"],
  ["En cours", "عمود En cours"],
  ["التسليم %", "عمود نسبة التسليم"],
  ["children:\"المجموع\"", "سطر المجموع"],
  ["ترتيب:", "كونترول الترتيب"],
  ["إجمالي الطلبيات", "كارت إجمالي الطلبيات"],
  ["مدن عندها طلبيات", "كارت المدن النشطة"],
  ["📋 لائحة المدن والتمن (", "اللائحة الكاملة (قابلة للطي)"],
  ["Ville — تمن التوصيل أوتوماتيكي", "حقل المدينة فـ LIVRAISON مع أوتوفيل"],
  ["liv-villes", "datalist المدن فـ LIVRAISON"],
  ["p=wo(v,cities)", "الأوتوفيل كيستعمل نفس نظام LES VILLES"],
  ["📈 المبيعات حسب المدينة", "v3.9.2: رسم بياني المبيعات حسب المدينة"],
  ["أعلى 8 مدن — محسوب أوتوماتيك من الطلبيات", "v3.9.2: الرسم محسوب أوتوماتيك (أعلى 8)"],
  ["chart=[...an].sort((A,D)=>D.ca-A.ca).slice(0,8)", "v3.9.2: ترتيب الرسم بالأعلى مبيعات"],
  ["bg-gradient-to-l from-blue-500 to-indigo-500", "v3.9.2: أعمدة الرسم بتدرج أزرق"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 2) تنفيذ الكود الحقيقي المبني: حساب التحليل (an) من $_ */
const i1 = html.indexOf('<script type="module" crossorigin>');
const j1 = html.indexOf("</script>", i1);
const js = html.slice(i1 + '<script type="module" crossorigin>'.length, j1);

const erStart = js.indexOf("function er(e){");
const erEnd = js.indexOf("const Ap=", erStart);
const erFn = new Function(js.slice(erStart, erEnd) + "return er;")();

const anStart = js.indexOf("an=ee.useMemo(()=>{const M=new Map");
const anEnd = js.indexOf("},[o,so])", anStart);
if (anStart < 0 || anEnd < 0) { console.error("❌ ما لقيتش حساب التحليل فالكود!"); bad++; }
else {
  const body = js.slice(anStart + "an=ee.useMemo(()=>".length, anEnd + 1);
  const makeAn = new Function("o", "so", "er", "function wrap(o){" + body + "}" + "return wrap;")(null, "n", erFn);
  const orders = [
    { ville: "Agadir", statut: "Confirmé", livraison: "Livrée", qte: 1, prix: 200, commission: 25, upsell: 30 },
    { ville: "Agadir", statut: "Confirmé", livraison: "Livrée", qte: 2, prix: 150, commission: 25, upsell: 0 },
    { ville: "Agadir", statut: "Confirmé", livraison: "Retour", qte: 1, prix: 180, commission: 25, upsell: 0 },
    { ville: "Casablanca", statut: "Annulé", livraison: "", qte: 1, prix: 100, commission: 40, upsell: 0 },
    { ville: "tanger", statut: "", livraison: "", qte: 1, prix: 250, commission: 40, upsell: 0 },
  ];
  const an = makeAn(orders);
  const ag = an.find(r => r.ville.toLowerCase() === "agadir");
  const ca = an.find(r => r.ville.toLowerCase() === "casablanca");
  const ok =
    an.length === 3 &&
    ag && ag.n === 3 && ag.conf === 3 && ag.liv === 2 && ag.ret === 1 && ag.ann === 0 &&
    ag.up === 30 && ag.fr === 75 && ag.ca === 200 + 300 + 180 &&
    ca && ca.ann === 1 &&
    an[0].ville.toLowerCase() === "agadir"; // ترتيب "n" تنازلي
  if (ok) {
    console.log(`✅ التحليل الحقيقي: Agadir → 3/3 Confirmé / Livré 2 / Retour 1 / UPSEL 30 / مبيعات ${ag.ca} / رسوم 75 — وCasablanca Annulé 1 — ترتيب تنازلي`);
  } else { console.error("❌ التحليل ما خدمش:", JSON.stringify(an)); bad++; }
  /* الترتيب بـ ca و liv */
  const byCa = new Function("o", "so", "er", "function wrap(o){" + body + "}" + "return wrap;")(null, "ca", erFn)(orders);
  if (byCa[0].ville.toLowerCase() === "agadir") console.log("✅ ترتيب بالأعلى مبيعات كيخدم (Agadir أولاً بـ 680)");
  else { console.error("❌ ترتيب المبيعات ما خدمش:", byCa.map(r => r.ville)); bad++; }
}

/* 3) تنفيذ wo (نفس الكود المبني) — ربط LIVRAISON */
const woStart = js.indexOf("function wo(e,n){");
const woEnd = js.indexOf("let So=null", woStart);
if (erStart < 0 || woStart < 0) { console.error("❌ ما لقيتش wo/er فالكود!"); bad++; }
else {
  const apEnd = js.indexOf(";", js.indexOf("أولوز:", erEnd));
  const Ap = new Function(js.slice(erEnd, apEnd + 1) + "return Ap;")();
  const woFn = new Function("er", "Ap", js.slice(woStart, woEnd) + "return wo;")(erFn, Ap);
  const cities = [{ nom: "Agadir", prix: 25 }, { nom: "Tanger", prix: 40 }, { nom: "Marrakech", prix: 35 }];
  const t1 = woFn("Agadir", cities), t2 = woFn("tanger", cities), t3 = woFn("اكادير", cities), t4 = woFn("درعة", cities);
  if (t1 === 25 && t2 === 40 && t3 === 25 && t4 === null) {
    console.log("✅ wo (ربط LIVRAISON): Agadir→25, tanger→40, اكادير→25 (عربي), درعة→null (تكتب الثمن يدوياً)");
  } else { console.error("❌ wo ما خدمش:", [t1, t2, t3, t4]); bad++; }
  const handler = (f, v) => { const p = woFn(v, cities); return { ...f, ville: v, frais: p != null ? String(p) : f.frais }; };
  let f = { ville: "", frais: "0" };
  f = handler(f, "Agadir");
  const step1 = f.frais === "25";
  f = handler(f, "درعة"); f = { ...f, frais: "55" };
  const step2 = f.frais === "55";
  f = handler(f, "Marrakech");
  const step3 = f.frais === "35";
  if (step1 && step2 && step3) {
    console.log("✅ أوتوفيل frais فـ LIVRAISON: مدينة معروفة → أوتوماتيك (25)، مجهولة → يدوي (55)، تبديل → الثمن الجديد (35)");
  } else { console.error("❌ أوتوفيل frais ما خدمش:", f); bad++; }
}

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ LES VILLES + تحليل المدن (v3.8) خدامة: تحليل كامل + المجموع + الترتيب + التطبيق على CRM كامل");
process.exit(0);
