# 📊 ربط OMXHub بـ Google Search Console

> دليل خطوة بخطوة. المطلوب منك: حساب قوقل + دخول لوحة Netlify.
> الوقت المتوقع: 10 دقائق شغل + من يوم لأسبوعين حتى تبدأ الفهرسة.

---

## قبل ما تبدأ — الوضع الحالي

| العنصر | الحالة |
|---|---|
| الدومين | `omxhub.com` |
| الـDNS | Netlify DNS (النيم سيرفرز من Spaceship تشير لـNetlify) |
| الـsitemap | `https://omxhub.com/sitemap-index.xml` — شغال، 80 رابط |
| robots.txt | `https://omxhub.com/robots.txt` — يسمح للكل ويشير للـsitemap |
| Google Analytics | مركّب على كل الصفحات (`G-W8MG2DBF3F`) |

---

## الخطوة 1 — إضافة الموقع كـ Domain property

افتح <https://search.google.com/search-console> وسجّل دخول بحساب قوقل.

بتظهر لك شاشة فيها خيارين:

| النوع | متى تختاره |
|---|---|
| **Domain** ← **اختر هذا** | يغطي `omxhub.com` و`www` و`http` و`https` وكل الساب دومينات بخاصية واحدة. أنظف وأشمل. |
| URL prefix | يغطي بروتوكول واحد بس. تحتاج خاصية منفصلة لكل صيغة. |

بخانة **Domain** اكتب:

```
omxhub.com
```

⚠️ بدون `https://` وبدون `www` — الدومين المجرد فقط.

اضغط **Continue**.

---

## الخطوة 2 — التحقق من الملكية (DNS TXT)

خيار **Domain** يتطلب التحقق عبر DNS. قوقل بيعطيك سجل TXT شكله كذا:

```
google-site-verification=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**انسخه**، ولا تسكّر النافذة.

### إضافة السجل في Netlify

1. افتح <https://app.netlify.com> → اختر مشروع OMXHub
2. **Domains** (أو Domain management) → اضغط على `omxhub.com`
3. اختر **DNS panel** / **Go to DNS panel**
4. اضغط **Add new record** وعبّي:

| الحقل | القيمة |
|---|---|
| Record type | `TXT` |
| Name / Host | اتركه **فاضي** (أو `@` لو أجبرك) |
| Value | النص اللي نسخته من قوقل (`google-site-verification=...`) |
| TTL | اتركه الافتراضي |

5. **Save**

### رجوع لقوقل

انتظر من دقيقتين لـ10 دقائق، بعدين ارجع لنافذة Search Console واضغط **Verify**.

- ✅ نجح → تظهر رسالة "Ownership verified"
- ❌ فشل → انتظر 15–30 دقيقة كمان وحاول مرة ثانية. انتشار الـDNS ياخذ وقت.

> **مهم:** لا تحذف سجل الـTXT بعد التحقق. قوقل يعيد فحصه دوريًا، ولو انحذف تفقد التحقق.

### طريقة بديلة أسرع (لو حابب تتجنب DNS)

بما إن Google Analytics مركّب أصلاً بالموقع، تقدر تختار **URL prefix** بدل Domain وتحط:

```
https://omxhub.com
```

بعدين من قائمة طرق التحقق اختر **Google Analytics**. بيتحقق فورًا **بشرط** إن نفس حساب قوقل يملك خاصية GA4 (`G-W8MG2DBF3F`).

العيب: يغطي `https://omxhub.com` بس. لو تبي تغطية كاملة لازم تضيف خصائص إضافية يدويًا. **الأفضل تسوي Domain، والـGA كخطة ب.**

---

## الخطوة 3 — رفع الـ Sitemap

بعد التحقق:

1. من القائمة الجانبية اليسرى → **Sitemaps** (تحت قسم Indexing)
2. بخانة **Add a new sitemap** اكتب:

```
sitemap-index.xml
```

> الحقل يعرض `https://omxhub.com/` مسبقًا، فتكتب الجزء الباقي بس.

3. اضغط **Submit**

بعد دقايق (أحيانًا ساعات) الحالة تصير **Success** ويظهر عدد الروابط المكتشفة.

