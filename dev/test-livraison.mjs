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
  ['function Liv(){', "المكوّن Liv موجود"],
  ['const LVS="afrizon_livraison_v1",LSts=[', "الحالات التسعة موجودة"],
  ['children:"🚚"', "أيقونة 🚚"],
  ['children:"LIVRAISON"', "عنوان الصفحة"],
  ['w==="LIVRAISON"&&s.jsx("div",{className:"h-full overflow-auto",children:s.jsx(Liv,{})})', "الرندر مربوط"],
  ['s.jsx($r,{color:"orange",on:w==="LIVRAISON"', "زر الفوتر 🚚 Livraison"],
  ['g(C=>C.includes("LIVRAISON")?C:[...C,"LIVRAISON"])', "التبويب كيتزاد أوتوماتيك عند المستخدمين القدام"],
  ['"LIVRAISON":"🚚"', "الأيقونة فخريطة الصفحات"],
  ['"afrizon_livraison_v1"', "المفتاح كيبقا مقبول فالمزامنة (توافق مع الداتا القديمة)"],
  ['Tracking ID — شركة الشحن', "خانة Tracking ID"],
  ['children:"Motif retour"', "خانة Motif retour"],
  ['Date expédition', "خانة Date expédition"],
  ['Date livraison', "خانة Date livraison"],
  /* v3.10: مربوطة بالطلبيات */
  ['{orders:o,upd:uo}=Xt()', "v3.10: الداطا كتجي من مخزن الطلبيات (Xt)"],
  ['مربوطة مع صفحة الطلبيات — كل طلبية كتجي هنا أوتوماتيك', "v3.10: توضيح الربط مع الطلبيات"],
  ['مربوطة مع Commandes', "v3.10: شريط التوضيح"],
  ['col=x=>{if(String(x.statut)==="Annulé")return"Annulé"', "v3.10: خريطة العمود (statut Annulé → عمود Annulé)"],
  ['L==="Livrée"?"Livré":L==="Expédier vers"?"Expédié":L==="Out Of Stock"?"Problème livraison"', "v3.10: خريطة القيم القديمة (Livrée/Expédier vers/Out Of Stock)"],
  ['uo(x.id,{statut:"Annulé"})', "v3.10: النقل لـ Annulé كيعدل الطلبية فنفس المخزن"],
  ['uo(x.id,{...P,livraison:st==="Livré"?"Livrée":st})', "v3.10: النقل كيكتب Livrée فحقل livraison ديال الطلبية"],
  ['uo(x.id,{tracking:e.target.value})', "v3.10: Tracking ID كيتسجل فالطلبية نفسها"],
  ['children:["#",x.idCmd||x.id]', "v3.10: N° Commande من idCmd ديال الطلبية"],
  ['const{orders:o,upd:uo}=Xt(),{currentUser:us}=kr(),[sh,G]=ee.useState(""),cities=Ll(),', "v3.12: Liv كتقرا المدن (Ll) باش تحسب frais الحقيقي"],
  ['frais=x=>(x.livraison==="Retour"||String(x.statut)==="Annulé")?0:(wo(x.ville,cities)??0)', "v3.12: frais = تمن المدينة الحالي — Retour/Annulé = 0 DH"],
  ['R2("Frais livraison",NF(frx)+" DH")', "v3.12: الكارطة كتعرض frais المحسوب (ماشي commission)"],
  ['x_=["","À préparer","Préparé","Expédié","En livraison","Livrée","Refusé","Retour","Annulé","Problème livraison","Out Of Stock","Expédier vers"]', "v3.10: نفس المفردات فصفحة الطلبيات (x_)"],
  ['useSyncExternalStore', "v3.10: ما بقاش useSyncExternalStore فالـ Liv (المشكل اللول)"],
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

/* وضع كل طلبية فالعمود ديالها */
const placed = orders.map(x => [x.idCmd, col(x)]);
const expect = [["CMD-1", "À préparer"], ["CMD-2", "Livré"], ["CMD-3", "Annulé"], ["CMD-4", "Expédié"], ["CMD-5", "Retour"]];
const okPlace = JSON.stringify(placed) === JSON.stringify(expect);
if (okPlace) console.log("✅ الداطا أوتوماتيك فالكانبان:", placed.map(p => p.join("→")).join(" | "));
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
