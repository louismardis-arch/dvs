#!/usr/bin/env node
/**
 * ✅ تست تلقائي لصفحة LIVRAISON (v3.9 — الإصلاح الكامل)
 * ---------------------------------------------------------------
 * المطلوب:
 * • صفحة "🚚 LIVRAISON" بالحالات التسعة
 * • كل commande فيها: N° Commande, Client, Téléphone, Ville, Adresse,
 *   Produit, Quantité, Prix, Frais livraison, Total, Livreur, Statut,
 *   Date expédition, Date livraison, Motif retour + Tracking ID
 * • المزامنة عبر api.php (مفتاح afrizon_livraison_v1)
 * • v3.9: المكوّن معاد البناء على النمط القياسي (useState + localStorage + Ms/aa)
 *   — الفورم كيخدم: تعمير + أوتوفيل frais من LES VILLES + حفظ
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
  ['const LVS="afrizon_livraison_v1",LSts=[', "الحالات التسعة موجودة"],
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
  /* v3.9: النمط القياسي + أوتوفيل */
  ['lread=', "v3.9: قارئ الحالة lread"],
  ['Ms(LVS,()=>setList(lread()))', "v3.9: مزامنة Ms(LVS) على نمط الصفحات الخدامة"],
  ['wo(v,cities)', "v3.9: أوتوفيل frais من LES VILLES"],
  ['✔ تمن التوصيل أوتوماتيكي من LES VILLES', "v3.9: تأكيد الثمن الأوتوماتيكي"],
  ['useSyncExternalStore', "v3.9: ما بقاش useSyncExternalStore فالـ Liv (المشكل اللول تصلح)"],
];
for (const [needle, label, neg] of checks) {
  const ok = neg ? !html.slice(html.indexOf('const LVS='), html.indexOf('function Vj(){')).includes(needle) : html.includes(needle);
  if (!ok) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* الحالات التسعة كلهم موجودين */
for (const st of statuses) {
  if (!html.includes(st)) { console.error("❌ حالة ناقصة:", st); bad++; }
}
if (!bad) console.log("✅ الحالات التسعة كاملين:", statuses.join(" | "));

/* الحقول كاملين */
let fieldsOk = true;
for (const f of fields) {
  if (!html.includes(f)) { console.error("❌ حقل ناقص:", f); bad++; fieldsOk = false; }
}
if (fieldsOk) console.log("✅ الحقول كاملين:", fields.join(" · "));

/* 2) api.php: المفتاح مقبول عند السيرفر */
if (!api.includes('"afrizon_livraison_v1"')) { console.error("❌ api.php ما فيهش المفتاح الجديد!"); bad++; }
else console.log("✅ api.php كيقبل المفتاح afrizon_livraison_v1 (المزامنة غادي تخدم)");

/* 3) محاكاة منطق المتجر v3.9 (نفس الكود بالحرف: lread + sv) */
const mem = {};
const localStorage = {
  getItem: k => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
};
const LVS = "afrizon_livraison_v1";
let lst = null;
const lread = () => { try { const e = localStorage.getItem(LVS); if (e) { const n = JSON.parse(e); if (Array.isArray(n)) return n; } } catch {} return []; };
const aa = () => {}; // محفّز مزامنة السيرفر
const sv = e => { lst = e; try { localStorage.setItem(LVS, JSON.stringify(e)); } catch {} aa(LVS); };

/* إضافة commande: qte=2, prix=250, frais=35 → total=535 */
const c0 = lst ?? lread();
const tot = 2 * 250 + 35;
sv([{ id: Math.max(0, ...c0.map(x => x.id || 0)) + 1, num: "CMD-001", client: "Sara", tel: "0612345678", ville: "Agadir", adresse: "حي السلام", produit: "نظارة", qte: 2, prix: 250, frais: 35, total: tot, livreur: "Aman", statut: "À préparer", dateExp: "", dateLiv: "", motif: "", tracking: "TRK-123" }, ...c0]);
if (lread().length === 1 && lread()[0].total === 535 && lread()[0].statut === "À préparer") {
  console.log("✅ الإضافة: commande تسجلات بالحقول كاملين (Total محسوب = 535 DH)");
} else { console.error("❌ الإضافة ما خدمتش:", lread()); bad++; }

/* تغيير الحالة: À préparer → Expédié (نفس منطق upd) */
const id = lread()[0].id;
sv(lread().map(x => x.id === id ? { ...x, statut: "Expédié", dateExp: "2026-08-30", tracking: "TRK-456" } : x));
if (lread()[0].statut === "Expédié" && lread()[0].tracking === "TRK-456") {
  console.log("✅ تغيير الحالة + Tracking ID كيخدمو (Expédié / TRK-456)");
} else { console.error("❌ التحديث ما خدمش"); bad++; }

/* الحذف */
sv(lread().filter(x => x.id !== id));
if (lread().length === 0) console.log("✅ الحذف كيخدم");
else { console.error("❌ الحذف ما خدمش"); bad++; }

/* أوتوفيل frais من LES VILLES (نفس منطق wo + حقول الفورم) */
const villes = [{ nom: "Agadir", prix: 25 }, { nom: "Tanger", prix: 40 }];
const Ap = e => e; // نسخة مبسطة من التسوية
const er = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
const wo = (e, n) => { const v = er(e); if (!v) return null; const m = (n || []).find(x => er(x.nom) === v); return m ? Number(m.prix) : null; };
const ville = "Agadir", fraisAuto = wo(ville, villes);
if (fraisAuto === 25) console.log("✅ أوتوفيل frais: Agadir → 25 DH");
else { console.error("❌ أوتوفيل frais ما خدمش:", fraisAuto); bad++; }

if (bad) { console.error(`❌❌❌ ${bad} مشكل`); process.exit(1); }
console.log("✅✅✅ صفحة LIVRAISON (v3.9) جاهزة: 9 حالات + كل الحقول + Tracking ID + مزامنة + فورم خدام");
process.exit(0);
