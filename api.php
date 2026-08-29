<?php
/* =====================================================================
 * Paraveda CRM Sync — v2.0 (Hardened / نسخة محصّنة)
 * ---------------------------------------------------------------------
 * بديل مباشر (drop-in) للنسخة القديمة: نفس الواجهة تماماً
 *   GET  api.php                     → بيانات المزامنة (كما كان)
 *   POST api.php  {key,t,d} + token  → حفظ بيانات مفتاح (كما كان)
 *
 * الجديد في هذه النسخة:
 *  1) كتابة ذرّية (tmp + rename) + قفل flock → لا ملف فاسد/فارغ أبداً
 *  2) نسخ احتياطية تلقائية (لكل تعديل + لقطة يومية) + تدوير
 *  3) استرجاع تلقائي: إذا فُقد/تلف الملف الرئيسي يُسترجع من آخر نسخة سليمة
 *  4) حماية "الأشباح" (Ghost Guard): يرفض إرجاع نسخة قديمة مطابقة
 *     (مثل بيانات المصنع/الديمو) فوق بيانات أحدث — وهو سبب اختفاء
 *     اليوزرات ورجوع الطلبيات القديمة
 *  5) سجل تدقيق audit.log: من كتب ماذا ومتى ومن أي IP
 *  6) نقاط نهاية للتشخيص والاسترجاع (محمية بنفس التوكن):
 *       GET  ?action=status    → تقرير صحة التخزين
 *       GET  ?action=backups   → قائمة النسخ الاحتياطية
 *       POST {"action":"restore","file":"..."} → استرجاع نسخة
 *  7) تخزين البيانات خارج مجلد الموقع إن أمكن (لا تُمس عند إعادة الرفع)
 * ---------------------------------------------------------------------
 * متوافق مع PHP 7.2+ (لا يتطلب أي إضافة)
 * ===================================================================== */

error_reporting(E_ALL);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('X-Crm-Sync: v2');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-Sync-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { exit; }

$SECRET = 'c6e04cb5de9088be01a685abc243995a80426eba45de2060';

$KEYS = array(
  "afrizon_users_v1","afrizon_orders_v5","afrizon_agent_names_v1",
  "afrizon_chat_v1","afrizon_worktimes_v1","afrizon_remarques_v1",
  "afrizon_avances_v1","afrizon_adspend_v1","afrizon_perfrows_v1",
  "afrizon_history_v1","afrizon_villes_v2","afrizon_catalog_v1",
  "sheet_pièce","afrizon_team_photos_v1","tabs_list_v1","custom_sheets_v1",
);

/* ---- إعدادات (يمكن تعديلها) ---- */
define('CRM_GHOST_GRACE',      1800);  // ثانية: يُسمح بإرجاع نسخة قديمة "مطابقة" فقط خلال هذه المدة
define('CRM_BACKUPS_KEEP',     60);    // عدد النسخ اللحظية المحفوظة
define('CRM_DAILY_KEEP',       45);    // عدد اللقطات اليومية المحفوظة
define('CRM_HIST_PER_KEY',     30);    // حجم سجل بصمات كل مفتاح (لمكافحة الأشباح)
define('CRM_AUDIT_MAX_BYTES',  2097152); // 2MB ثم يدور السجل
define('CRM_FUTURE_MS',        60000); // تسامح ساعة الجهاز (دقيقة للمستقبل)
// سقف إجمالي حجم مجلد النسخ الاحتياطية (256MB) — بعده تُحذف الأقدم أولاً
$GLOBALS['CRM_BACKUPS_MAX_BYTES'] = isset($GLOBALS['CRM_BACKUPS_MAX_BYTES']) ? $GLOBALS['CRM_BACKUPS_MAX_BYTES'] : 268435456;

