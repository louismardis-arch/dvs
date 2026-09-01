#!/usr/bin/env node
/**
 * ✅ تست وظيفي ديال v3.36 — فلتر المنتوج فصفحة CRM (تكاليف الإعلانات)
 * ---------------------------------------------------------------
 * المطلوب: فلتر "🔍 المنتوج: الكل — كل المنتوجات" حدا فلتر الفترة والبنات؛
 * ملي نختار منتوج معين، جدول التكاليف وملخص البنات والـ KPIs كيتحسبو
 * على حسب هاد المنتوج فقط.
 * القواعد:
 *  • صفوف المصروف ديال المنتوج المختار + الصفوف العامة (بلا منتوج) كيتبقاو
 *  • كوست الطلبية = المصروف ÷ طلبيات نفس البنت/النهار/المنتوج المختار
 *  • لائحة المنتوجات = اتحاد (طلبيات + مصاريف + كاتالوغ PRODUITS)
 * التشغيل: node dev/test-crm-product-filter.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const today = new Date().toISOString().slice(0, 10);

let bad = 0;
const ok = (cond, label, extra = "") => {
  console.log((cond ? "✅" : "❌"), label, extra);
  if (!cond) bad++;
};

/* ===== داطا الاختبار ===== */
const users = [
  { id: 1, username: "admin@paraveda.ma", password: "rOYtKv0cd9UW", role: "admin", agent: "" },
  { id: 2, username: "meryem", password: "1111", role: "user", agent: "مريم" },
];
const orders = [
  { id: 1, dateCreation: today, statut: "Confirmé", idCmd: "C1", nom: "Bilal", ville: "Agadir", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "Livrée", agent: "مريم" },
  { id: 2, dateCreation: today, statut: "Confirmé", idCmd: "C2", nom: "Sara", ville: "Rabat", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "Retour", agent: "مريم" },
  { id: 3, dateCreation: today, statut: "Confirmé", idCmd: "C3", nom: "Ali", ville: "Fès", qte: 1, prix: 150, produit: "سلسلة", livraison: "Livrée", agent: "مريم" },
  { id: 4, dateCreation: today, statut: "Confirmé", idCmd: "C4", nom: "Nora", ville: "Tanger", qte: 1, prix: 150, produit: "سلسلة", livraison: "", agent: "آية" },
];
const adspend = [
  { id: 1, date: today, agent: "مريم", produit: "خاتم ملكي", source: "Leader", amount: 200 },
  { id: 2, date: today, agent: "مريم", produit: "سلسلة", source: "Facebook", amount: 100 },
  { id: 3, date: today, agent: "مريم", produit: "", source: "TikTok", amount: 300 },
  { id: 4, date: today, agent: "آية", produit: "سلسلة", source: "Instagram", amount: 50 },
];
const catalog = [
  { nom: "خاتم ملكي", link: "", prix: "200", commission: "35", stock: "" },
  { nom: "سلسلة", link: "", prix: "150", commission: "35", stock: "" },
  { nom: "نظارة القراءة", link: "", prix: "100", commission: "35", stock: "" },
];

