#!/usr/bin/env node
/**
 * ✅ تست تلقائي ديال v3.35 — الربط مع شركة التوصيل Digylog (تغيير Suivie فقط)
 * ---------------------------------------------------------------
 * المطلوب: إلا كانت طلبية Livrée فـ Digylog → Suivie ديالها فـ CRM تتبدل أوتوماتيك.
 * الآلية:
 *  • api.php = وسيط: action=digylog_sync (قراءة حالات Digylog بـ OAuth2 Bearer + تطبيقها على afrizon_orders_v5)
 *  • action=digylog_test (اختبار التوكن عبر /networks)
 *  • action=digylog_webhook (GET أو POST محمي بـ secret للتحديث الفوري)
 *  • صفحة LIVRAISON: شريط 🚚 Digylog + زر 🔄 مزامنة Suivie + ⚙️ إعدادات (توكن/شبكة/متجر/URL/secret)
 *  • المفتاح afrizon_digylog_v1 مسجل فالـ sync engine (sg) ديال العميل والسيرفر — الإعدادات كتزامن
 *  • مزامنة تلقائية كل 20 دقيقة (1200e3) إلا كاين توكن
 *  • Suivie فقط كتتبدل — باقي الحقول والمنطق ما تمسّوش
 *
 * الاختبار الوظيفي ديال api.php: python3 /tmp/test_digylog_api.py (18 فحص — بلا أنترنيت عبر CRM_DIGYLOG_MOCK)
 * التشغيل: node dev/test-digylog.mjs
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
const liv = html.slice(livStart, livEnd);

/* [needle, label, api?] — api=true كيتفقد فـ api.php، وإلا فـ index.html */
const checks = [
  /* واجهة LIVRAISON */
  ['🚚 Digylog', "شريط Digylog فصفحة LIVRAISON"],
  ['🔄 مزامنة Suivie', "زر المزامنة اليدوية"],
  ['⚙️ الإعدادات', "زر إعدادات الربط"],
  ['إعدادات الربط مع Digylog', "نافذة الإعدادات"],
  ['🔑 Token OAuth2 (Bearer)', "خانة التوكن"],
  ['🌐 Network', "خانة الشبكة (network)"],
  ['🏪 Store', "خانة المتجر (store)"],
  ['📋 Orders URL', "خانة Orders URL (قراءة الحالات)"],
  ['🔔 Webhook Secret', "خانة secret ديال الويب هوك"],
  ['action=digylog_webhook&secret=', "عرض عنوان الـ webhook فالواجهة"],
  ['🔍 اختبار الاتصال', "زر اختبار التوكن"],
  ['💾 حفظ', "زر الحفظ"],
  ['ما تزامناتش مع Digylog بعد', "حالة افتراضية: ما تزامناتش"],
  /* منطق المزامنة فالعميل */
  ['localStorage.getItem("afrizon_digylog_v1")', "الإعدادات كتتقرا من localStorage"],
  ['localStorage.setItem("afrizon_digylog_v1"', "الإعدادات كتتحفظ فـ localStorage"],
  ['aa("afrizon_digylog_v1")', "الحفظ كيطلق المزامنة ديال الـ CRM (aa)"],
  ['action: "digylog_sync"', "نداء المزامنة للسيرفر"],
  ['"X-Sync-Token": Rd', "المزامنة محمية بنفس توكن الـ CRM"],
  ['1200 * 1e3', "مزامنة تلقائية كل 20 دقيقة"],
  ['c.token', "المزامنة التلقائية غير إلا كاين توكن محفوظ"],
  /* key فـ sync engine */
  ['"custom_sheets_v1","afrizon_digylog_v1"]', "afrizon_digylog_v1 مسجل فـ sg ديال العميل (المزامنة كتقبلو)"],
  ['if(!sg.includes(e))return;', "aa كتكتب غير المفاتيح المسجلة فـ sg"],
  /* api.php */
  ['"afrizon_digylog_v1"', "afrizon_digylog_v1 مقبول فـ api.php ($KEYS)", true],
  ["$b['action'] === 'digylog_webhook'", "استقبال webhook عبر POST", true],
  ["$action === 'digylog_webhook'", "استقبال webhook عبر GET", true],
  ["$b['action'] === 'digylog_test' || $b['action'] === 'digylog_sync'", "إجراءات digylog_test / digylog_sync", true],
  ["Authorization: Bearer ' . $token", "نداءات Digylog كتاخد التوكن Bearer", true],
  ["crm_digylog_map_status", "خريطة حالات Digylog → Suivie CRM", true],
  ["'Livrée'", "Livrée كتكتب فـ livraison ديال الطلبية", true],
  ["'Retour'", "Retour مدعومة", true],
  ["'Annulé'", "Annulé مدعومة (statut ديال الطلبية)", true],
  ["crm_backup_current('digylog-sync')", "نسخة احتياطية قبل أي تغيير من المزامنة", true],
  ["crm_backup_current('digylog-webhook')", "نسخة احتياطية قبل أي تغيير من الـ webhook", true],
  ["hash_equals($sec, $secret)", "الـ webhook محمي بـ hash_equals (بلا timing attack)", true],
  ["$CRM_DIGYLOG_MOCK", "خطاف الاختبار CRM_DIGYLOG_MOCK موجود (اختبار بلا أنترنيت)", true],
  ["'idCmd' => isset($o['idCmd']) ? $o['idCmd'] : $num", "المطابقة بين طلبيات Digylog والـ CRM بـ idCmd == num", true],
  /* ما يتبدل حتى حاجة أخرى */
  ['const col = x => {', "خريطة الحالة الأصلية ديال LIVRAISON ما تبدلاتش"],
  ['L === "Livrée" ? "Livré"', "عرض Livré ما تبدلش"],
  ['uo(x.id, { ...P, livraison: st === "Livré" ? "Livrée" : st })', "النقل اليدوي باقي كما هو"],
  ['const { orders: o, upd: uo } = Xt()', "قراءة الطلبيات من نفس مخزن الـ CRM"],
  ['" lignes · CA "', "toolbar ديال COMONDES ما تمسّش"],
];

for (const [needle, label, isApi] of checks) {
  const src = isApi ? api : html;
  const ok = src.includes(needle);
  if (!ok) { console.error("❌ ناقص فالكود:", label); bad++; }
  else console.log("✅", label);
}

/* تكامل: Liv فيها كامل القطع ديال الواجهة */
for (const n of ["dgRun", "dgSave", "dgTest", "dgFld", "DgSet", "dgCfg"]) {
  const ok = liv.includes(n);
  if (!ok) { console.error("❌ ناقص فـ Liv:", n); bad++; }
  else console.log("✅ Liv:", n);
}

console.log("ℹ️ الاختبار الوظيفي ديال api.php (18 فحص بلا أنترنيت): python3 /tmp/test_digylog_api.py");
console.log(bad ? `\n❌❌❌ ${bad} فحص فاشل` : "\n✅✅✅ صفحة LIVRAISON + api.php جاهزين لربط Digylog (v3.35)");
process.exit(bad ? 1 : 0);
