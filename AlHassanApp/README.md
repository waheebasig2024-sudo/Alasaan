# الحسن

تطبيق Android Native-first مبني بـ React Native وExpo وTypeScript وExpo Router.

## مسار القرار

1. Tools First
2. Memory Second
3. Gemini Third
4. No Hallucination on failure

## التشغيل

التطبيق لا يعتمد داخل الهاتف على localhost أو WebView أو Termux. يستخدم التطبيق أدوات Expo/Android مباشرة قدر الإمكان، ويستخدم وسيط API فقط لطلب Gemini بشكل آمن عبر `GEMINI_API_KEY`.