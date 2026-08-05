export const categories = {
  writing: { icon: '✍️', ar: 'كتابة ومحتوى', en: 'Writing & Content' },
  design: { icon: '🎨', ar: 'صور وتصميم', en: 'Design & Images' },
  'video-audio': { icon: '🎬', ar: 'فيديو وصوت', en: 'Video & Audio' },
  coding: { icon: '💻', ar: 'برمجة', en: 'Coding' },
  productivity: { icon: '⚡', ar: 'إنتاجية وأعمال', en: 'Productivity' },
  marketing: { icon: '📈', ar: 'تسويق وسيو', en: 'Marketing & SEO' },
  research: { icon: '📚', ar: 'تعليم وبحث', en: 'Research & Learning' },
} as const;

/**
 * SEO copy for each category landing page (`/ai-tools/category/<slug>`).
 * `h1` targets the search phrase people actually type; `intro` is unique
 * editorial copy so the page is never thin content.
 */
export const categoryMeta = {
  writing: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للكتابة والمحتوى',
      description:
        'أدوات ذكاء اصطناعي للكتابة وصناعة المحتوى: مقارنة المميزات والعيوب والأسعار، وأيها يكتب عربي بشكل طبيعي فعلًا.',
      intro:
        'أدوات الكتابة بالذكاء الاصطناعي تختلف كثيرًا عن بعضها، خصوصًا مع اللغة العربية. بعضها ممتاز بالمقالات الطويلة، وبعضها أفضل بالردود السريعة أو إعادة الصياغة. هنا تلقى كل أداة مشروحة بصراحة: وش تتقنه، ووين تضعف، وكم تكلف فعليًا.',
    },
    en: {
      h1: 'Best AI Tools for Writing & Content',
      description:
        'AI writing and content tools compared: real strengths, weaknesses, and pricing — so you pick the one that fits how you actually write.',
      intro:
        'AI writing tools differ a lot in practice. Some are strong at long-form articles, others at quick replies, rewriting, or tone control. Each tool here is reviewed honestly: what it does well, where it falls short, and what it really costs.',
    },
  },
  design: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للتصميم وتوليد الصور',
      description:
        'أدوات توليد وتحرير الصور بالذكاء الاصطناعي: جودة المخرجات، سهولة الاستخدام، الأسعار، وحقوق استخدام الصور.',
      intro:
        'توليد الصور بالذكاء الاصطناعي صار متاحًا للجميع، لكن الفرق بين الأدوات كبير: جودة التفاصيل، التحكم بالنتيجة، ووضوح حقوق الاستخدام التجاري. راجعنا كل أداة من هالزوايا الثلاث.',
    },
    en: {
      h1: 'Best AI Tools for Design & Image Generation',
      description:
        'AI image generation and design tools compared: output quality, control, pricing, and commercial usage rights.',
      intro:
        'AI image tools have become accessible to everyone, but they differ sharply in detail quality, how much control you get over the result, and how clear their commercial usage rights are. Each tool here is reviewed on all three.',
    },
  },
  'video-audio': {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للفيديو والصوت',
      description:
        'أدوات توليد وتحرير الفيديو والصوت بالذكاء الاصطناعي: جودة الأصوات العربية، مدة المعالجة، والأسعار.',
      intro:
        'أدوات الفيديو والصوت بالذكاء الاصطناعي من أسرع الفئات تطورًا. المهم عمليًا: هل تدعم العربية بصوت طبيعي؟ كم تاخذ وقت للمعالجة؟ وهل الخطة المجانية تكفي لتجربة حقيقية؟ هذي الأسئلة اللي نجاوب عليها بكل مراجعة.',
    },
    en: {
      h1: 'Best AI Tools for Video & Audio',
      description:
        'AI video and audio tools compared: voice quality, language support, processing time, and pricing.',
      intro:
        'AI video and audio tools are moving faster than any other category. What matters in practice: does the voice sound natural, how long does processing take, and is the free tier enough for a real test? Every review answers those.',
    },
  },
  coding: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للبرمجة',
      description:
        'مساعدات البرمجة بالذكاء الاصطناعي: جودة الكود، دعم اللغات والأطر، التكامل مع المحررات، والأسعار.',
      intro:
        'مساعد البرمجة الجيد يفرق بجودة الكود المقترح، وفهمه لسياق مشروعك كامل مو بس الملف المفتوح. نقارن الأدوات من ناحية دقة الاقتراحات، اللغات المدعومة، والتكامل مع محررك.',
    },
    en: {
      h1: 'Best AI Coding Tools',
      description:
        'AI coding assistants compared: code quality, language and framework support, editor integration, and pricing.',
      intro:
        'A good coding assistant is defined by the quality of what it suggests and whether it understands your whole project, not just the open file. We compare suggestion accuracy, language support, and editor integration.',
    },
  },
  productivity: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للإنتاجية والأعمال',
      description:
        'أدوات ذكاء اصطناعي للإنتاجية وتنظيم العمل: تلخيص الاجتماعات، إدارة المهام، والتكامل مع أدواتك الحالية.',
      intro:
        'أدوات الإنتاجية تنفع فعليًا لما تندمج مع اللي تستخدمه أصلًا — بريدك، ملفاتك، وتقويمك. نركز بمراجعاتنا على عمق التكامل، مو بس قائمة المميزات.',
    },
    en: {
      h1: 'Best AI Tools for Productivity & Business',
      description:
        'AI productivity tools compared: meeting summaries, task management, and how deeply they integrate with the tools you already use.',
      intro:
        'Productivity tools only pay off when they plug into what you already use — your email, files, and calendar. These reviews focus on depth of integration, not just feature lists.',
    },
  },
  marketing: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للتسويق والسيو',
      description:
        'أدوات ذكاء اصطناعي للتسويق وتحسين محركات البحث: بحث الكلمات المفتاحية، كتابة الإعلانات، وتحليل المنافسين.',
      intro:
        'أدوات التسويق بالذكاء الاصطناعي مفيدة بالبحث وتوليد الأفكار، لكن جودة بياناتها للسوق العربي تتفاوت بشكل كبير. نوضح بكل مراجعة وين الأداة موثوقة ووين تحتاج مراجعة بشرية.',
    },
    en: {
      h1: 'Best AI Tools for Marketing & SEO',
      description:
        'AI marketing and SEO tools compared: keyword research, ad copy, competitor analysis, and data reliability.',
      intro:
        'AI marketing tools are useful for research and idea generation, but their data quality varies widely by market and language. Each review flags where a tool is reliable and where it still needs a human check.',
    },
  },
  research: {
    ar: {
      h1: 'أفضل أدوات الذكاء الاصطناعي للبحث والتعليم',
      description:
        'أدوات ذكاء اصطناعي للبحث والدراسة: دقة المصادر، تلخيص الأوراق العلمية، ودعم اللغة العربية.',
      intro:
        'بالبحث والدراسة، أهم شي هو المصادر: هل الأداة تعطيك روابط تقدر تتحقق منها بنفسك؟ نقيّم كل أداة على دقة مصادرها وقدرتها على التعامل مع نصوص طويلة وبالعربية.',
    },
    en: {
      h1: 'Best AI Tools for Research & Learning',
      description:
        'AI research and study tools compared: source accuracy, paper summarisation, and long-document handling.',
      intro:
        'For research, sources are everything: does the tool give you links you can actually verify? Each tool is judged on citation accuracy and how well it handles long documents.',
    },
  },
} as const;

export const pricingLabels = {
  free: { ar: 'مجاني', en: 'Free' },
  paid: { ar: 'مدفوع', en: 'Paid' },
  freemium: { ar: 'مجاني + مدفوع', en: 'Freemium' },
} as const;

export type CategoryKey = keyof typeof categories;
export type PricingKey = keyof typeof pricingLabels;
