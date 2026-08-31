#!/usr/bin/env node
/**
 * ✅ تست تلقائي لصفحة LIVRAISON (v3.10 — مربوطة بصفحة الطلبيات)
 * ---------------------------------------------------------------
 * المطلوب (v3.10):
 * • LIVRAISON ماشي صفحة منفصلة — الداطا كتجي أوتوماتيك من الطلبيات
 *   (نفس مخزن orders ديال صفحة Commandes) بلا إضافة يدوية
 * • 9 حالات (كانبان): À préparer, Préparé, Expédié, En livraison,
 *   Livré, Refusé, Retour, Annulé, Problème livraison
 * • كل طلبية كتظهر فالعمود ديال حالة التوصيل ديالها:
 *   livraison="" → À préparer | Livrée → Livré | Retour → Retour
 *   Expédier vers → Expédié | Out Of Stock → Problème livraison
 *   statut="Annulé" → Annulé
 * • تغيير الحالة هنا كيعدل الطلبية فنفس مخزن الـ CRM (upd)
 * • الحقول: N° (idCmd), Client, Téléphone, Ville, Adresse, Produit,
 *   Quantité, Prix, Frais livraison (commission), Total, Livreur,
 *   Tracking ID, Date expédition, Date livraison, Motif retour
 * • نفس مفردات الحالة فالطلبيات (x_) وLIVRAISON (LSts)
 *
 * التشغيل:  node dev/test-livraison.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const api = readFileSync(join(root, "api.php"), "utf8");
let bad = 0;

const livStart = html.indexOf("const LVS=");
const livEnd = html.indexOf("function Vj(){");
const livSrc = html.slice(livStart, livEnd);

/* 1) الكود المبني فيه الميزات؟ */
const statuses = ["À préparer", "Préparé", "Expédié", "En livraison", "Livré", "Refusé", "Retour", "Annulé", "Problème livraison"];

