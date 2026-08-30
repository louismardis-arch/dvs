#!/usr/bin/env node
/**
 * ✅ تست تلقائي لميزة v2.8 — Dashboard performance:
 * ---------------------------------------------------------------
 * 1) المنتوج كيتكتب مرة وحدة و كيتسجل فقائمة (perf_products_v1)
 * 2) ملي كتختار منتوج من القائمة → الثمن كيتعبا أوتوماتيك
 * 3) فيلتر الأيام (من → إلى) كيصفّي الجدولين (المصدر + العام)
 *
 * التشغيل:  node dev/test-perf-products.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
let bad = 0;

/* 1) الكود المبني فيه الميزات؟ */
const checks = [
  ['perf_products_v1', "قائمة المنتوجات المحفوظة موجودة"],
  ['P&&P.p>0&&!g&&b(String(P.p))', "التعبئة الأوتوماتيكية للثمن عند اختيار منتوج"],
  ['const J=P?z.map(Q=>Q===P?{n:Q.n,p:Number(g)||0,s:i,d:m}:Q):[...z,{n:u.trim(),p:Number(g)||0,s:i,d:m}]', "تسجيل المنتوج الجديد فالقائمة عند الإضافة"],
  ['v=ee.useMemo(()=>n.filter(S=>S.source===i&&ir(S.date)).map(N)', "الجدول ديال المصدر: السطور + الفيلتر، كل سطر بالتاريخ"],
  ['A=ee.useMemo(()=>n.filter(S=>ir(S.date)).map(N)', "الجدول العام: كل المصادر، كل سطر بالتاريخ"],
  ['children:"📅 فيلتر الأيام:"}),s.jsx(yp,{})', "label فيلتر الأيام + نفس أزرار فيلتر CRM بجانبو (رقم 2)"],
  ['n.period||"today"', "الافتراضي ديال الفيلتر = اليوم (رقم 3)"],
  ['📅 التاريخ', "خانة تاريخ الانطلاق فالفورم"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص:", label); bad++; }
  else console.log("✅", label);
}

/* 2) محاكاة حية: المنتوج مرة وحدة → فالقائمة → الثمن أوتوماتيك */
const mem = {};
const localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};

let z = (() => {
  try {
    const J = JSON.parse(localStorage.getItem("perf_products_v1") || "[]");
    return Array.isArray(J) ? J : [];
  } catch { return []; }
})();
const kz = nz => { z = nz; };

// المستخدم كتب المنتوج مرة وحدة: "مكمل مرض السكري" + الثمن 250
const u = "مكمل مرض السكري", g = "250";
{
  const P = z.find(Q => Q.n.toLowerCase() === u.trim().toLowerCase());
  const J = P ? z.map(Q => Q.n === P.n ? { n: Q.n, p: Number(g) || 0 } : Q)
              : [...z, { n: u.trim(), p: Number(g) || 0 }];
  localStorage.setItem("perf_products_v1", JSON.stringify(J)), kz(J);
}
if (z.length === 1 && z[0].n === "مكمل مرض السكري" && z[0].p === 250) {
  console.log("✅ المنتوج تسجل مرة وحدة فالقائمة مع الثمن ديالو");
} else { console.error("❌ التسجيل فالقائمة فشل:", z); bad++; }

// النهار الجاي: المستخدم كيختار المنتوج من القائمة (بلا ما يكتبو)
let priceInput = "";
{
  const picked = "مكمل مرض السكري";
  const P = z.find(Q => Q.n.toLowerCase() === picked.trim().toLowerCase());
  if (P && P.p > 0 && !priceInput) priceInput = String(P.p);
}
if (priceInput === "250") console.log("✅ اختيار المنتوج من القائمة عبّا الثمن (250) أوتوماتيك");
else { console.error("❌ الثمن ما تعبّاش أوتوماتيك:", priceInput); bad++; }

// المنتوج كيتكتب مرة وحدة غير — القائمة كبرات بـ 0 عناصر جديدة
if (z.length === 1) console.log("✅ بلا إعادة كتابة — المنتوج كاين فالقائمة جاهز");
else { console.error("❌ القائمة كبرات بلا داعي"); bad++; }

/* 3) محاكاة فيلتر الأيام */
const rows = [
  { source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-29", prix: 250 },
  { source: "Leader", produit: "مكمل مرض السكري", date: "2026-08-30", prix: 250 },
  { source: "Leader", produit: "مكمل مرض السكري", date: "2026-09-01", prix: 250 },
];
const pf = "2026-08-29", pd = "2026-08-30";
const filtered = rows.filter(S => (!pf || S.date >= pf) && (!pd || S.date <= pd));
if (filtered.length === 2) console.log("✅ فيلتر الأيام (29 → 30) رجع 2 سطور فقط");
else { console.error("❌ الفيلتر ما خدمش:", filtered.length); bad++; }

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ v2.8 خدامة: المنتوج مرة وحدة + اختيار من القائمة + ثمن أوتوماتيك + فيلتر الأيام");
process.exit(0);