/* بصمات بيانات المصنع المضمّنة في التطبيق (sha256 لمحتوى JSON كما يرسله المتصفح).
 * إذا وصل "بالضبط" هذا المحتوى فوق بيانات أحدث → رفض (ghost_seed).
 * أُخذت من حزمة الواجهة: users الافتراضي [admin@paraveda.ma]،
 * الطلبيات التجريبية dp()، وأسماء الوكلاء الافتراضية.
 * ملاحظة: نسختان من users seed — القديمة (admin123) لكاش المتصفحات
 * القديمة، والجديدة (كلمة السر الحالية) للنسخة المحدثة. */
$GLOBALS['CRM_SEED_HASHES'] = array(
  "afrizon_users_v1"       => array(
    "49419fd53fcd0287ba747af929f5439faa6c20c423a9f954bd933abcd52719d6", // seed قديم: admin123
    "108061314dc7d0ccd39eaea1f404b0b54b55198f5b9cb6040d7a2ee87e9abd52", // seed جديد
  ),
  "afrizon_orders_v5"      => array("c7df94df270625f03e60ab7d3b706e476a6ce464c12e76e44a32e8a253cf7929"),
  "afrizon_agent_names_v1" => array("c6019f6b4c6eb01da6f877f05771ebfb5fedc40cb52aff3556e5beb9e044ef36"),
);

/* ===================================================================== */
/* أدوات مساعدة                                                          */
/* ===================================================================== */

function crm_now_ms() { return (int)round(microtime(true) * 1000); }
function crm_ip() {
  $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'cli';
  return $ip;
}
function crm_ua() {
  $ua = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';
  return substr($ua, 0, 120);
}
function crm_token() {
  if (isset($_SERVER['HTTP_X_SYNC_TOKEN'])) return $_SERVER['HTTP_X_SYNC_TOKEN'];
  if (isset($_GET['token'])) return $_GET['token'];
  return '';
}
function crm_raw_input() {
  if (isset($GLOBALS['CRM_RAW_INPUT'])) return $GLOBALS['CRM_RAW_INPUT']; // للاختبار الآلي فقط
  return file_get_contents('php://input');
}
function crm_out($arr, $code = 200) {
  if ($code !== 200) http_response_code($code);
  echo json_encode($arr, JSON_UNESCAPED_UNICODE);
  exit;
}

/* ---- اختيار مجلد التخزين ---- */
function crm_storage_dir() {
  static $dir = null; static $mode = null;
  if ($dir !== null) return array($dir, $mode);

  // 0) إعداد صريح عبر crm_config.php (اختياري): define('CRM_DATA_DIR', '/abs/path');
  $cfg = __DIR__ . '/crm_config.php';
  if (file_exists($cfg)) { include_once $cfg; }
  $candidates = array();
  if (defined('CRM_DATA_DIR')) $candidates[] = array(rtrim(CRM_DATA_DIR, '/'), 'custom');
  // 1) خارج جذر الويب (الأفضل: إعادة رفع الموقع لا تمسه)
  $candidates[] = array(dirname(__DIR__) . '/crm-paraveda-data', 'outside-webroot');
  // 2) مجلد غامض داخل الموقع محمي بـ .htaccess
  $candidates[] = array(__DIR__ . '/crm-paraveda-data-7f3a', 'webroot-protected');
  // 3) آخر احتمال: بجانب api.php (سلوك النسخة القديمة)
  $candidates[] = array(__DIR__, 'legacy');

  foreach ($candidates as $c) {
    $d = $c[0];
    $hadData = file_exists($d . '/crm_data.json');
    if (!is_dir($d)) { @mkdir($d, 0755, true); }
    if (is_dir($d) && is_writable($d)) {
      crm_protect_dir($d);
      $dir = $d; $mode = $c[1];
      crm_migrate_legacy($d);
      return array($d, $mode);
    }
    // المجلد فيه بياناتنا لكنه فقد قابلية الكتابة (تغيير صلاحيات من الهوست؟)
    // → خطأ صريح أفضل من التبديل الصامت لمكان آخر (يبدو كأن البيانات اختفت)
    if ($hadData && !is_writable($d)) {
      if (!headers_sent()) {
        http_response_code(500);
        echo json_encode(array('ok'=>false, 'err'=>'storage-readonly', 'dir'=>basename($d)), JSON_UNESCAPED_UNICODE);
      }
      exit;
    }
  }
  $dir = false; $mode = 'nowhere';
  return array($dir, $mode);
}
function crm_protect_dir($d) {
  $ht = $d . '/.htaccess';
  if (!file_exists($ht)) {
    @file_put_contents($ht,
      "# Paraveda CRM data - deny all\n" .
      "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n" .
      "<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n");
  }
  $ix = $d . '/index.html';
  if (!file_exists($ix)) { @file_put_contents($ix, "<!-- denied -->"); }
  $bk = $d . '/backups';
  if (!is_dir($bk)) { @mkdir($bk, 0755, true); }
}
/* ترحيل تلقائي للبيانات القديمة crm_data.json إن وُجدت بجانب api.php */
function crm_migrate_legacy($d) {
  $legacy = __DIR__ . '/crm_data.json';
  $target = $d . '/crm_data.json';
  if ($d !== __DIR__ && file_exists($legacy) && !file_exists($target)) {
    $s = file_get_contents($legacy);
    if (is_string($s) && $s !== '' && trim($s) !== '[]') {
      @file_put_contents($target, $s, LOCK_EX);
      crm_audit('migrate', 'legacy crm_data.json copied to new storage');
    } else {
      crm_audit('migrate', 'legacy file empty, skipped');
    }
  }
}

