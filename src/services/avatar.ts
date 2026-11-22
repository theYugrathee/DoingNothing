/**
 * Auto-fetch product logo, social media profile picture, or high-res favicon from URL
 */

export function resolveAvatarUrl(rawUrl: string, uploadedImg?: string): string {
  if (uploadedImg && uploadedImg.trim().length > 0) {
    return uploadedImg;
  }

  const url = (rawUrl || '').trim();
  if (!url) return '';

  try {
    // 1. Social handle shorthand (e.g. @username or twitter.com/username)
    if (url.startsWith('@')) {
      const handle = url.slice(1);
      return `https://unavatar.io/x/${handle}`;
    }

    const parsed = new URL(/^https?:/i.test(url) ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // GitHub profile or repo
    if (host === 'github.com' && pathParts[0]) {
      return `https://unavatar.io/github/${pathParts[0]}`;
    }

    // X / Twitter profile
    if ((host === 'x.com' || host === 'twitter.com') && pathParts[0]) {
      return `https://unavatar.io/x/${pathParts[0]}`;
    }

    // YouTube channel
    if ((host === 'youtube.com' || host === 'youtu.be') && pathParts[0]) {
      const channel = pathParts[0].replace(/^@/, '');
      return `https://unavatar.io/youtube/${channel}`;
    }

    // Generic Website: unavatar with fallback to Google high-res 128px favicon
    return `https://unavatar.io/${host}?fallback=https://www.google.com/s2/favicons?domain=${host}&sz=128`;
  } catch {
    return '';
  }
}
