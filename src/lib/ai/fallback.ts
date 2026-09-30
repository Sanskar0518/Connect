export function withFallback<T>(
  action: () => Promise<T>,
  fallbackGenerator?: () => T
): Promise<{ data: T; isFallback: boolean }> {
  return action()
    .then((data) => ({ data, isFallback: false }))
    .catch((err) => {
      console.warn("AI generation failed or unavailable, checking fallback:", err?.message || err);
      if (fallbackGenerator) {
        return { data: fallbackGenerator(), isFallback: true };
      }
      throw err;
    });
}
