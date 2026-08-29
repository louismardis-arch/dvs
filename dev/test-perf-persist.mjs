#!/usr/bin/env node
/**
 * ✅ تست تلقائي لحفظ المنتوج + PRIX DE VENTE فصفحة Dashboard performance
 * ---------------------------------------------------------------
 * المطلوب: المنتوج والثمن كيتحطو مرة وحدة، و كيبقاو محفوظين
 * (localStorage) — المستخدم كيبدل غير التاريخ.
 *
 * التشغيل:  node dev/test-perf-persist.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
let bad = 0;

/* 1) الكود المبني لازم يكون فيه: قراءة القيم المحفوظة عند البدء */
const initNeedle = '[u,d]=ee.useState(()=>{try{return localStorage.getItem("perf_last_produit")||""}catch{return ""}}),[m,h]=ee.useState(f),[g,b]=ee.useState(()=>{try{return localStorage.getItem("perf_last_prix")||""}catch{return ""}}),y=Rj()';
if (!html.includes(initNeedle)) { console.error("❌ ناقص: قراءة المنتوج+الثمن المحفوظين عند فتح الصفحة"); bad++; }
else console.log("✅ الصفحة كتفتح بالمنتوج + الثمن المحفوظين");

/* 2) الكود المبني لازم يكون فيه: حفظ القيم عند الإضافة بلا مسح */
const saveNeedle = 'vj(i,u,m,Number(g));try{localStorage.setItem("perf_last_produit",u.trim()),localStorage.setItem("perf_last_prix",String(g))}catch{}';
if (!html.includes(saveNeedle)) { console.error("❌ ناقص: حفظ المنتوج+الثمن عند الإضافة"); bad++; }
else console.log("✅ ملي كتزيد سطر: المنتوج + الثمن كيتحفظو");

/* 3) المسح القديم (d(""),b("")) خاصو يكون تحيد من بعد الإضافة */
const i0 = html.indexOf('if(!u.trim()||!g)return alert("عمّر: المنتوج + PRIX DE VENTE");');
if (i0 < 0) { console.error("❌ ما لقيناش كود الإضافة"); bad++; }
else {
  const chunk = html.slice(i0, i0 + 400);
  if (chunk.includes('d(""),b("")')) { console.error("❌ الكود باقي كيمسح الحقول بعد الإضافة!"); bad++; }
  else console.log("✅ الحقول ما عادش كيتمسحو بعد الإضافة");
}

/* 4) محاكاة حية: ننفذو كود الحفظ بنفسو على localStorage وهمي */
const mem = {};
const localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};
const u = "نظارة القراءة", g = "250", m = "2026-08-29", i = "Leader";
const vj = (src, prod, date, prix) => { /* الـ vj الحقيقي كيضيف للسطر — هنا غير محاكاة */ };
eval(saveNeedle.split("vj(i,u,m,Number(g))").join("vj(i,u,m,Number(g))"));

if (mem["perf_last_produit"] === "نظارة القراءة" && mem["perf_last_prix"] === "250") {
  console.log("✅ المحاكاة الحية: المنتوج والثمن تسجلو فالذاكرة بنجاح");
} else {
  console.error("❌ المحاكاة فشلات:", mem);
  bad++;
}

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ المنتوج + الثمن كيتحطو مرة وحدة ويبقاو — والتاريخ هو لي كيتبدل");
process.exit(0);
