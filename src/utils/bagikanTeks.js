export async function bagikanTeks(teks) {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: teks });
      return 'dibagikan';
    } catch (error) {
      if (error.name === 'AbortError') return 'dibatalkan';
      throw error;
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(teks);
    return 'disalin';
  }

  throw new Error('Browser ini tidak mendukung Web Share atau clipboard.');
}