function crm_data_path()    { list($d) = crm_storage_dir(); return $d === false ? false : $d . '/crm_data.json'; }
function crm_backups_dir()  { list($d) = crm_storage_dir(); return $d === false ? false : $d . '/backups'; }
function crm_meta_path()    { list($d) = crm_storage_dir(); return $d === false ? false : $d . '/meta.json'; }
function crm_audit_path()   { list($d) = crm_storage_dir(); return $d === false ? false : $d . '/audit.log'; }
function crm_lock_path()    { list($d) = crm_storage_dir(); return $d === false ? false : $d . '/.crm.lock'; }

function crm_lock() {
  $f = @fopen(crm_lock_path(), 'c');
  if ($f) { @flock($f, LOCK_EX); }
  return $f;
}
function crm_unlock($f) {
  if ($f) { @flock($f, LOCK_UN); @fclose($f); }
}

function crm_atomic_write($path, $content) {
  $tmp = $path . '.tmp.' . getmypid();
  if (@file_put_contents($tmp, $content, LOCK_EX) === false) return false;
  if (!@rename($tmp, $path)) { @unlink($tmp); return false; }
  return true;
}

function crm_audit($event, $detail = '') {
  $p = crm_audit_path();
  if ($p === false) return;
  $line = date('Y-m-d H:i:s') . ' | ' . crm_ip() . ' | ' . $event . ' | ' . $detail . "\n";
  @file_put_contents($p, $line, FILE_APPEND | LOCK_EX);
  if (@filesize($p) > CRM_AUDIT_MAX_BYTES) {
    @rename($p, $p . '.1'); // تدوير: نحتفظ بنسخة واحدة سابقة
  }
}

function crm_read_meta() {
  $p = crm_meta_path();
  if ($p === false || !file_exists($p)) return crm_fresh_meta();
  $m = json_decode((string)file_get_contents($p), true);
  if (!is_array($m)) return crm_fresh_meta();
  $fresh = crm_fresh_meta();
  foreach ($fresh as $k => $v) { if (!isset($m[$k])) $m[$k] = $v; }
  return $m;
}
function crm_fresh_meta() {
  return array(
    'install_id'   => bin2hex(random_bytes(6)),
    'install_time' => time(),
    'counts'       => array('write'=>0,'noop'=>0,'stale'=>0,'ghost'=>0,'ghost_seed'=>0,'recover'=>0,'restore'=>0,'reject'=>0),
    'last_write'   => null,
    'last_write_ip'=> null,
    'keys'         => array(),
  );
}
function crm_write_meta($m) { crm_atomic_write(crm_meta_path(), json_encode($m, JSON_UNESCAPED_UNICODE)); }

