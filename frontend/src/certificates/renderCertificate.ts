import type { OverlayConfig } from './types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the certificate template'));
    img.src = src;
  });
}

export async function renderCertificate(
  templateUrl: string,
  name: string,
  overlay: OverlayConfig,
): Promise<HTMLCanvasElement> {
  const img = await loadImage(templateUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create a drawing context');

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const maxWidth = canvas.width * 0.72;
  let fontSize = (overlay.fontSizePercent / 100) * canvas.width;
  const family = overlay.fontFamily || 'Georgia, serif';
  const weight = overlay.fontWeight || '700';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = overlay.color || '#1b365d';

  do {
    ctx.font = `${weight} ${fontSize}px ${family}`;
    fontSize -= 1;
  } while (ctx.measureText(name).width > maxWidth && fontSize > 16);

  const x = (overlay.xPercent / 100) * canvas.width;
  const y = (overlay.yPercent / 100) * canvas.height;
  ctx.fillText(name, x, y);
  return canvas;
}

export async function downloadCertificate(
  templateUrl: string,
  name: string,
  overlay: OverlayConfig,
  fileName: string,
): Promise<void> {
  const canvas = await renderCertificate(templateUrl, name, overlay);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png'),
  );
  if (!blob) throw new Error('Could not export the certificate image');

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
}
