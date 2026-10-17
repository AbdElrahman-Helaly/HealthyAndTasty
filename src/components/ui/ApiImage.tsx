import { useState, type ImgHTMLAttributes } from 'react';
import { ImageOff } from 'lucide-react';
import { env } from '@/config/env';
import { cn } from '@/lib/utils';

export function resolveImageUrl(value?: string | null): string {
  const path = value?.trim().replace(/\\/g, '/') ?? '';
  if (!path || ['string', 'null', 'undefined'].includes(path.toLowerCase())) return '';
  if (/^(https?:\/\/|blob:|data:image\/)/i.test(path)) return path;
  if (path.startsWith('//')) return `${window.location.protocol}${path}`;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return '';
  try {
    const base = new URL(env.apiBaseUrl || '/', window.location.origin);
    return new URL(path.replace(/^\.?\//, ''), `${base.origin}/`).href;
  } catch {
    return '';
  }
}

export function ApiImage({ src, alt, className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const resolved = resolveImageUrl(src);
  const [failed, setFailed] = useState<string | null>(null);
  if (!resolved || failed === resolved) {
    return <span role="img" aria-label={alt ? `الصورة غير متاحة: ${alt}` : 'الصورة غير متاحة'} title="الصورة غير متاحة" className={cn('inline-flex shrink-0 items-center justify-center bg-gray-100 text-gray-400', className)}><ImageOff className="h-5 w-5" /></span>;
  }
  return <img {...props} src={resolved} alt={alt ?? ''} className={className} onError={() => setFailed(resolved)} />;
}