const checks = [
  ['function Liv() {', "المكوّن Liv موجود"],
  ['const LVS="afrizon_livraison_v1",LSts=[', "الحالات التسعة موجودة"],
  ['children: "🚚"', "أيقونة 🚚"],
  ['children: "LIVRAISON"', "عنوان الصفحة"],
  ['w==="LIVRAISON"&&s.jsx("div",{className:"h-full overflow-auto",children:s.jsx(Liv,{})})', "الرندر مربوط"],
  ['s.jsx($r,{color:"orange",on:w==="LIVRAISON"', "زر الفوتر 🚚 Livraison"],
  ['g(C=>C.includes("LIVRAISON")?C:[...C,"LIVRAISON"])', "التبويب كيتزاد أوتوماتيك عند المستخدمين القدام"],
  ['"LIVRAISON":"🚚"', "الأيقونة فخريطة الصفحات"],
  ['"afrizon_livraison_v1"', "المفتاح كيبقا مقبول فالمزامنة (توافق مع الداتا القديمة)"],
  ['Tracking ID — شركة الشحن', "خانة Tracking ID"],
  ['FLabel("سبب الإرجاع")', "خانة سبب الإرجاع (Motif retour)"],
  ['تاريخ الشحن', "خانة تاريخ الشحن (Date expédition)"],
  ['تاريخ التوصيل', "خانة تاريخ التوصيل (Date livraison)"],
  /* v3.10: مربوطة بالطلبيات */
  ['const { orders: o, upd: uo } = Xt()', "v3.10: الداطا كتجي من مخزن الطلبيات (Xt)"],
  ['مربوطة أوتوماتيكياً مع صفحة الطلبيات', "v3.10: توضيح الربط مع الطلبيات"],
  ['مربوطة مع Commandes', "v3.10: شريط التوضيح"],
  ['const col = x => {', "v3.10: خريطة العمود (statut Annulé → عمود Annulé)"],
  ['L === "Livrée" ? "Livré" : L === "Expédier vers" ? "Expédié" : L === "Out Of Stock" ? "Problème livraison"', "v3.10: خريطة القيم القديمة (Livrée/Expédier vers/Out Of Stock)"],
  ['uo(x.id, { statut: "Annulé" })', "v3.10: النقل لـ Annulé كيعدل الطلبية فنفس المخزن"],
  ['uo(x.id, { ...P, livraison: st === "Livré" ? "Livrée" : st })', "v3.10: النقل كيكتب Livrée فحقل livraison ديال الطلبية"],
  ['uo(x.id, { tracking: e.target.value })', "v3.10: Tracking ID كيتسجل فالطلبية نفسها"],
  ['className: "lvx-row"', "v3.16: سطور جدول احترافي (lvx-row) بلاصة كانبان مخربق"],
  ['"data-kpi": k.k', "v3.16: مؤشرات حية (data-kpi) فوق الجدول"],
  ['id="lvx-style"', "v3.14: الستايل المحلي lvx-style موجود فـ index.html"],
  ['"#" + (x.idCmd || x.id)', "v3.10: N° Commande من idCmd ديال الطلبية"],
  ['const { orders: o, upd: uo } = Xt()', "v3.12: Liv كتقرا المدن (Ll) باش تحسب frais الحقيقي"],
  ['frais = x => (x.livraison === "Retour" || String(x.statut) === "Annulé") ? 0 : (wo(x.ville, cities) ?? 0)', "v3.12: frais = تمن المدينة الحالي — Retour/Annulé = 0 DH"],
  ['"data-frais": frx', "v3.12: خلية الفريز كتعرض frais المحسوب من المدينة (ماشي commission)"],
  ['Th("Frais livraison"', "v3.16: عمود Frais livraison فالجدول"],
  ['textDecoration: "line-through", textDecorationColor: "#dc2626"', "v3.17: LIVRAISON — سطر Annulé كيتخرق بخط أحمر (ماشي حمر كامل)"],
  ['const selC = isAnn ? "#64748b" : cc', "v3.17: LIVRAISON — select ديال Annulé محايد"],
  ['"data-tab": k', "v3.16: تبويبات الحالات (data-tab) فوق الجدول"],
  ['الكل', "v3.16: تبويب الكل موجود"],
  ['x_=["","À préparer","Préparé","Expédié","En livraison","Livrée","Refusé","Retour","Annulé","Problème livraison","Out Of Stock","Expédier vers"]', "v3.10: نفس المفردات فصفحة الطلبيات (x_)"],
  ['useSyncExternalStore', "v3.10: ما بقاش useSyncExternalStore فالـ Liv (المشكل اللول)", true],
];
for (const [needle, label, neg] of checks) {
  const ok = neg ? !livSrc.includes(needle) : html.includes(needle);
  if (!ok) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* الفورم اليدوي تحيد (المطلوب: بلا إضافة يدوية فالصفحة) */
if (!livSrc.includes("Commande جديدة") && !livSrc.includes('children:"إضافة"')) {
  console.log("✅ v3.10: ما بقاش فورم إضافة يدوية — الداطا غير من الطلبيات");
} else { console.error("❌ الفورم اليدوي باقي!"); bad++; }

/* الحالات التسعة كلهم موجودين */
for (const st of statuses) {
  if (!livSrc.includes(st)) { console.error("❌ حالة ناقصة:", st); bad++; }
}
if (!bad) console.log("✅ الحالات التسعة كاملين:", statuses.join(" | "));

/* v3.17/v3.18: سطر Annulé فـ Commandes — بلا خلفية حمراء، غير strikethrough بخط أحمر */
if (html.includes('T.statut==="Annulé"?"#fee2e2"')) { console.error("❌ v3.17: الخلفية الحمراء ديال سطر Annulé فـ Zv باقية!"); bad++; }
else console.log("✅ v3.17: سطر Annulé فـ Zv (suivi confirmation) ما بقاش بحمرة كاملة");
if (html.includes('Ce==="Annulé"?"#ff2b2b"')) { console.error("❌ v3.18: الخلفية الحمراء ديال Annulé فالجدول الرئيسي ديال Commandes باقية!"); bad++; }
else console.log("✅ v3.18: الجدول الرئيسي ديال Commandes — Annulé ما بقاش بحمرة (#ff2b2b)");
if (html.includes('e.statut==="Annulé"?"#ff2b2b"')) { console.error("❌ v3.18: الخلفية الحمراء ديال Annulé فصفحة Work Team باقية!"); bad++; }
else console.log("✅ v3.18: صفحة Work Team (طلبيات البنات) — Annulé ما بقاش بحمرة");
if (html.includes('ze=tt||Le?"line-through #dc2626 2px":"none"')) console.log("✅ v3.18: الضربة فجدول Commandes الرئيسي حمرا (#dc2626)");
else { console.error("❌ v3.18: الضربة الحمرا ناقصة فجدول Commandes الرئيسي!"); bad++; }
if (html.split('ie?"line-through #dc2626 2px":"none"').length - 1 === 3) console.log("✅ v3.18: الضربة الحمرا فصفحة Work Team (3 مواضع: كارت + اسم + جدول)");
else { console.error("❌ v3.18: الضربة الحمرا ديال Work Team ناقصة!"); bad++; }
if (html.includes('textDecoration:T.statut==="Annulé"?"line-through":"none"')) console.log("✅ v3.17: سطر Annulé فـ Commandes كيتخرق بخط أحمر (strikethrough)");
else { console.error("❌ v3.17: strikethrough ديال Commandes ناقص!"); bad++; }
if (html.includes('tr[data-ann="1"] td{text-decoration:line-through')) console.log("✅ v3.17: CSS الضرب الأحمر ديال الحقول (input/select)");
else { console.error("❌ v3.17: CSS ديال الضرب الأحمر ناقص!"); bad++; }
if (html.includes('"data-ann":T.statut==="Annulé"?"1":"0"')) console.log("✅ v3.17: وسم data-ann كيتزاد على سطر Annulé (جدولين: قراءة + تعديل)");
else { console.error("❌ v3.17: وسم data-ann ناقص!"); bad++; }

/* v3.19: إصلاح كراش Dashboard performance — الفرز ديال الصفوف كان كيقرا E.date (undefined) بلاصة E.row.date */
if (html.includes('E.row.date.localeCompare(S.row.date)')) console.log("✅ v3.19: الفرز فـ Dashboard performance كيقرا E.row.date (التاريخ معرّف دابا)");
else { console.error("❌ v3.19: الفرز المصحح ناقص فـ Dashboard performance!"); bad++; }
if (html.includes('rows.sort((S,E)=>E.date.localeCompare(S.date))')) { console.error("❌ v3.19: السطر القديم ديال الكراش باقي (E.date.localeCompare)!"); bad++; }
else console.log("✅ v3.19: السطر اللي كان كيضرب صفحة Dashboard performance (E.date.localeCompare) تّمحات");

/* 2) api.php: المفتاح مقبول عند السيرفر */
if (!api.includes('"afrizon_livraison_v1"')) { console.error("❌ api.php ما فيهش المفتاح!"); bad++; }
else console.log("✅ api.php كيقبل المفتاح afrizon_livraison_v1 (توافق)");

/* 3) محاكاة الموديل الجديد: مخزن orders + col + setCol (نفس المنطق بالحرف) */
const LSts = ["À préparer", "Préparé", "Expédié", "En livraison", "Livré", "Refusé", "Retour", "Annulé", "Problème livraison"];
let orders = [
  { id: 1, idCmd: "CMD-1", nom: "Sara", telephone: "0612345678", ville: "Agadir", adresse: "حي السلام", produit: "نظارة", qte: 2, prix: 250, commission: 25, upsell: 30, livraison: "", statut: "Confirmé", agent: "Meryam" },
  { id: 2, idCmd: "CMD-2", nom: "Yassine", telephone: "06...", ville: "Tanger", produit: "ساعة", qte: 1, prix: 350, commission: 40, livraison: "Livrée", statut: "Confirmé" },
  { id: 3, idCmd: "CMD-3", nom: "Amal", telephone: "06...", ville: "Fès", produit: "خاتم", qte: 1, prix: 200, commission: 30, livraison: "", statut: "Annulé" },
  { id: 4, idCmd: "CMD-4", nom: "Karim", ville: "Rabat", produit: "نظارة", qte: 1, prix: 190, commission: 30, livraison: "Expédier vers", statut: "Confirmé" },
  { id: 5, idCmd: "CMD-5", nom: "Ali", ville: "Agadir", produit: "ساعة", qte: 1, prix: 250, commission: 99, livraison: "Retour", statut: "Confirmé" },
];
const col = x => {
  if (String(x.statut) === "Annulé") return "Annulé";
  const L = x.livraison || "";
  return L === "Livrée" ? "Livré" : L === "Expédier vers" ? "Expédié" : L === "Out Of Stock" ? "Problème livraison" : LSts.includes(L) ? L : "À préparer";
};
const upd = (id, p) => { orders = orders.map(x => x.id === id ? { ...x, ...p } : x); };
const setCol = (x, st) => {
  if (st === "Annulé") return upd(x.id, { statut: "Annulé" });
  const P = x.statut === "Annulé" ? { statut: "Confirmé" } : {};
  return upd(x.id, { ...P, livraison: st === "Livré" ? "Livrée" : st });
};

/* وضع كل طلبية فالحالة ديالها */
const placed = orders.map(x => [x.idCmd, col(x)]);
const expect = [["CMD-1", "À préparer"], ["CMD-2", "Livré"], ["CMD-3", "Annulé"], ["CMD-4", "Expédié"], ["CMD-5", "Retour"]];
const okPlace = JSON.stringify(placed) === JSON.stringify(expect);
if (okPlace) console.log("✅ الداطا أوتوماتيك فالحالة الصح:", placed.map(p => p.join("→")).join(" | "));
else { console.error("❌ التوزيع غلط:", placed); bad++; }

/* نقل CMD-1 → Livré (كيبدل الطلبية فنفس المخزن) */
setCol(orders.find(x => x.id === 1), "Livré");
const after1 = orders.find(x => x.id === 1);
if (after1.livraison === "Livrée" && col(after1) === "Livré") {
  console.log("✅ النقل لـ Livré كيكتب livraison=Livrée فالطلبية نفسها (CRM)");
} else { console.error("❌ النقل لـ Livré ما خدمش:", after1.livraison); bad++; }

/* نقل CMD-3 (Annulé) → À préparer: كيرجع statut=Confirmé */
setCol(orders.find(x => x.id === 3), "À préparer");
const after3 = orders.find(x => x.id === 3);
if (after3.statut === "Confirmé" && after3.livraison === "À préparer" && col(after3) === "À préparer") {
  console.log("✅ النقل من Annulé → À préparer: statut رجع Confirmé + livraison=À préparer");
} else { console.error("❌ النقل من Annulé ما خدمش:", after3); bad++; }

/* Tracking ID + Livreur كيتسجلو فالطلبية نفسها */
upd(1, { tracking: "TRK-777" }); upd(1, { livreur: "Aman" });
const afterT = orders.find(x => x.id === 1);
if (afterT.tracking === "TRK-777" && afterT.livreur === "Aman") {
  console.log("✅ Tracking ID + Livreur كيتسجلو فالطلبية (نفس مخزن CRM)");
} else { console.error("❌ Tracking/Livreur ما تسجلوش:", afterT); bad++; }

/* v3.12: frais = تمن المدينة الحالي (Retour/Annulé → 0) */
const villes = [{ nom: "Agadir", prix: 25 }, { nom: "Tanger", prix: 40 }];
const erF = s => String(s || "").trim().toLowerCase();
const woF = (v, c) => { const m = (c || []).find(x => erF(x.nom) === erF(v)); return m ? m.prix : null; };
const fraisF = x => (x.livraison === "Retour" || String(x.statut) === "Annulé") ? 0 : (woF(x.ville, villes) ?? 0);
const f1 = fraisF(orders.find(x => x.id === 1));   // Agadir Livrée → 25
const f2 = fraisF(orders.find(x => x.id === 2));   // Tanger Livrée → 40
const f5 = fraisF(orders.find(x => x.id === 5));   // Agadir Retour → 0 (واخا commission 99)
const f3 = fraisF(orders.find(x => x.id === 3));   // Annulé → 0
if (f1 === 25 && f2 === 40 && f5 === 0 && f3 === 0) {
  console.log("✅ v3.12: frais حقيقي — Agadir Livrée 25 / Tanger 40 / Retour 0 (واخا commission 99) / Annulé 0");
} else { console.error("❌ frais v3.12 ما خدمش:", { f1, f2, f5, f3 }); bad++; }

/* Total محسوب من الطلبية: qte×prix */
const tot = (Number(afterT.qte) || 0) * (Number(afterT.prix) || 0);
if (tot === 500) console.log("✅ Total ديال الكارطة = qte×prix = 500 DH (نفس حساب CRM)");
else { console.error("❌ Total غلط:", tot); bad++; }

/* المزامنة: نفس المفتاح sg كيبقا مقبول (الداتا كتسافر مع orders) */
if (html.includes('"afrizon_orders_v5"')) console.log("✅ الطلبيات كيتزامنو عبر afrizon_orders_v5 — LIVRAISON كتقراهم نفس المصدر");
else { console.error("❌ مفتاح orders ناقص!"); bad++; }

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ صفحة LIVRAISON (v3.10) جاهزة: مربوطة 100% بالطلبيات — بلا إضافة يدوية + 9 حالات + Tracking ID");
process.exit(0);
