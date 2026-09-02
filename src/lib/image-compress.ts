"use client";

/**
 * Ridimensiona/comprime un'immagine nel browser prima dell'upload, per stare sotto i limiti
 * di dimensione delle richieste al server (le foto da fotocamera possono essere 3-10MB).
 * Se il file non è un'immagine comprimibile (es. PDF, o un formato non decodificabile
 * come alcuni HEIC), restituisce il file originale invariato.
 */
export async function compressImageFile(
  file: File,
  opts?: { maxDimension?: number; quality?: number; skipIfUnder?: number }
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const maxDimension = opts?.maxDimension ?? 1600;
  const quality = opts?.quality ?? 0.82;
  const skipIfUnder = opts?.skipIfUnder ?? 1.2 * 1024 * 1024;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    if (width <= maxDimension && height <= maxDimension && file.size <= skipIfUnder) {
      bitmap.close?.();
      return file;
    }

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    // Formato non decodificabile dal browser (es. alcuni HEIC su Chrome/Firefox): usa il file originale.
    return file;
  }
}
