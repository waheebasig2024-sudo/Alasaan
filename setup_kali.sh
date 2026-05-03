#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# setup_kali.sh — تثبيت وتشغيل Aiden على Termux/Kali
# انسخ هذا الملف بالكامل والصقه في Termux خطوة بخطوة
# ============================================================

set -e

echo "════════════════════════════════════════"
echo "  تثبيت Aiden على Kali/Termux"
echo "════════════════════════════════════════"

# ── الخطوة 1: تحديث الحزم ────────────────────────────────
echo ""
echo "▶ الخطوة 1: تحديث الحزم..."
pkg update -y && pkg upgrade -y

# ── الخطوة 2: تثبيت Node.js ──────────────────────────────
echo ""
echo "▶ الخطوة 2: تثبيت Node.js..."
pkg install -y nodejs

# تحقق من الإصدار
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# ── الخطوة 3: تثبيت الأدوات المساعدة ────────────────────
echo ""
echo "▶ الخطوة 3: تثبيت الأدوات..."
pkg install -y git curl unzip

# ── الخطوة 4: إعداد مجلد Aiden ───────────────────────────
echo ""
echo "▶ الخطوة 4: إعداد مجلد Aiden..."
cd ~

# إذا كان aiden.zip موجوداً
if [ -f "aiden.zip" ]; then
  echo "  ← وُجد aiden.zip، جاري الفك..."
  unzip -o aiden.zip -d aiden_setup
  cd aiden_setup/aiden-main
elif [ -d "aiden_project" ]; then
  echo "  ← وُجد aiden_project، جاري الدخول..."
  cd aiden_project
else
  echo "  ← لم يُوجد Aiden، جاري التنزيل من GitHub..."
  git clone https://github.com/Shiva-Deore/aiden.git aiden_project
  cd aiden_project
fi

echo "  📂 المجلد الحالي: $(pwd)"

# ── الخطوة 5: إنشاء ملف .env ─────────────────────────────
echo ""
echo "▶ الخطوة 5: إعداد ملف البيئة..."
if [ ! -f ".env" ]; then
  cat > .env << 'EOF'
# Aiden Environment - Kali/Termux
AIDEN_PORT=4200
AIDEN_HOST=127.0.0.1
AIDEN_CORS_ORIGIN=*

# مفاتيح API (اختياري - Aiden يعمل بدونها مع Ollama)
# OPENAI_API_KEY=your_key
# ANTHROPIC_API_KEY=your_key
# GROQ_API_KEY=your_key
EOF
  echo "  ✅ تم إنشاء .env"
else
  echo "  ✅ .env موجود مسبقاً"
fi

# ── الخطوة 6: تثبيت المكتبات ─────────────────────────────
echo ""
echo "▶ الخطوة 6: تثبيت المكتبات (قد يستغرق دقائق)..."
npm install --prefer-offline 2>/dev/null || npm install

echo "  ✅ تم تثبيت المكتبات"

# ── الخطوة 7: بناء المشروع (إذا لزم) ────────────────────
echo ""
echo "▶ الخطوة 7: بناء المشروع..."
if [ -f "package.json" ]; then
  # تحقق من وجود سكربت build:api
  if npm run | grep -q "build:api"; then
    npm run build:api
    echo "  ✅ تم البناء"
  elif npm run | grep -q "build"; then
    npm run build 2>/dev/null || echo "  ⚠ Build اختياري"
  fi
fi

# ── الخطوة 8: معرفة عنوان IP ────────────────────────────
echo ""
echo "▶ الخطوة 8: عنوان IP الخاص بك..."
echo "  ← العنوان المحلي (للاتصال من التطبيق):"
ip addr show 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print "    " $2}' || \
  ifconfig 2>/dev/null | grep "inet " | grep -v "127.0.0.1" | awk '{print "    " $2}'
echo ""
echo "  💡 في تطبيق الحسن استخدم: http://127.0.0.1:4200"
echo "     (لأن التطبيق وKali على نفس الجهاز)"

# ── الخطوة 9: تشغيل Aiden ────────────────────────────────
echo ""
echo "════════════════════════════════════════"
echo "  ✅ الإعداد اكتمل! جاري تشغيل Aiden..."
echo "  السيرفر سيعمل على: http://127.0.0.1:4200"
echo "  لإيقافه اضغط: Ctrl+C"
echo "════════════════════════════════════════"
echo ""

# محاولة تشغيل Aiden بعدة طرق
if [ -f "dist-bundle/index.js" ]; then
  echo "▶ تشغيل من dist-bundle..."
  AIDEN_PORT=4200 node dist-bundle/index.js
elif npm run 2>/dev/null | grep -q "api$"; then
  echo "▶ تشغيل عبر: npm run api"
  npm run api
elif npm run 2>/dev/null | grep -q "start"; then
  echo "▶ تشغيل عبر: npm start"
  AIDEN_PORT=4200 npm start
else
  echo "▶ تشغيل مباشر..."
  AIDEN_PORT=4200 node api/entry.js 2>/dev/null || \
  AIDEN_PORT=4200 npx ts-node api/entry.ts
fi