> ملاحظة: `sitemap-index.xml` هو ملف فهرس يشير لـ`sitemap-0.xml`.
> ترفع الفهرس بس — قوقل يوصل للباقي لحاله. **لا ترفع الاثنين.**

---

## الخطوة 4 — طلب فهرسة الصفحات المهمة يدويًا

الـsitemap يخلي قوقل يكتشف الصفحات، لكن الفهرسة الطبيعية تاخذ أسابيع لموقع جديد.
عشان تسرّع أهم الصفحات، استخدم **URL Inspection** (شريط البحث فوق).

الصق الرابط → انتظر الفحص → اضغط **Request Indexing**.

سوّها لهذي الصفحات بالترتيب:

```
https://omxhub.com/
https://omxhub.com/ai-tools
https://omxhub.com/pdf-tools
https://omxhub.com/pdf-tools/merge-pdf
https://omxhub.com/ai-tools/chatgpt
https://omxhub.com/ai-tools/category/writing
https://omxhub.com/prompts
https://omxhub.com/en
```

⚠️ في حد يومي على عدد الطلبات (حوالي 10). لو وصلت الحد، كمّل بكرة. لا تعيد طلب نفس الرابط كل يوم — ما يسرّع شي.

---

## الخطوة 5 — Bing Webmaster Tools (5 دقائق إضافية)

Bing يغذي محرك بحث Bing وDuckDuckGo وبحث ويندوز. مصدر ترافيك مجاني إضافي.

1. افتح <https://www.bing.com/webmasters>
2. سجّل دخول → **Import from Google Search Console** ← أسرع طريق، ينقل كل شي تلقائيًا
3. أو أضف الموقع يدويًا وارفع نفس الـsitemap

---

## بعد الرفع — وش تتابع؟

| التقرير | وش يقول لك | متى تشيكه |
|---|---|---|
| **Pages** (Indexing) | كم صفحة مفهرسة، وأسباب استبعاد الباقي | أسبوعيًا |
| **Sitemaps** | هل قوقل قرأ الـsitemap بنجاح | بعد الرفع بيومين |
| **Performance** | كلمات البحث اللي وصّلت زوار، الظهور، النقرات | أسبوعيًا بعد أول شهر |
| **Enhancements** | هل الـschema (Breadcrumbs) اتقرأ صح | بعد أسبوعين |

### توقعات واقعية للجدول الزمني

| المدة | المتوقع |
|---|---|
| 1–3 أيام | قوقل يقرأ الـsitemap |
| 1–2 أسبوع | أول صفحات تنفهرس (الرئيسية وأقوى الصفحات) |
| 3–6 أسابيع | معظم الـ80 صفحة مفهرسة |
| 2–4 أشهر | أول ترافيك بحث ملموس |

**الدومين الجديد يحتاج وقت.** الظهور بالبحث بأول شهر ضعيف جدًا وهذا طبيعي تمامًا، مو مؤشر على خطأ.

---

## أخطاء شائعة تتوقعها بتقرير Pages

| الرسالة | معناها | نسوي شي؟ |
|---|---|---|
| `Excluded by 'noindex' tag` | صفحات `tutorials` / `comparisons` / `ai-news` | ❌ لا — هذا مقصود |
| `Crawled - currently not indexed` | قوقل زار الصفحة وما قرر فهرستها بعد | ❌ انتظر، شائع جدًا للمواقع الجديدة |
| `Discovered - currently not indexed` | قوقل يعرف عنها بس ما زارها | ❌ انتظر |
| `Duplicate without user-selected canonical` | مشكلة canonical | ✅ راجعني — ما المفروض تظهر، الـcanonical مضبوط |
| `Page with redirect` | إعادة توجيه | ✅ راجعني |

---

## ✅ تشيك ليست

- [ ] أضفت Domain property باسم `omxhub.com`
- [ ] حطيت سجل TXT في Netlify DNS
- [ ] التحقق نجح (Ownership verified)
- [ ] رفعت `sitemap-index.xml` وحالته Success
- [ ] طلبت فهرسة أهم 8 صفحات
- [ ] أضفت الموقع في Bing Webmaster Tools