function crm_valid_data_str($s) {
  if (!is_string($s) || $s === '' ) return false;
  $j = json_decode($s, true);
  return is_array($j) ? $j : false;
}

/* قراءة البيانات الحالية: المصدر الرئيسي، وإن فسد/فُقد → آخر نسخة سليمة
 * $alreadyLocked: المستدعي يحمل القفل بالفعل (لا تقفل داخلياً) */
function crm_read_data($autoRecover = true, $alreadyLocked = false) {
  $p = crm_data_path();
  if ($p !== false && file_exists($p)) {
    $s = (string)file_get_contents($p);
    $j = crm_valid_data_str($s);
    if ($j !== false) return $j;
    // (السقوط إلى الاسترجاع أدناه)
  } else {
    // الملف غير موجود أصلاً (تثبيت جديد، أو مسحه الهوست) → جرّب النسخ الاحتياطية
    if (!$autoRecover) return array();
  }

  // الملف فاسد أو مفقود → حاول آخر نسخة احتياطية سليمة
  if ($autoRecover && $p !== false) {
    $lock = $alreadyLocked ? null : crm_lock();
    $bk = crm_newest_valid_backup();
    $jj = ($bk !== null) ? crm_valid_data_str((string)file_get_contents($bk)) : false;
    if ($jj !== false) {
      crm_atomic_write($p, json_encode($jj, JSON_UNESCAPED_UNICODE));
      $m = crm_read_meta(); $m['counts']['recover']++; crm_write_meta($m);
      crm_audit('recover', 'main file missing/corrupt, restored from ' . basename($bk));
    } else {
      $jj = false;
    }
    if (!$alreadyLocked) crm_unlock($lock);
    if ($jj !== false) return $jj;
    return array();
  }
  return array();
}

function crm_backup_files($prefix = 'b-') {
  $dir = crm_backups_dir();
  $out = array();
  if ($dir === false || !is_dir($dir)) return $out;
  foreach (scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    if (strpos($f, $prefix) === 0 && substr($f, -5) === '.json') $out[] = $dir . '/' . $f;
  }
  sort($out); // التسمية بالوقت تصعّدها
  return $out;
}

function crm_newest_valid_backup($prefix = 'b-') {
  $files = array_reverse(crm_backup_files($prefix));
  foreach ($files as $f) {
    if (crm_valid_data_str((string)file_get_contents($f)) !== false) return $f;
  }
  // جرّب اليومية أيضاً
  $files = array_reverse(crm_backup_files('d-'));
  foreach ($files as $f) {
    if (crm_valid_data_str((string)file_get_contents($f)) !== false) return $f;
  }
  return null;
}

