#!/usr/bin/env node
/**
 * ✅ تست تلقائي لإصلاح خانة UPSEL (صفحة Salaire + suivi confirmation)
 * ---------------------------------------------------------------
 * القاعدة: UPSEL كيتحسب غير من الطلبيات اللي Livraison = "Livrée".
 * Retour / Annulé / Expédié / Expédier vers / Out Of Stock → ما كيتحسبوش.
 *
 * هاد التست ما كيختبرش نسخة مكتوبة باليد — كيستخرج الكود الحقيقي
 * المبني من index.html ويعاود تنفيذه بنفسو على داطا مختلطة.
 *
 * التشغيل:  node dev/test-upsel-fix.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

/* 1) الكود المبني لازم يكون فيه الإصلاح */
const checks = [
  ['E=_.filter(oe=>oe.livraison==="Livrée").reduce((oe,K)=>oe+(K.upsell||0),0)', "Salaire: UPSEL محسوب غير من Livrée"],
  ['ae=E.filter(ie=>ie.livraison==="Livrée").reduce((ie,U)=>ie+(U.upsell||0),0)', "suivi confirmation: UPSEL محسوب غير من Livrée"],
];
let bad = 0;
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* 2) استخراج الكود الحقيقي ديال حساب السالير وتنفيذه */
const i = html.indexOf('<script type="module" crossorigin>');
const j = html.indexOf('</script>', i);
const js = html.slice(i + '<script type="module" crossorigin>'.length, j);
const start = js.indexOf('n.map(R=>{const _=e.filter');
const end = js.indexOf('}).sort((R,_)=>_.salaire-R.salaire)', start);
if (start < 0 || end < 0) { console.error("❌ ما قدرناش نستخرجو كود حساب السالير"); process.exit(1); }
const arrow = js.slice(start + 'n.map('.length, end);
const wrap = new Function(`function wrap(n,e,f,d,hj,mj,hd,Z2){ return n.map(${arrow}}); } return wrap;`)();

/* داطا مختلطة: Livrée + Retour + Expédié + Annulé */
const orders = [
  { agent: "TEST-UPSEL", dateCreation: "2026-08-29", livraison: "Livrée",  upsell: 5 },
  { agent: "TEST-UPSEL", dateCreation: "2026-08-29", livraison: "Livrée",  upsell: 2 },
  { agent: "TEST-UPSEL", dateCreation: "2026-08-29", livraison: "Retour",  upsell: 100 },
  { agent: "TEST-UPSEL", dateCreation: "2026-08-29", livraison: "Expédié", upsell: 50 },
  { agent: "TEST-UPSEL", dateCreation: "2026-08-29", livraison: "Annulé",  upsell: 30 },
];
const out = wrap(["TEST-UPSEL"], orders, "", "", 8, 5, 151, 1000)[0];

console.log("── تنفيذ الكود الحقيقي من index.html على داطا مختلطة:");
console.log(`عدد Livrée: ${out.liv} (المتوقع 2)`);
console.log(`UPSEL المحسوب: ${out.upsell} (المتوقع 7 = 5+2 فقط — Retour/Expédié/Annulé = 180 ماشي محسوبين)`);
console.log(`Salaire: ${out.salaire} DH (المتوقع 72 = 2×8 + 7×8)`);

const ok = out.liv === 2 && out.upsell === 7 && out.salaire === 72 && bad === 0;
if (!ok) { console.error("❌❌❌ كاين مشكل فالكود!"); process.exit(1); }
console.log("✅✅✅ الكود المبني كيحسب غير UPSEL ديال LIVRÉE — مؤكد بالتجربة الحية");
process.exit(0);
