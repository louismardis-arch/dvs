#!/usr/bin/env node
/**
 * ✅ تست ديال صورة الهوم پايج (v3.35b)
 * المطلوب: الصورة الجديدة فالهوم پايج (صفحة تسجيل الدخول) بلاصت الرسمة SVG القديمة.
 * الآلية: <img src="home-hero.png"> مع fallback ذكي:
 *   • إلا الملف موجود فجذر الموقع → الصورة كتعرض
 *   • إلا ماشي موجود (خطأ تحميل) → الرسمة SVG القديمة كترجع (بلا broken image)
 * التشغيل: node dev/test-homepage-image.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
let bad = 0;
const ok = (cond, label, extra = "") => {
  console.log((cond ? "✅" : "❌"), label, extra);
  if (!cond) bad++;
};

const dom = new JSDOM(html, {
  url: "http://localhost:8080/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});
const { window } = dom;

/* stubs */
window.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
window.confirm = () => true;

const script = window.document.querySelector("script[type='module']");
if (!script) { console.error("❌ ما لقيتش الموديول فـ index.html"); process.exit(1); }

let bootErr = null;
window.addEventListener("error", e => { bootErr = e.message; });
try {
  window.eval(script.textContent);
} catch (e) {
  console.error("❌ eval failed:", e.message);
  process.exit(1);
}

await new Promise(r => setTimeout(r, 600));
ok(!bootErr, "الموديول تطلق بلا أخطاء", bootErr || "");

const h1 = window.document.querySelector("h1");
ok(h1 && h1.textContent === "Paraveda", "صفحة الدخول كتعرض (h1 Paraveda)");

/* 1) فالحالة الافتراضية: img موجود + SVG الرسمة مخفية */
const img = window.document.querySelector('img[src="home-hero.png"]');
const svgNow = window.document.querySelectorAll('svg[aria-label="Paraveda CRM"]');
ok(!!img, "img ديال home-hero.png موجود");
ok(svgNow.length === 0, "الرسمة SVG القديمة مخفية إلا الصورة خدامة", `svg=${svgNow.length}`);

/* 2) إلا فشل تحميل الصورة (ملف ماشي موجود) → الرسمة كترجع */
if (img) {
  img.dispatchEvent(new window.Event("error"));
  await new Promise(r => setTimeout(r, 150));
  const svgAfter = window.document.querySelectorAll('svg[aria-label="Paraveda CRM"]');
  const imgAfter = window.document.querySelector('img[src="home-hero.png"]');
  ok(svgAfter.length === 1, "بعد خطأ التحميل: الرسمة SVG رجعات", `svg=${svgAfter.length}`);
  ok(!imgAfter, "بعد خطأ التحميل: img تّمحي (بلا صورة مكسورة)", `img=${imgAfter ? 1 : 0}`);
}

/* 3) باقي عناصر صفحة الدخول ما تبدلوش */
const form = window.document.querySelector("form");
ok(!!form, "فورم تسجيل الدخول باقي");
const inputs = window.document.querySelectorAll("input");
ok(inputs.length >= 2, "خانات اسم المستخدم + كلمة المرور باقيين", `inputs=${inputs.length}`);

window.close();
console.log(bad ? `\n❌❌❌ ${bad} فحص فاشل` : "\n✅✅✅ صورة الهوم پايج جاهزة (img + fallback)");
process.exit(bad ? 1 : 0);