/* نسخة احتياطية قبل استبدال المحتوى الحالي + لقطة يومية بعد الكتابة */
function crm_backup_current($reason) {
  $p = crm_data_path();
  if ($p === false || !file_exists($p)) return;
  $s = (string)file_get_contents($p);
  if (!crm_valid_data_str($s)) return;
  $dir = crm_backups_dir();
  if ($dir === false) return;

  // لا تكرّر نسخاً متطابقة متتالية
  $prev = crm_backup_files('b-');
  if ($prev) {
    $last = end($prev);
    if (md5((string)file_get_contents($last)) === md5($s)) { /* نفس المحتوى: تخطَّ النسخة اللحظية */ }
    else { @copy($p, $dir . '/b-' . date('Ymd-His') . '-' . sprintf('%03d', mt_rand(0,999)) . '.json'); }
  } else {
    @copy($p, $dir . '/b-' . date('Ymd-His') . '-000.json');
  }
  crm_rotate('b-', CRM_BACKUPS_KEEP);

  // لقطة يومية (محتوى "قبل" التغيير — نقطة استرجاع لليوم)
  $daily = $dir . '/d-' . date('Ymd') . '.json';
  if (!file_exists($daily)) {
    @copy($p, $daily);
    crm_rotate('d-', CRM_DAILY_KEEP);
  }

  // سقف الحجم الكلي: احذف الأقدم أولاً (مع إبقاء آخر نسختين على الأقل)
  crm_backups_trim_size();
}
function crm_backups_trim_size() {
  $dir = crm_backups_dir();
  if ($dir === false || !is_dir($dir)) return;
  $max = isset($GLOBALS['CRM_BACKUPS_MAX_BYTES']) ? (int)$GLOBALS['CRM_BACKUPS_MAX_BYTES'] : 268435456;
  $files = array_merge(crm_backup_files('b-'), crm_backup_files('d-'));
  $total = 0;
  foreach ($files as $f) { $total += @filesize($f) ?: 0; }
  $n = count($files);
  $i = 0;
  while ($total > $max && $i < $n - 2) {
    $sz = @filesize($files[$i]) ?: 0;
    if (@unlink($files[$i])) { $total -= $sz; }
    $i++;
  }
}
function crm_rotate($prefix, $keep) {
  $files = crm_backup_files($prefix);
  $extra = count($files) - $keep;
  for ($i = 0; $i < $extra; $i++) { @unlink($files[$i]); }
}

