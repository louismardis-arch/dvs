#!/usr/bin/env node
/**
 * ✅✅ فيريفيكاسيون شامل لجميع صفحات Paraveda CRM (v3.36)
 * ---------------------------------------------------------------
 * كيتأكد أن جميع الصفحات كتخدم بلا أخطاء، وأن الحسابات كتحسب أوتوماتيك وصحيحة:
 *  1) تنقل عبر جميع الصفحات (20+ صفحة) مع فحص أي خطأ render (error boundary / uncaught)
 *  2) فحص رقمي دقيق للحسابات الأوتوماتيكية فكل صفحة
 *  3) دخول بحساب بنت (meryem) — الصلاحيات: كتشوف غير صفحتها بلا أخطاء
 * التشغيل: node dev/test-verify-all-pages.mjs
 */
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const html = readFileSync("/home/user/dvs/index.html", "utf8");
const today = new Date().toISOString().slice(0, 10);

/* ================= داطا واقعية ================= */
const users = [
  { id: 1, username: "admin@paraveda.ma", password: "rOYtKv0cd9UW", role: "admin", agent: "" },
  { id: 2, username: "meryem", password: "1111", role: "user", agent: "مريم" },
];
const agents = ["مريم", "آية", "إيمان"];
const orders = [
  { id: 1, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C1", nom: "Bilal", telephone: "06", ville: "Agadir", adresse: "a", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "Livrée", upsell: 0, agent: "مريم", commission: 35 },
  { id: 2, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C2", nom: "Sara", telephone: "06", ville: "Agadir", adresse: "a", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "Livrée", upsell: 50, agent: "مريم", commission: 35 },
  { id: 3, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C3", nom: "Ali", telephone: "06", ville: "Tanger", adresse: "a", qte: 1, prix: 150, produit: "سلسلة", livraison: "Retour", upsell: 0, agent: "آية", commission: 30 },
  { id: 4, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C4", nom: "Nora", telephone: "06", ville: "Casablanca", adresse: "a", qte: 2, prix: 100, produit: "نظارة القراءة", livraison: "", upsell: 0, agent: "إيمان", commission: 35 },
  { id: 5, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C5", nom: "Khalid", telephone: "06", ville: "Agadir", adresse: "a", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "Livrée", upsell: 0, agent: "مريم", commission: 35 },
  { id: 6, dateCreation: today, dateConfirmation: today, statut: "Confirmé", idCmd: "C6", nom: "Amine", telephone: "06", ville: "Tanger", adresse: "a", qte: 1, prix: 150, produit: "سلسلة", livraison: "Livrée", upsell: 0, agent: "آية", commission: 30 },
  { id: 7, dateCreation: today, dateConfirmation: today, statut: "Annulé", idCmd: "C7", nom: "Yassine", telephone: "06", ville: "Agadir", adresse: "a", qte: 1, prix: 200, produit: "خاتم ملكي", livraison: "", upsell: 0, agent: "مريم", commission: 35 },
];
const catalog = [
  { nom: "خاتم ملكي", link: "", prix: "200", commission: "35", stock: "" },
  { nom: "سلسلة", link: "", prix: "150", commission: "30", stock: "" },
  { nom: "نظارة القراءة", link: "", prix: "100", commission: "35", stock: "" },
];
const villes = [
  { nom: "Agadir", prix: 25 }, { nom: "Tanger", prix: 40 }, { nom: "Casablanca", prix: 30 },
];
const adspend = [
  { id: 1, date: today, agent: "مريم", produit: "خاتم ملكي", source: "Leader", amount: 200 },
  { id: 2, date: today, agent: "مريم", produit: "", source: "TikTok", amount: 300 },
];

/* ================= boot ================= */
const dom = new JSDOM(html, { url: "http://localhost:8080/", runScripts: "outside-only", pretendToBeVisual: true });
const { window } = dom;
window.localStorage.setItem("afrizon_users_v1", JSON.stringify(users));
window.localStorage.setItem("afrizon_agent_names_v1", JSON.stringify(agents));
window.localStorage.setItem("afrizon_orders_v5", JSON.stringify(orders));
window.localStorage.setItem("afrizon_catalog_v1", JSON.stringify(catalog));
window.localStorage.setItem("afrizon_villes_v2", JSON.stringify(villes));
window.localStorage.setItem("afrizon_adspend_v1", JSON.stringify(adspend));
window.fetch = async () => ({ ok: true, status: 200, json: async () => ({}) });
window.confirm = () => true; window.alert = () => {};
window.prompt = () => null;
window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, media: "" }));

let bad = 0;
const ok = (cond, label, extra = "") => {
  console.log((cond ? "✅" : "❌"), label, extra ? `(${extra})` : "");
  if (!cond) bad++;
};
const errors = [];
window.addEventListener("error", e => errors.push("window: " + e.message));
const origErr = console.error;
console.error = (...a) => {
  const m = a.map(x => String(x)).join(" ");
  if (m.includes("CRM Error") || m.includes("Uncaught") || m.includes("TypeError") || m.includes("ReferenceError")) errors.push("console: " + m);
  origErr(...a);
};
const script = window.document.querySelector("script[type='module']");
try { window.eval(script.textContent); }
catch (e) { console.error("❌ eval failed:", e.message); process.exit(1); }
await new Promise(r => setTimeout(r, 1000));

const setVal = (el, v) => {
  const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
  el.dispatchEvent(new window.Event(el.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
};
const clickEl = (fn) => { const b = fn(); if (!b) throw new Error("element not found"); b.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const body = () => window.document.body.textContent;
async function goGroup(groupTitle, itemText) {
  clickEl(() => [...window.document.querySelectorAll(`[title='${groupTitle}']`)].find(b => b.textContent.includes(groupTitle)));
  await wait(220);
  clickEl(() => [...window.document.querySelectorAll("button")].find(b => b.textContent.trim() === itemText || (b.textContent.includes(itemText) && b.textContent.length < itemText.length + 8)));
  await wait(400);
}
async function goPage(text) {
  clickEl(() => [...window.document.querySelectorAll('div[title="نقرة مزدوجة لإعادة التسمية"]')].find(b => [...b.querySelectorAll("span")].map(s => s.textContent).includes(text)));
  await wait(400);
}

/* ================= تسجيل دخول أدمن ================= */
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "اسم المستخدم"), "admin");
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "كلمة المرور"), "rOYtKv0cd9UW");
window.document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
await wait(700);
ok(body().includes("COMONDES"), "1) دخول الأدمن ناجح — فصفحة COMONDES");
ok(!body().includes("حدث خطأ"), "2) ما كاين حتى error screen بعد الدخول");

/* ================= COMONDES: CA أوتوماتيك ================= */
ok(body().includes("7 lignes · CA 750 DH"), "3) COMONDES: 7 lignes · CA 750 DH (مجموع Livrée فقط أوتوماتيك)", body().match(/\d+ lignes · CA [\d\s]+ DH/)?.[0] || "");

/* ================= LES RENV / LES OBJECTIFS / RECLAMATION / suivi rentabilité / Sheet129 ================= */
await goPage("LES RENV");
ok(body().includes("LES RENV") && body().includes("➕ إضافة"), "4) LES RENV كترندر (جدول objectives)");
await goPage("LES OBJECTIFS");
ok(body().includes("LES OBJECTIFS") && body().includes("#"), "5) LES OBJECTIFS كترندر");
await goPage("RECLAMATION");
ok(body().includes("RECLAMATION") && body().includes("Confirmatrice"), "6) RECLAMATION كترندر (جدول الشكايات)");
await goPage("suivi rentabilité");
ok(body().includes("suivi rentabilité") && body().includes("Indicateur"), "7) suivi rentabilité كترندر (جدول المؤشرات)");
await goPage("Sheet129");
ok(body().includes("Sheet129") && body().includes("A"), "8) Sheet129 كترندر (الشيت المخصص)");

/* ================= Bilan: Dashboard performance ================= */
await goGroup("Bilan", "Dashboard performance");
ok(body().includes("cost per lead") && body().includes("GLOBAL"), "9) Dashboard performance كترندر (أعمدة الكوست)");
ok(body().includes("ما كاين حتى داطا") === false || body().includes("0 حساب"), "10) Dashboard performance بلا كراش (داطا فارغة = حالة عادية)");

/* ================= Bilan: suivi confirmation (حسابات أوتوماتيك) ================= */
await goGroup("Bilan", "suivi confirmation");
const sc = body();
ok(sc.includes("مريم ⚡") && sc.includes("آية ⚡") && sc.includes("إيمان ⚡"), "11) suivi confirmation: البنات الثلاثة كيبانو");
ok(sc.includes("75.00%") && sc.includes("600 DH"), "12) suivi confirmation: مريم CONF RATE 75% + C.A 600 DH", sc.match(/مريم ⚡[^🗑️]+/)?.[0] || "");
ok(sc.includes("خاتم ملكي") && sc.includes("سلسلة") && sc.includes("نظارة القراءة"), "13) suivi confirmation: مصفوفة منتوج × بنت كتحسب (3/2/1)");

/* ================= Bilan: statistique ================= */
await goGroup("Bilan", "statistique");
const st = body();
ok(st.includes("TOTAL") && st.includes("750 DH"), "14) statistique: C.A الإجمالي 750 DH (Livrée فقط)");
ok(st.includes("335 DH"), "15) statistique: bénéfice الإجمالي 335 DH أوتوماتيك", st.match(/TOTAL[^م]*/)?.[0]?.slice(0, 60) || "");
ok(st.includes("105 DH") && st.includes("30 DH"), "16) statistique: la livraison = commission Livrée (105/30/0)");

/* ================= Articles: PRODUITS ================= */
await goGroup("Articles", "PRODUITS");
const pr = body();
ok(pr.includes("📦 PRODUITS") && pr.includes("Catalogue (3)"), "17) PRODUITS: الكاتالوغ كيعرض 3 منتوجات");
ok(pr.includes("خاتم ملكي—20035430100%3600"), "18) PRODUITS: خاتم ملكي CMD=4 Livrée=3 Tx=100% Pièces=3 CA=600", pr.match(/خاتم ملكي[^\n]*/)?.[0] || "");

/* ================= Articles: pièce ================= */
await goGroup("Articles", "pièce");
ok(body().includes("pièce") && body().includes("Sorties (auto)") && body().includes("CA (auto)"), "19) pièce كترندر (أعمدة Sorties/CA/Stock أوتوماتيك)");

/* ================= SHIPING: Les villes ================= */
await goGroup("SHIPING", "Les villes");
const lv = body();
ok(lv.includes("إجمالي الطلبيات7") && lv.includes("المبيعات (DH)950"), "20) Les villes: 7 طلبيات + مبيعات 950 DH");
ok(lv.includes("رسوم التوصيل (DH)145"), "21) Les villes: رسوم التوصيل 145 DH (25+25+30+25+40 — بلا Retour/Annulé)", lv.match(/رسوم التوصيل \(DH\)[\d\s]+/)?.[0] || "");

/* ================= SHIPING: LIVRAISON ================= */
await goGroup("SHIPING", "LIVRAISON");
const li = body();
ok(li.includes("🔗 هاد الصفحة") && li.includes("مربوطة مع Commandes"), "22) LIVRAISON كترندر (مربوطة بالطلبيات)");
ok(li.includes("À préparer") && li.includes("Livré") && li.includes("Annulé") && li.includes("Retour"), "23) LIVRAISON: تبويبات الحالات كاملين");
ok(li.includes("25 DH") && li.includes("40 DH") && li.includes("30 DH"), "24) LIVRAISON: frais من Les villes كتتحسب (Agadir 25/Tanger 40/Casa 30)");

/* ================= TEAM: Work Times ================= */
await goGroup("TEAM", "Work Times");
ok(body().includes("أوقات الفريق") || body().includes("Work Times"), "25) Work Times كترندر");

/* ================= TEAM: Work Team ================= */
await goGroup("TEAM", "Work Team");
const wt = body();
ok(wt.includes("Notre équipe") && wt.includes("مريم") && wt.includes("آية") && wt.includes("إيمان"), "26) Work Team: بطاقات البنات الثلاثة");
ok(wt.includes("750 DH") && wt.includes("CA total"), "27) Work Team: CA total 750 DH أوتوماتيك");

/* ================= TEAM: Ranking ================= */
await goGroup("TEAM", "Ranking");
const rk = body();
ok(rk.includes("Classement Complet") && rk.includes("🥇") && rk.includes("ممريم"), "28) Ranking: الترتيب كيترندر");
ok(rk.includes("600 MAD") && rk.includes("150 MAD") && rk.includes("750 MAD"), "29) Ranking: المبالغ أوتوماتيك (600/150/750 MAD)");

/* ================= TEAM: Live Activity ================= */
await goGroup("TEAM", "Live Activity");
ok(body().includes("Live Activity") && body().includes("الطلبات اليوم7"), "30) Live Activity: 7 طلبيات اليوم");

/* ================= TEAM: Heatmap ================= */
await goGroup("TEAM", "Heatmap");
ok(body().includes("أداء الفريق حسب الساعة"), "31) Heatmap كترندر");

/* ================= ADS: CRM (تكاليف) ================= */
await goGroup("ADS", "CRM");
const crm = body();
ok(crm.includes("CRM — تكاليف الإعلانات") && crm.includes("🔍 المنتوج: الكل — كل المنتوجات"), "32) CRM Ads: كترندر + فلتر المنتوج موجود (v3.36)");
ok(crm.includes("500.00 DH") && crm.includes("62.50 DH"), "33) CRM Ads: KPIs (مصروف 500 / متوسط كوست 62.50 = 500÷8)");
ok(crm.includes("TikTok300.00 DH43375.00 DH"), "34) CRM Ads: الصف العام كوستو 75 DH (300÷4)");

/* ================= ADS: SALAIRE ================= */
await goGroup("ADS", "SALAIRE");
const sl = body();
ok(sl.includes("Salaire — سالير الفريق") && sl.includes("من نفس داتا COMONDES"), "35) Salaire كترندر (من داتا COMONDES)");
ok(sl.includes("424 DH") && sl.includes("8 DH"), "36) Salaire: مريم 424 DH (3×8+50×8) و آية 8 DH", sl.match(/ممريم[^ب]*/)?.[0]?.slice(0, 50) || "");
ok(sl.includes("432 DH"), "37) Salaire: المجموع الكلي 432 DH");

/* ================= ADS: Historique ================= */
await goGroup("ADS", "Historique");
ok(body().includes("Historique des modifications") && body().includes("Aucune action"), "38) Historique كترندر");

/* ================= Users Info ================= */
await goGroup("Users Info", "Users");
const us = body();
ok(us.includes("لائحة المستخدمين") && us.includes("كل الصفحات") && us.includes("بلا صفحة"), "39) Users: لائحة المستخدمين كتعرض الأدمن + البنات");

/* ================= أخطاء أثناء التنقل ================= */
ok(errors.length === 0, "40) صفر أخطاء render/uncaught عبر جميع الصفحات", errors.slice(0, 3).join(" | "));

/* ================= دخول بحساب بنت ================= */
const btnLogout = window.document.querySelector("[title='تسجيل الخروج']") || [...window.document.querySelectorAll("button")].find(b => b.textContent.includes("تسجيل الخروج"));
if (btnLogout) btnLogout.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
await wait(400);
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "اسم المستخدم"), "meryem");
setVal([...window.document.querySelectorAll("input")].find(i => i.placeholder === "كلمة المرور"), "1111");
window.document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
await wait(700);
const girlBody = body();
ok(girlBody.includes("مريم") && !girlBody.includes("COMONDES"), "41) دخول بنت: كتشوف غير صفحتها (بلا مينيو الأدمن)", "");
ok(!girlBody.includes("CRM Error") && errors.length === 0, "42) دخول بنت: بلا أي خطأ");

console.log(bad ? `\n❌❌❌ ${bad} فحص فاشل` : "\n✅✅✅ الفيريفيكاسيون الشامل: جميع الصفحات خدامة بلا أخطاء والحسابات الأوتوماتيكية صحيحة");
process.exit(bad ? 1 : 0);
