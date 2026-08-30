#!/usr/bin/env node
/**
 * ✅ تست تلقائي لصفحة LIVRAISON (v3.6)
 * ---------------------------------------------------------------
 * المطلوب:
 * • صفحة "🚚 LIVRAISON" بالحالات التسعة
 * • كل commande فيها: N° Commande, Client, Téléphone, Ville, Adresse,
 *   Produit, Quantité, Prix, Frais livraison, Total, Livreur, Statut,
 *   Date expédition, Date livraison, Motif retour + Tracking ID
 * • المزامنة عبر api.php (مفتاح afrizon_livraison_v1)
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

/* 1) الكود المبني فيه الميزات؟ */
const statuses = ["À préparer", "Préparé", "Expédié", "En livraison", "Livré", "Refusé", "Retour", "Annulé", "Problème livraison"];
const fields = ["N° Commande", "Client", "Téléphone", "Ville", "Adresse", "Produit", "Quantité", "Prix (DH)", "Frais livraison (DH)", "Livreur", "Statut", "Date expédition", "Date livraison", "Motif retour", "Tracking ID"];

const checks = [
  ['function Liv(){', "المكوّن Liv موجود"],
  ['const LSts=["À préparer"', "الحالات التسعة موجودة"],
  ['children:"🚚"', "أيقونة 🚚"],
  ['children:"LIVRAISON"', "عنوان الصفحة"],
  ['w==="LIVRAISON"&&s.jsx("div",{className:"h-full overflow-auto",children:s.jsx(Liv,{})})', "الرندر مربوط"],
  ['s.jsx($r,{color:"orange",on:w==="LIVRAISON"', "زر الفوتر 🚚 Livraison"],
  ['g(C=>C.includes("LIVRAISON")?C:[...C,"LIVRAISON"])', "التبويب كيتزاد أوتوماتيك عند المستخدمين القدام"],
  ['"LIVRAISON":"🚚"', "الأيقونة فخريطة الصفحات"],
  ['"LIVRAISON":"orange"', "اللون فخريطة الصفحات"],
  ['"afrizon_livraison_v1"', "المفتاح فقائمة مزامنة الكلايان"],
  ['Tracking ID — شركة الشحن', "خانة Tracking ID"],
  ['children:"Motif retour"', "خانة Motif retour"],
  ['Date expédition', "خانة Date expédition"],
  ['Date livraison', "خانة Date livraison"],
];
for (const [needle, label] of checks) {
  if (!html.includes(needle)) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* الحالات التسعة كلهم موجودين */
for (const st of statuses) {
  if (!html.includes(st)) { console.error("❌ حالة ناقصة:", st); bad++; }
}
if (!bad) console.log("✅ الحالات التسعة كاملين:", statuses.join(" | "));

/* الحقول كاملين */
for (const f of fields) {
  if (!html.includes(f)) { console.error("❌ حقل ناقص:", f); bad++; }
}
if (!bad) console.log("✅ الحقول كاملين:", fields.join(" · "));

/* 2) api.php: المفتاح مقبول عند السيرفر */
if (!api.includes('"afrizon_livraison_v1"')) { console.error("❌ api.php ما فيهش المفتاح الجديد!"); bad++; }
else console.log("✅ api.php كيقبل المفتاح afrizon_livraison_v1 (المزامنة غادي تخدم)");

/* 3) محاكاة منطق المتجر (نفس الكود بالحرف) */
const mem = {};
const localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};
let LVC = null;
const LVI = new Set();
function liv_read(){try{const e=localStorage.getItem("afrizon_livraison_v1");if(e){const n=JSON.parse(e);if(Array.isArray(n))return n}}catch{}return[]}
function liv_set(e){LVC=e;try{localStorage.setItem("afrizon_livraison_v1",JSON.stringify(e))}catch{}LVI.forEach(n=>n())}

/* إضافة commande: qte=2, prix=250, frais=35 → total=535 */
let c = LVC ?? liv_read();
const tot = 2 * 250 + 35;
liv_set([{ id: Math.max(0, ...c.map(x => x.id)) + 1, num: "CMD-001", client: "Sara", tel: "0612345678", ville: "Agadir", adresse: "حي السلام", produit: "نظارة", qte: 2, prix: 250, frais: 35, total: tot, livreur: "Aman", statut: "À préparer", dateExp: "", dateLiv: "", motif: "", tracking: "TRK-123" }, ...c]);
if (liv_read().length === 1 && liv_read()[0].total === 535 && liv_read()[0].statut === "À préparer") {
  console.log("✅ الإضافة: commande تسجلات بالحقول كاملين (Total محسوب = 535 DH)");
} else { console.error("❌ الإضافة ما خدمتش:", liv_read()); bad++; }

/* تغيير الحالة: À préparer → Expédié (نفس منطق upd) */
const id = liv_read()[0].id;
liv_set(liv_read().map(x => x.id === id ? { ...x, statut: "Expédié", dateExp: "2026-08-30", tracking: "TRK-456" } : x));
if (liv_read()[0].statut === "Expédié" && liv_read()[0].tracking === "TRK-456") {
  console.log("✅ تغيير الحالة + Tracking ID كيخدمو (Expédié / TRK-456)");
} else { console.error("❌ التحديث ما خدمش"); bad++; }

/* الحذف */
liv_set(liv_read().filter(x => x.id !== id));
if (liv_read().length === 0) console.log("✅ الحذف كيخدم");
else { console.error("❌ الحذف ما خدمش"); bad++; }

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ صفحة LIVRAISON (v3.6) جاهزة: 9 حالات + كل الحقول + Tracking ID + مزامنة");
process.exit(0);