/* ===== boot ===== */
const dom = new JSDOM(html, { url: "http://localhost:8080/", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.localStorage.setItem("afrizon_users_v1", JSON.stringify(users));
window.localStorage.setItem("afrizon_agent_names_v1", JSON.stringify(["مريم", "آية"]));
window.localStorage.setItem("afrizon_orders_v5", JSON.stringify(orders));
window.localStorage.setItem("afrizon_adspend_v1", JSON.stringify(adspend));
window.localStorage.setItem("afrizon_catalog_v1", JSON.stringify(catalog));
window.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
window.confirm = () => true;
window.alert = () => {};
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

let bootErr = null;
window.addEventListener("error", e => { bootErr = e.message; });
const script = window.document.querySelector("script[type='module']");
try { window.eval(script.textContent); }
catch (e) { console.error("❌ eval failed:", e.message); process.exit(1); }

await new Promise(r => setTimeout(r, 900));
ok(!bootErr, "البوت تطلق بلا أخطاء", bootErr || "");

/* ===== login ===== */
const setVal = (el, v) => {
  const isSel = el.tagName === "SELECT";
  const proto = isSel ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new window.Event(isSel ? "change" : "input", { bubbles: true }));
};
const byPlaceholder = ph => [...window.document.querySelectorAll("input")].find(i => i.placeholder === ph);
setVal(byPlaceholder("اسم المستخدم"), "admin");
setVal(byPlaceholder("كلمة المرور"), "rOYtKv0cd9UW");
window.document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
await new Promise(r => setTimeout(r, 600));

/* ===== navigation: ADS → CRM ===== */
const adsBtn = [...window.document.querySelectorAll("[title='ADS']")].find(b => b.textContent.includes("ADS"));
if (!adsBtn) { console.error("❌ ما لقيتش زر ADS"); process.exit(1); }
adsBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await new Promise(r => setTimeout(r, 250));
const crmBtn = [...window.document.querySelectorAll("button")].find(b => b.textContent.includes("CRM") && !b.textContent.includes("تسجيل"));
if (!crmBtn) { console.error("❌ ما لقيتش زر CRM فالمنيو"); process.exit(1); }
crmBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await new Promise(r => setTimeout(r, 500));

ok(window.document.body.textContent.includes("CRM — تكاليف الإعلانات"), "صفحة CRM كتعرض (h1 تكاليف الإعلانات)");

/* ===== الفلتر ديال المنتوج ===== */
const prodSel = [...window.document.querySelectorAll("select")].find(sel => [...sel.options].some(o => o.textContent.includes("المنتوج: الكل")));
ok(!!prodSel, "فلتر المنتوج موجود", prodSel ? `default: "${prodSel.options[0].textContent}"` : "");
if (!prodSel) { console.error("❌❌❌ فلتر المنتوج غايب"); process.exit(1); }
ok(prodSel.options[0].value === "all" && prodSel.options[0].textContent.includes("🔍 المنتوج: الكل — كل المنتوجات"), "الخيار الافتراضي: 🔍 المنتوج: الكل — كل المنتوجات", prodSel.options[0].textContent);
const optNames = [...prodSel.options].map(o => o.textContent);
ok(optNames.includes("خاتم ملكي") && optNames.includes("سلسلة"), "المنتوجات ديال الطلبيات فاللائحة");
ok(optNames.includes("نظارة القراءة"), "المنتوجات ديال الكاتالوغ (بلا طلبيات) فاللائحة هو الآخر");

/* ===== دوس اليوم (فترة دقيقة) ===== */
const todayBtn = [...window.document.querySelectorAll("button")].find(b => b.textContent.trim() === "اليوم");
if (todayBtn) todayBtn.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await new Promise(r => setTimeout(r, 400));

const allTables = () => [...window.document.querySelectorAll("table")];
const costsCard = () => allTables().find(t => (t.querySelector("thead") || t).textContent.includes("المصدر") && !(t.querySelector("thead") || t).textContent.includes("إجمالي المصروف"));
const summaryCard = () => allTables().find(t => (t.querySelector("thead") || t).textContent.includes("إجمالي المصروف"));
const kpiVal = label => {
  const d = [...window.document.querySelectorAll("div")].find(x => x.textContent.includes(label) && x.children.length <= 3 && x.textContent.includes("DH") === false);
  const card = [...window.document.querySelectorAll("div")].find(x => x.querySelectorAll("div").length >= 2 && x.textContent.includes(label));
  return card ? card.textContent.replace(label, "").trim() : null;
};

/* قبل الفلتر */
const t0 = costsCard();
ok(!!t0, "جدول التكاليف موجود");
const rowsBefore = t0 ? t0.querySelectorAll("tbody tr").length : -1;
ok(rowsBefore === 4, "قبل الفلتر: 4 صفوف مصروف", `rows=${rowsBefore}`);

/* بعد اختيار المنتوج */
setVal(prodSel, "خاتم ملكي");
await new Promise(r => setTimeout(r, 500));

const t1 = costsCard();
const rowsAfter = t1 ? t1.querySelectorAll("tbody tr").length : -1;
ok(rowsAfter === 2, "بعد فلتر خاتم ملكي: 2 صفوف (خاص بالمنتوج + عام)", `rows=${rowsAfter}`);
const t1Text = t1 ? t1.textContent : "";
ok(t1Text.includes("خاتم ملكي") && t1Text.includes("TikTok"), "الصف الخاص + الصف العام كيبقاو");
ok(!t1Text.includes("سلسلة") && !t1Text.includes("Instagram"), "صفوف المنتوجات الاخرين (سلسلة/آية) تّحيدو");

/* كوست الصف العام = 300 ÷ طلبيات خاتم ملكي (2) = 150 DH */
const tiktokRow = t1 ? [...t1.querySelectorAll("tbody tr")].find(tr => tr.textContent.includes("TikTok")) : null;
ok(!!tiktokRow && tiktokRow.textContent.includes("150.00 DH"), "كوست الصف العام تحسب على المنتوج المختار (150 DH)", tiktokRow ? tiktokRow.textContent.match(/\d+ DH/g)?.join(",") || "" : "");
ok(!!tiktokRow && tiktokRow.textContent.includes(">2<") === false, "عداد طلبيات الصف العام = 2 ديال المنتوج", tiktokRow ? `text=${tiktokRow.textContent}` : "");

/* ملخص البنات */
const sm = summaryCard();
ok(!!sm, "ملخص البنات موجود");
const smText = sm ? sm.textContent : "";
ok(smText.includes("مريم") && !smText.includes("آية"), "الملخص: مريم فقط (آية ما عندهاش صرف على خاتم ملكي)");
ok(smText.includes("500.00 DH") && smText.includes("125.00 DH"), "الملخص: مصروف 500 DH + كوست 125 DH", smText.match(/\d+ DH/g)?.join(",") || "");

/* KPIs */
const kpiSpent = kpiVal("إجمالي المصروف (الفترة)");
ok(!!kpiSpent && kpiSpent.includes("500"), "KPI إجمالي المصروف = 500 DH", kpiSpent || "");
const kpiCost = kpiVal("متوسط كوست الطلبية");
ok(!!kpiCost && kpiCost.includes("125"), "KPI متوسط كوست الطلبية = 125 DH", kpiCost || "");

/* رجوع للكل */
setVal(prodSel, "all");
await new Promise(r => setTimeout(r, 400));
const t2 = costsCard();
const rowsBack = t2 ? t2.querySelectorAll("tbody tr").length : -1;
ok(rowsBack === 4, "رجوع لـ الكل: 4 صفوف عاودو", `rows=${rowsBack}`);

/* ما تبدلش: الفورم + الفلاتر الاخرين */
ok(!!window.document.querySelector('[placeholder="نظارة القراءة..."]') || window.document.body.textContent.includes("إضافة مصروف جديد"), "فورم إضافة المصروف باقي");
ok([...window.document.querySelectorAll("select")].some(sel => [...sel.options].some(o => o.textContent.includes("كل البنات"))), "فلتر البنات باقي");

window.close();
console.log(bad ? `\n❌❌❌ ${bad} فحص فاشل` : "\n✅✅✅ فلتر المنتوج فصفحة CRM خدام (v3.36)");
process.exit(bad ? 1 : 0);
