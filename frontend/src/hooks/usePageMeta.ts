import { useEffect } from 'react';

export interface PageMetaOptions {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

function upsertMetaTag(selector: string, attribute: 'name' | 'property', value: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function usePageMeta(options: PageMetaOptions) {
  useEffect(() => {
    document.title = options.title;

    upsertMetaTag('meta[name="description"]', 'name', 'description', options.description);

    upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', options.ogTitle ?? options.title);
    upsertMetaTag(
      'meta[property="og:description"]',
      'property',
      'og:description',
      options.ogDescription ?? options.description,
    );

    upsertMetaTag(
      'meta[name="twitter:title"]',
      'name',
      'twitter:title',
      options.twitterTitle ?? options.ogTitle ?? options.title,
    );
    upsertMetaTag(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      options.twitterDescription ?? options.ogDescription ?? options.description,
    );
  }, [options]);
}