function crm_canon_hash($d) {
  return hash('sha256', json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
}

/* مسح تلقائي لبيانات الديمو (v2.4): إذا كانت الطلبيات المخزنة تطابق "بالكامل"
 * الـ seed التجريبي (168 طلبية) تُستبدل بقائمة فارغة — مرة واحدة فقط (علم في meta).
 * آمن 100%: أي بيانات حقيقية مختلطة لا تطابق → لا يُمَس أي شيء.
 * ترجع: 'wipe' (تم المسح) | 'checked' (دُوّن العلم) | 'none' (لا طلبيات بعد —
 * لا تدوّن العلم حتى لا يُستهلك قبل وصول أي داتا) */
function crm_maybe_wipe_demo(&$data) {
  if (isset($data['afrizon_orders_v5']['d'])) {
    $h = crm_canon_hash($data['afrizon_orders_v5']['d']);
    if (in_array($h, $GLOBALS['CRM_SEED_HASHES']['afrizon_orders_v5'], true)) {
      $data['afrizon_orders_v5'] = array('t' => crm_now_ms(), 'd' => array());
      return 'wipe';
    }
    return 'checked';
  }
  return 'none';
}

/* ===================================================================== */
/* المعالجة الرئيسية                                                     */
/* ===================================================================== */

try {
  $m = $_SERVER['REQUEST_METHOD'] ?? 'GET';

  /* ---------- GET ---------- */
  if ($m === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'status' || $action === 'backups') {
      if (crm_token() !== $SECRET) crm_out(array('ok'=>false, 'err'=>'token'), 403);
      list($dir, $mode) = crm_storage_dir();
      if ($dir === false) crm_out(array('ok'=>false, 'err'=>'storage-not-writable'), 500);
      crm_boot_meta();
      $meta = crm_read_meta();

      if ($action === 'backups') {
        $list = array();
        foreach (array_merge(array_reverse(crm_backup_files('b-')), array_reverse(crm_backup_files('d-'))) as $f) {
          $list[] = array('file'=>basename($f), 'bytes'=>filesize($f), 'mtime'=>date('Y-m-d H:i:s', filemtime($f)));
        }
        crm_out(array('ok'=>true, 'backups'=>$list));
      }

      $data = crm_read_data();
      $keysInfo = array();
      foreach ($KEYS as $k) {
        if (isset($data[$k]) && is_array($data[$k])) {
          $t = isset($data[$k]['t']) ? (int)$data[$k]['t'] : 0;
          $keysInfo[] = array(
            'key'=>$k, 't'=>$t,
            'age_h'=> $t ? round((crm_now_ms()-$t)/3600000, 1) : null,
            'bytes'=>strlen(json_encode($data[$k]['d'] ?? null, JSON_UNESCAPED_UNICODE)),
          );
        }
      }
      $backups = array();
      foreach (array_slice(array_reverse(crm_backup_files('b-')), 0, 10) as $f) {
        $backups[] = array('file'=>basename($f), 'bytes'=>filesize($f), 'mtime'=>date('Y-m-d H:i:s', filemtime($f)));
      }
      $auditTail = array();
      $ap = crm_audit_path();
      if ($ap && file_exists($ap)) {
        $lines = array_slice(file($ap, FILE_IGNORE_NEW_LINES), -25);
        $auditTail = $lines;
      }
      crm_out(array(
        'ok'=>true,
        'server_time'=>date('Y-m-d H:i:s'),
        'php'=>PHP_VERSION,
        'storage'=>array('mode'=>$mode, 'dir'=>basename($dir), 'writable'=>is_writable($dir)),
        'install'=>array('id'=>$meta['install_id'], 'since'=>date('Y-m-d H:i:s', $meta['install_time'])),
        'data'=>array('exists'=>file_exists(crm_data_path()), 'bytes'=>@filesize(crm_data_path()) ?: 0, 'keys'=>$keysInfo),
        'backups_count'=>count(crm_backup_files('b-')) + count(crm_backup_files('d-')),
        'backups_latest'=>$backups,
        'counters'=>$meta['counts'],
        'last_write'=> $meta['last_write'] ? date('Y-m-d H:i:s', $meta['last_write']) : null,
        'last_write_ip'=>$meta['last_write_ip'],
        'audit_tail'=>$auditTail,
        'note'=>'status/secure endpoint — v2 hardened sync',
      ));
    }

    // القراءة العادية (كما في النسخة القديمة)
    list($dir, $mode) = crm_storage_dir();
    if ($dir === false) crm_out(array(), 500);
    crm_boot_meta();
    $data = crm_read_data();

    // مسح تلقائي لبيانات الديمو (مرة واحدة) — إلا كانت مطابقة تماماً للـ seed
    $meta = crm_read_meta();
    if (empty($meta['demo_wipe_done'])) {
      $lock = crm_lock();
      $wr = crm_maybe_wipe_demo($data);
      if ($wr === 'wipe') {
        crm_atomic_write(crm_data_path(), json_encode($data, JSON_UNESCAPED_UNICODE));
        crm_audit('demo_autowipe', 'exact factory demo orders replaced with an empty list');
      }
      if ($wr !== 'none') {
        $meta['demo_wipe_done'] = 1;
        crm_write_meta($meta);
      }
      crm_unlock($lock);
    }

    if (count($data) === 0) { echo '{}'; exit; }
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
  }

  /* ---------- POST ---------- */
  if ($m === 'POST') {
    if (crm_token() !== $SECRET) { crm_audit('reject', 'bad token'); crm_out(array('ok'=>false), 403); }

    list($dir, $mode) = crm_storage_dir();
    if ($dir === false) crm_out(array('ok'=>false, 'err'=>'storage-not-writable'), 500);
    crm_boot_meta();

    $raw = crm_raw_input();
    if (strlen($raw) > 64 * 1024 * 1024) crm_out(array('ok'=>false, 'err'=>'too-large'), 413);
    $b = json_decode($raw, true);
    if (!is_array($b)) crm_out(array('ok'=>false, 'err'=>'bad-json'), 400);

    /* استرجاع نسخة احتياطية (أداة إدارية) */
    if (isset($b['action']) && $b['action'] === 'restore') {
      $file = isset($b['file']) ? basename((string)$b['file']) : '';
      if (!preg_match('/^[A-Za-z0-9._-]+\.json$/', $file)) crm_out(array('ok'=>false, 'err'=>'bad-file'), 400);
      $src = crm_backups_dir() . '/' . $file;
      if (!file_exists($src)) crm_out(array('ok'=>false, 'err'=>'not-found'), 404);
      $jj = crm_valid_data_str((string)file_get_contents($src));
      if ($jj === false) crm_out(array('ok'=>false, 'err'=>'backup-invalid'), 500);

      $lock = crm_lock();
      crm_backup_current('pre-restore');
      // رفع t لكل المفاتيح إلى "الآن" حتى تتبناها كل الأجهزة فأقرب poll
      $nowRestore = crm_now_ms();
      foreach ($jj as $rk => $rv) {
        if (is_array($rv) && isset($rv['t'])) $jj[$rk]['t'] = max($nowRestore, (int)$rv['t']);
      }
      crm_atomic_write(crm_data_path(), json_encode($jj, JSON_UNESCAPED_UNICODE));
      $meta = crm_read_meta();
      $meta['counts']['restore']++;
      crm_write_meta($meta);
      crm_audit('restore', 'restored ' . $file);
      crm_unlock($lock);
      crm_out(array('ok'=>true, 'restored'=>$file));
    }

    if (!isset($b['key']) || !isset($b['t']) || !isset($b['d'])) {
      crm_out(array('ok'=>false, 'err'=>'bad-body'), 400);
    }
    $k = (string)$b['key'];
    if (!in_array($k, $KEYS, true)) {
      crm_audit('reject', 'unknown key ' . $k);
      crm_out(array('ok'=>false, 'err'=>'bad-key'), 403);
    }
    $tIn = (int)$b['t'];
    $dIn = $b['d'];

    $lock = crm_lock();
    $data = crm_read_data(true, true); // داخل القفل + استرجاع تلقائي إن لزم
    $meta = crm_read_meta();

    // مسح تلقائي لبيانات الديمو (مرة واحدة) — إلا كانت مطابقة تماماً للـ seed
    if (empty($meta['demo_wipe_done'])) {
      $wr = crm_maybe_wipe_demo($data);
      if ($wr === 'wipe') {
        crm_atomic_write(crm_data_path(), json_encode($data, JSON_UNESCAPED_UNICODE));
        crm_audit('demo_autowipe', '(post) exact factory demo orders replaced with an empty list');
        $meta['demo_wipe_done'] = 1;
      } elseif ($wr === 'checked') {
        $meta['demo_wipe_done'] = 1;
      }
      // 'none': لا علم بعد — أول فحص حقيقي يبقى قادماً
    }

    $nowMs = crm_now_ms();
    $t = min($tIn, $nowMs + CRM_FUTURE_MS); // تثبيت ساعة الجهاز

    $oldEntry = (isset($data[$k]) && is_array($data[$k])) ? $data[$k] : null;
    $oldD   = $oldEntry ? (isset($oldEntry['d']) ? $oldEntry['d'] : null) : null;
    $oldT   = $oldEntry ? (int)(isset($oldEntry['t']) ? $oldEntry['t'] : 0) : 0;
    $oldH   = ($oldD !== null) ? crm_canon_hash($oldD) : null;
    $newH   = crm_canon_hash($dIn);

    /* 1) لا تغيير فعلي → نجاح صامت */
    if ($oldH !== null && $oldH === $newH) {
      $meta['counts']['noop']++;
      crm_write_meta($meta);
      crm_unlock($lock);
      crm_out(array('ok'=>true, 'noop'=>true));
    }

    /* 2) حارس بيانات المصنع: إرجاع الـ seed الافتراضي فوق بيانات موجودة → رفض */
    if ($oldD !== null && isset($GLOBALS['CRM_SEED_HASHES'][$k]) && in_array($newH, $GLOBALS['CRM_SEED_HASHES'][$k], true)) {
      $meta['counts']['ghost_seed']++;
      crm_write_meta($meta);
      crm_audit('ghost_seed', $k . ' | factory seed pushed over existing data | ua=' . crm_ua());
      crm_unlock($lock);
      // HTTP 200 + ok:false كيمنع إعادة المحاولة اللانهائية من الواجهة
      crm_out(array('ok'=>false, 'rejected'=>'ghost_seed'));
    }

    /* 3) حارس الأشباح العام: نسخة قديمة "مطابقة" عادت بعد مهلة السماح → رفض */
    $hist = array();
    if (isset($meta['keys'][$k]['hist']) && is_array($meta['keys'][$k]['hist'])) $hist = $meta['keys'][$k]['hist'];
    foreach ($hist as $i => $e) {
      if (isset($e['h']) && $e['h'] === $newH) {
        $seen = isset($e['seen']) ? (int)$e['seen'] : 0;
        if ((time() - $seen) > CRM_GHOST_GRACE) {
          $meta['counts']['ghost']++;
          crm_write_meta($meta);
          crm_audit('ghost', $k . ' | old identical version pushed after ' . round((time()-$seen)/60) . ' min | ua=' . crm_ua());
          crm_unlock($lock);
          crm_out(array('ok'=>false, 'rejected'=>'ghost'));
        }
        // ضمن مهلة السماح → إزالة من السجل وسيمرّ
        unset($hist[$i]);
        break;
      }
    }

    /* 4) كتابة قديمة زمنياً (ساعة خاطئة جداً) → تجاهُل بدون فشل */
    if ($oldEntry !== null && $t < $oldT) {
      $meta['counts']['stale']++;
      crm_write_meta($meta);
      crm_audit('stale', $k . ' | t=' . $tIn . ' < stored ' . $oldT);
      crm_unlock($lock);
      crm_out(array('ok'=>true, 'stale'=>true));
    }

    /* 5) احتياط ثم كتابة ذرّية */
    if ($oldEntry !== null) crm_backup_current('write');
    $data[$k] = array('t' => $t, 'd' => $dIn);
    $payload = count($data) === 0 ? '{}' : json_encode($data, JSON_UNESCAPED_UNICODE);
    if (crm_atomic_write(crm_data_path(), $payload) === false) {
      crm_audit('error', 'write failed for ' . $k);
      crm_unlock($lock);
      crm_out(array('ok'=>false, 'err'=>'write'), 500);
    }

    /* تحديث سجل البصمات: النسخة القديمة تصبح "معروفة" لرفض عودتها لاحقاً */
    if ($oldH !== null && $oldH !== $newH) {
      $hist = array_values(array_filter($hist, function($e) use ($oldH) { return !isset($e['h']) || $e['h'] !== $oldH; }));
      $hist[] = array('h'=>$oldH, 't'=>$oldT, 'seen'=>time());
      if (count($hist) > CRM_HIST_PER_KEY) $hist = array_slice($hist, -CRM_HIST_PER_KEY);
    }
    $mk = $meta['keys']; if (!is_array($mk)) $mk = array();
    $mk[$k] = array('hist'=>array_values($hist));
    $meta['keys'] = $mk;
    $meta['counts']['write']++;
    $meta['last_write'] = time();
    $meta['last_write_ip'] = crm_ip();
    crm_write_meta($meta);

    crm_audit('write', $k . ' | t=' . $t . ' | bytes=' . strlen($payload));
    crm_unlock($lock);
    crm_out(array('ok'=>true));
  }

  http_response_code(405);
  echo '{"ok":false}';
  exit;

} catch (Throwable $e) {
  @crm_audit('exception', substr($e->getMessage(), 0, 200));
  http_response_code(500);
  echo '{"ok":false,"err":"exception"}';
  exit;
}

/* تهيئة meta عند أول تشغيل (install_id ثابت — إذا تغيّر فهذا يعني مسح التخزين!) */
function crm_boot_meta() {
  $p = crm_meta_path();
  if ($p === false) return;
  if (!file_exists($p)) {
    $m = crm_fresh_meta();
    crm_atomic_write($p, json_encode($m, JSON_UNESCAPED_UNICODE));
    crm_audit('install', 'storage initialized');
  }
}
