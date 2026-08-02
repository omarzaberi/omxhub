export const categories = {
  writing: { icon: '✍️', ar: 'كتابة ومحتوى', en: 'Writing & Content' },
  design: { icon: '🎨', ar: 'صور وتصميم', en: 'Design & Images' },
  'video-audio': { icon: '🎬', ar: 'فيديو وصوت', en: 'Video & Audio' },
  coding: { icon: '💻', ar: 'برمجة', en: 'Coding' },
  productivity: { icon: '⚡', ar: 'إنتاجية وأعمال', en: 'Productivity' },
  marketing: { icon: '📈', ar: 'تسويق وسيو', en: 'Marketing & SEO' },
  research: { icon: '📚', ar: 'تعليم وبحث', en: 'Research & Learning' },
} as const;

export const pricingLabels = {
  free: { ar: 'مجاني', en: 'Free' },
  paid: { ar: 'مدفوع', en: 'Paid' },
  freemium: { ar: 'مجاني + مدفوع', en: 'Freemium' },
} as const;

export type CategoryKey = keyof typeof categories;
export type PricingKey = keyof typeof pricingLabels;
