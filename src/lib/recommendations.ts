/**
 * Kairo — Server-side recommendations sync utility.
 *
 * Coordinates embedding synchronization between Kairo scrapers and
 * the FastAPI recommendation engine.
 */

export async function triggerEmbeddingsSync(): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
  
  console.log(`Triggering embeddings sync on: ${apiBase}/embeddings/sync`);
  
  try {
    const res = await fetch(`${apiBase}/embeddings/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Embeddings sync completed successfully:", data);
      return true;
    } else {
      const errorText = await res.text();
      console.error(`Failed to execute embeddings sync: Status ${res.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error("Error connecting to recommendation service for embeddings sync:", error);
    return false;
  }
}

export async function triggerRecommendationRefresh(): Promise<boolean> {
  const apiBase = process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || "http://localhost:8000";
  console.log("Triggering post-sync recommendation reload and embeddings refresh...");
  
  // 1. Refresh Embeddings
  const embeddingsSuccess = await triggerEmbeddingsSync();
  
  // 2. Invalidate all user profile caches
  try {
    const res = await fetch(`${apiBase}/recommendations/invalidate-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      console.log("Recommendation user cache invalidated successfully.");
    } else {
      console.warn(`Failed to invalidate all caches: Status ${res.status}`);
      // Fallback: try GET/POST /recommendations/invalidate without userId to see if it clears all
      await fetch(`${apiBase}/recommendations/invalidate`, { method: "POST" }).catch(() => {});
    }
  } catch (err) {
    console.error("Error invalidating recommendation cache:", err);
  }
  
  return embeddingsSuccess;
}
