export const categories = {
  writing: { label: 'كتابة ومحتوى', icon: '✍️', slug: 'writing' },
  design: { label: 'صور وتصميم', icon: '🎨', slug: 'design' },
  'video-audio': { label: 'فيديو وصوت', icon: '🎬', slug: 'video-audio' },
  coding: { label: 'برمجة', icon: '💻', slug: 'coding' },
  productivity: { label: 'إنتاجية وأعمال', icon: '⚡', slug: 'productivity' },
  marketing: { label: 'تسويق وسيو', icon: '📈', slug: 'marketing' },
  research: { label: 'تعليم وبحث', icon: '📚', slug: 'research' },
} as const;

export const pricingLabels = {
  free: 'مجاني',
  paid: 'مدفوع',
  freemium: 'مجاني + مدفوع',
} as const;

export type CategoryKey = keyof typeof categories;
