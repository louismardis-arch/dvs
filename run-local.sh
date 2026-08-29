#!/usr/bin/env bash
# ============================================================
#  Paraveda CRM — تشغيل محلي (بيئة التطوير)
# ------------------------------------------------------------
#  هاد السكريبت كيثبّت PHP (عبر WebAssembly — ما محتاج حتى حاجة
#  فالنظام) وكيشغّل سيرفر محلي كيخدم بنفس طريقة الهوست ديالك.
#
#  الاستعمال:
#      ./run-local.sh            → يبدا على المنفذ 8080
#      ./run-local.sh 9000       → يبدا على منفذ آخر
# ------------------------------------------------------------
set -e
PORT="${1:-8080}"
DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_DIR="$HOME/.phpwasm-env"

echo "⚙️  كنجهزو بيئة PHP..."
if [ ! -x "$ENV_DIR/node_modules/.bin/php-wasm-cli" ]; then
  mkdir -p "$ENV_DIR"
  cd "$ENV_DIR"
  npm init -y >/dev/null 2>&1 || true
  npm install "@php-wasm/cli@3.1.51" 2>&1 | tail -3
fi

echo "🚀 كنديرو سيرفر على: http://localhost:$PORT"
echo "   (التطبيق: http://localhost:$PORT/  |  فحص الحالة: http://localhost:$PORT/api.php?action=status&token=c6e04cb5de9088be01a685abc243995a80426eba45de2060)"
exec "$ENV_DIR/node_modules/.bin/php-wasm-cli" \
  -d display_errors=0 \
  -d log_errors=1 \
  -d error_log="$DIR/php-errors.log" \
  -S "0.0.0.0:$PORT" -t "$DIR"
