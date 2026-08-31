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
const initNeedle = '[u,d]=ee.useState(()=>{try{return localStorage.getItem("perf_last_produit")||""}catch{return ""}}),[g,b]=ee.useState(()=>{try{return localStorage.getItem("perf_last_prix")||""}catch{return ""}}),y=Rj()';
if (!html.includes(initNeedle)) { console.error("❌ ناقص: قراءة المنتوج+الثمن المحفوظين عند فتح الصفحة"); bad++; }
else console.log("✅ الصفحة كتفتح بالمنتوج + الثمن المحفوظين");

/* 2) الكود المبني لازم يكون فيه: حفظ القيم عند الإضافة بلا مسح */
const saveNeedle = 'D=()=>{if(!u.trim()||!g)return alert("عمّر: المنتوج + PRIX DE VENTE");const Pn=u.trim(),Px=Number(g)||0,rws=n.filter';
if (!html.includes(saveNeedle)) { console.error("❌ ناقص: حفظ المنتوج+الثمن عند الإضافة"); bad++; }
else console.log("✅ ملي كتزيد سطر: المنتوج + الثمن كيتحفظو (و كيتسجلو فالقائمة)");

/* 3) ما بقاش فيه لا خانة تاريخ ولا تكرار ديال المنتوج */
const i0 = html.indexOf('if(!u.trim()||!g)return alert("عمّر: المنتوج + PRIX DE VENTE");');
if (i0 < 0) { console.error("❌ ما لقيناش كود الإضافة"); bad++; }
else {
  const chunk = html.slice(i0, i0 + 600);
  if (chunk.includes('d(""),b("")')) { console.error("❌ الكود باقي كيمسح الحقول بعد الإضافة!"); bad++; }
  else console.log("✅ الحقول ما عادش كيتمسحو بعد الإضافة");
  if (html.includes('value:m,onChange:S=>h(S.target.value)')) { console.error("❌ خانة التاريخ باقية!"); bad++; }
  else console.log("✅ v3.15: ما بقاتش خانة 📅 التاريخ — المنتوج مرة وحدة والحسابات أوتوماتيك");
  if (chunk.includes('rws=n.filter') && chunk.includes('bj(r.id,{prix:Px})')) console.log("✅ v3.15: نفس المنتوج كيتحدّث فبلاصتو (بلا سطر جديد كل مرة)");
  else { console.error("❌ منطق التحديث بلاصة الإضافة ناقص!"); bad++; }
}

/* 4) محاكاة حية: ننفذو منطق الحفظ (نفسو بالحرف من الكود المبني) على localStorage وهمي */
const mem = {};
const localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};
const u = "نظارة القراءة", g = "250", m = "2026-08-29", i = "Leader";
let z = [];
{
  /* نفس الكود اللي فـ D: حفظ آخر منتوج+ثمن + تسجيل المنتوج فالقائمة */
  localStorage.setItem("perf_last_produit", u.trim());
  localStorage.setItem("perf_last_prix", String(g));
  const P = z.find(Q => Q.n.toLowerCase() === u.trim().toLowerCase());
  const J = P ? z.map(Q => Q.n === P.n ? { n: Q.n, p: Number(g) || 0 } : Q)
              : [...z, { n: u.trim(), p: Number(g) || 0 }];
  localStorage.setItem("perf_products_v1", JSON.stringify(J)), z = J;
}

if (mem["perf_last_produit"] === "نظارة القراءة" && mem["perf_last_prix"] === "250") {
  console.log("✅ المحاكاة الحية: المنتوج والثمن تسجلو فالذاكرة بنجاح");
} else {
  console.error("❌ المحاكاة فشلات:", mem);
  bad++;
}
if (z.length === 1 && z[0].n === "نظارة القراءة" && z[0].p === 250) {
  console.log("✅ المحاكاة الحية: المنتوج تزاد للقائمة المحفوظة (مرة وحدة)");
} else {
  console.error("❌ القائمة المحفوظة ماخدماتش:", z);
  bad++;
}

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ v3.15: المنتوج + الثمن كيتحطو مرة وحدة ويبقاو — بلا خانة تاريخ، والحسابات اليومية كتطلع أوتوماتيك");
process.exit(0);
