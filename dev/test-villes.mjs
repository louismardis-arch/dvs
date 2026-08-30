#!/usr/bin/env node
/**
 * ✅ تست تلقائي لصفحة LES VILLES — تحليل المدن (v3.7)
 * ---------------------------------------------------------------
 * المطلوب:
 * • دمج "تحليل المدن" مع صفحة Les villes
 * • إضافة مدينة = الاسم + تمن التوصيل فقط
 * • تمن التوصيل كيتطبق على CRM كامل: الطلبيات (commision) + LIVRAISON (frais)
 * • تحليل كل مدينة من الطلبيات: عدد، Confirmé، Livré، Retour، المبيعات، نسبة التسليم
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
  ["نسبة التسليم", "عمود نسبة التسليم"],
  ["رسوم التوصيل (DH)", "كارت إجمالي رسوم التوصيل"],
  ["مدن عندها طلبيات", "كارت المدن النشطة"],
  ["📋 لائحة المدن والتمن (", "اللائحة الكاملة (قابلة للطي)"],
  ["Ville — تمن التوصيل أوتوماتيكي", "حقل المدينة فـ LIVRAISON مع أوتوفيل"],
  ["liv-villes", "datalist المدن فـ LIVRAISON"],
  ["✔ تمن التوصيل أوتوماتيكي من LES VILLES", "رسالة التأكيد ديال الأوتوفيل"],
  ["p=wo(v,cities)", "الأوتوفيل كيستعمل نفس نظام LES VILLES"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 2) تنفيذ الكود الحقيقي المبني: حساب التحليل (an) من $_ */
const i1 = html.indexOf('<script type="module" crossorigin>');
const j1 = html.indexOf("</script>", i1);
const js = html.slice(i1 + '<script type="module" crossorigin>'.length, j1);

/* استخراج er مبكراً (كيحتاجو التحليل و wo) */
const erStart = js.indexOf("function er(e){");
const erEnd = js.indexOf("const Ap=", erStart);
const erFn = new Function(js.slice(erStart, erEnd) + "return er;")();

const anStart = js.indexOf("an=ee.useMemo(()=>{const M=new Map");
const anEnd = js.indexOf("},[o])", anStart);
if (anStart < 0 || anEnd < 0) { console.error("❌ ما لقيتش حساب التحليل فالكود!"); bad++; }
else {
  const body = js.slice(anStart + "an=ee.useMemo(()=>".length, anEnd + 1);
  const makeAn = new Function("o", "er", "function wrap(o){" + body + "}" + "return wrap;")(null, erFn);
  const orders = [
    { ville: "Agadir", statut: "Confirmé", livraison: "Livrée", qte: 1, prix: 200, commission: 25 },
    { ville: "Agadir", statut: "Confirmé", livraison: "Livrée", qte: 2, prix: 150, commission: 25 },
    { ville: "Agadir", statut: "Confirmé", livraison: "Retour", qte: 1, prix: 180, commission: 25 },
    { ville: "Casablanca", statut: "Annulé", livraison: "", qte: 1, prix: 100, commission: 40 },
    { ville: "tanger", statut: "Confirmé", livraison: "Livrée", qte: 1, prix: 250, commission: 40 },
  ];
  const an = makeAn(orders);
  const ag = an.find(r => r.ville.toLowerCase() === "agadir");
  const ok =
    an.length === 3 &&
    ag && ag.n === 3 && ag.liv === 2 && ag.ret === 1 && ag.fr === 75 &&
    ag.ca === 200 + 300 + 180 &&
    an[0].ville.toLowerCase() === "agadir"; // مرتبة تنازلياً
  if (ok) {
    console.log(`✅ التحليل الحقيقي: Agadir → 3 طلبيات / Livré 2 / Retour 1 / مبيعات ${ag.ca} DH / رسوم 75 DH — والترتيب تنازلي`);
  } else { console.error("❌ التحليل ما خدمش:", JSON.stringify(an)); bad++; }
}

/* 3) تنفيذ wo (نفس الكود المبني) — ربط LIVRAISON */
const apEnd = js.indexOf(";", js.indexOf("أولوز:", erEnd));
const woStart = js.indexOf("function wo(e,n){");
const woEnd = js.indexOf("let So=null", woStart);
if (erStart < 0 || woStart < 0) { console.error("❌ ما لقيتش wo/er فالكود!"); bad++; }
else {
  const erFn = new Function(js.slice(erStart, erEnd) + "return er;")();
  const apSrc = js.slice(erEnd, apEnd + 1);
  const Ap = new Function(apSrc + "return Ap;")();
  const woFn = new Function("er", "Ap", js.slice(woStart, woEnd) + "return wo;")(erFn, Ap);
  const cities = [{ nom: "Agadir", prix: 25 }, { nom: "Tanger", prix: 40 }, { nom: "Marrakech", prix: 35 }];
  const t1 = woFn("Agadir", cities), t2 = woFn("tanger", cities), t3 = woFn("اكادير", cities), t4 = woFn("درعة", cities);
  if (t1 === 25 && t2 === 40 && t3 === 25 && t4 === null) {
    console.log("✅ wo (ربط LIVRAISON): Agadir→25, tanger→40, اكادير→25 (عربي), درعة→null (تكتب الثمن يدوياً)");
  } else { console.error("❌ wo ما خدمش:", [t1, t2, t3, t4]); bad++; }
  /* محاكاة الـ onChange ديال حقل المدينة فـ LIVRAISON */
  const handler = (f, v) => { const p = woFn(v, cities); return { ...f, ville: v, frais: p != null ? String(p) : f.frais }; };
  let f = { ville: "", frais: "0" };
  f = handler(f, "Agadir");
  const step1 = f.frais === "25";
  f = handler(f, "درعة"); f = { ...f, frais: "55" }; // يدوي
  const step2 = f.frais === "55";
  f = handler(f, "Marrakech");
  const step3 = f.frais === "35";
  if (step1 && step2 && step3) {
    console.log("✅ أوتوفيل frais فـ LIVRAISON: مدينة معروفة → الثمن أوتوماتيك (25)، مدينة مجهولة → يدوي (55)، تبديل لمدينة معروفة → الثمن ديالها (35)");
  } else { console.error("❌ أوتوفيل frais ما خدمش:", f); bad++; }
}

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ LES VILLES + تحليل المدن (v3.7) خدامة: إضافة مدينة بالثمن فقط + التطبيق على CRM كامل");
process.exit(0);
