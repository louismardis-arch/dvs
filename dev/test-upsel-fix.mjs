#!/usr/bin/env node
/**
 * ✅ تست تلقائي لإصلاح خانة UPSEL (صفحة Salaire + suivi confirmation)
 * ---------------------------------------------------------------
 * القاعدة الجديدة: UPSEL كيتحسب غير من الطلبيات اللي Livraison = "Livrée".
 *
 * التشغيل:  node dev/test-upsel-fix.mjs
 * النجاح:   process.exit(0)  |  الفشل: process.exit(1) + رسالة
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");

/* 1) تأكد أن الكود المبني فيه الإصلاح بالضبط */
const checks = [
  ['E=_.filter(oe=>oe.livraison==="Livrée").reduce((oe,K)=>oe+(K.upsell||0),0)', "Salaire: UPSEL محسوب غير من Livrée"],
  ['ae=E.filter(ie=>ie.livraison==="Livrée").reduce((ie,U)=>ie+(U.upsell||0),0)', "suivi confirmation: UPSEL محسوب غير من Livrée"],
];
let bad = 0;
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* 2) محاكاة الحساب بنفس المعادلة على داطا تجريبية */
const hj = 8, mj = 5, hd = 151, Z2 = 1000; // ثوابت صفحة Salaire
const orders = [
  { agent: "sara", livraison: "Livrée",    upsell: 5 },  // كيتحسب
  { agent: "sara", livraison: "Livrée",    upsell: 2 },  // كيتحسب
  { agent: "sara", livraison: "Retour",    upsell: 10 }, // ❌ ما يتحسبش
  { agent: "sara", livraison: "Expédié",   upsell: 3 },  // ❌ ما يتحسبش
  { agent: "sara", livraison: "Annulé",    upsell: 7 },  // ❌ ما يتحسبش
  { agent: "sara", livraison: "Livrée",    upsell: 0 },  // كيتحسب = 0
];
const R = "sara", f = "", d = "";
const _ = orders.filter(oe => oe.agent.toLowerCase() === R.toLowerCase() && (!f || oe.dateCreation >= f) && (!d || oe.dateCreation <= d));
const S = _.filter(oe => oe.livraison === "Livrée").length;
const E = _.filter(oe => oe.livraison === "Livrée").reduce((oe, K) => oe + (K.upsell || 0), 0);
const C = S >= hd, L = C ? mj : hj, F = S * L + E * L + (C ? Z2 : 0);

const expectS = 3, expectE = 7, expectF = 3 * 8 + 7 * 8; // 80 DH
const oldE = orders.reduce((oe, K) => oe + (K.upsell || 0), 0); // القيمة القديمة الخاطئة = 27

console.log("── محاكاة ─────────────────────────────");
console.log(`Livrée: ${S} (المتوقع ${expectS})`);
console.log(`UPSEL (Livrée فقط): ${E} (المتوقع ${expectE} | القديم كان كيجمع ${oldE})`);
console.log(`Salaire: ${F} DH (المتوقع ${expectF} DH)`);

if (S !== expectS || E !== expectE || F !== expectF) {
  console.error("❌ نتيجة التست ماشي هي المتوقعة!");
  process.exit(1);
}
console.log("✅ كلشي صحيح: UPSEL كيتحسب غير من الطلبيات اللي Livrée.");
if (bad) { console.error(`❌ ${bad} مشكل فالكود المبني`); process.exit(1); }
process.exit(0);
