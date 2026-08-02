# OMXHub

دليل عربي لأدوات الذكاء الاصطناعي — مبني بـ [Astro](https://astro.build).

## التشغيل محليًا

```bash
npm install
npm run dev      # يفتح على http://localhost:4321
npm run build    # يبني نسخة الإنتاج في مجلد dist/
```

## إضافة أداة جديدة

أنشئ ملف Markdown جديد داخل `src/content/tools/` (مثلاً `midjourney.md`) بنفس تنسيق `chatgpt.md`، واملأ الحقول المطلوبة (الاسم، التصنيف، الأسعار، المميزات...). الصفحة تُبنى تلقائيًا على الرابط `/ai-tools/اسم-الملف`.

## رفع المشروع على GitHub

```bash
git init
git add .
git commit -m "أول نسخة من موقع OMXHub"
git branch -M main
git remote add origin https://github.com/USERNAME/omxhub.git
git push -u origin main
```
(غيّر `USERNAME` باسم حسابك على GitHub، وسوي ريبو فاضي بنفس الاسم "omxhub" قبل).

## ربط الموقع بـ Netlify

1. ادخل على app.netlify.com → **Add new site → Import an existing project**
2. اختر **GitHub** واختر ريبو `omxhub`
3. الإعدادات تنعبي تلقائيًا من `netlify.toml` (build command: `npm run build`, publish: `dist`)
4. اضغط **Deploy**
5. من **Site settings → Domain management** اربط دومين `omxhub.com` المسجل عندك

بعدها، أي `git push` جديد = نشر تلقائي على Netlify خلال ثواني.
