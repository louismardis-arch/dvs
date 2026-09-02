#!/usr/bin/env node
/**
 * ✅ تست ديال آلية تبديل اللوكو (logo.png)
 * • صفحة الدخول (H2) والهيدر (S): إلا كاين ملف logo.png فجذر الموقع → كيبان
 * • إلا الملف ماشي موجود → اللوكو الافتراضي (SVG / 📊) كيبقا — بلا صورة مكسورة
 * التشغيل: node dev/test-logo.mjs
 */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync("/home/user/dvs/index.html", "utf8");
const dom = new JSDOM(html, { url: "http://localhost:8080/", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
let bad = 0;
const ok = (c, l, e = "") => { console.log((c ? "✅" : "❌"), l, e); if (!c) bad++; };

window.localStorage.setItem("afrizon_users_v1", JSON.stringify([
  { id: 1, username: "admin@paraveda.ma", password: "rOYtKv0cd9UW", role: "admin", agent: "" },
]));
window.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
window.confirm = () => true; window.alert = () => {};
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, media: "" });
const script = window.document.querySelector("script[type='module']");
window.eval(script.textContent);
await new Promise(r => setTimeout(r, 800));

/* 1) صفحة الدخول: اللوكو SVG + img ديال logo.png */
const imgs = [...window.document.querySelectorAll('img[src="logo.png"]')];
ok(imgs.length === 2, "صفحة الدخول: جوج img ديال logo.png (فوق + فالفورم)", `imgs=${imgs.length}`);
ok(window.document.querySelector('svg[viewBox="0 0 48 48"]') !== null, "اللوكو الافتراضي SVG باقي تحت الصورة");

/* 2) إلا logo.png غابت (error) → الصورة كتختفي والافتراضي كيبان */
for (const img of imgs) img.dispatchEvent(new window.Event("error"));
await new Promise(r => setTimeout(r, 150));
const visibleImgs = [...window.document.querySelectorAll('img[src="logo.png"]')].filter(i => i.style.display !== "none");
ok(visibleImgs.length === 0, "بعد error: الصور تختفو (بلا صورة مكسورة)", `visible=${visibleImgs.length}`);
ok(window.document.querySelector('svg[viewBox="0 0 48 48"]') !== null, "اللوكو الافتراضي SVG باقي معروض");

/* 3) دخول الأدمن → الهيدر فيه img ديال logo.png فوق شارة 📊 */
const setVal = (el, v) => {
  const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
};
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "اسم المستخدم"), "admin");
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "كلمة المرور"), "rOYtKv0cd9UW");
window.document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
await new Promise(r => setTimeout(r, 700));

ok(window.document.body.textContent.includes("COMONDES"), "دخول الأدمن ناجح");
const headerImgs = [...window.document.querySelectorAll('img[src="logo.png"]')];
ok(headerImgs.length === 1, "الهيدر فيه img ديال logo.png (فوق الشارة 📊)", `headerImgs=${headerImgs.length}`);
ok(window.document.body.textContent.includes("Paraveda"), "سمية Paraveda فالالهيدر باقية");

/* 4) error فالهيدر → الشارة الافتراضية كترجع */
for (const img of headerImgs) img.dispatchEvent(new window.Event("error"));
await new Promise(r => setTimeout(r, 150));
ok(headerImgs.every(i => i.style.display === "none"), "بعد error فالالهيدر: الصورة كتختفي (📊 كيبقى)");

/* 5) باقي الصفحات واخرة — صفحة الدخول ما تبدلاتش */
ok(window.document.body.textContent.includes("CRM · Call Center"), "النصوص ديال الهيدر باقية كما هي");

window.close();
console.log(bad ? `\n❌❌❌ ${bad} فحص فاشل` : "\n✅✅✅ آلية تبديل اللوكو (logo.png) خدامة فالهيدر وصفحة الدخول");
process.exit(bad ? 1 : 0);
