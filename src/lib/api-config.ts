/**
 * Utility to get the API base URL for the recommendation service.
 * Handles client-side relative proxy path to avoid build-time inlining and CORS issues.
 */
export function getRecommendationApiBase(): string {
  if (typeof window !== "undefined") {
    // Client-side: use the Next.js rewrite proxy route
    return "/api/recommendation-proxy";
  }
  // Server-side: use the direct environment variable or fallback
  return process.env.NEXT_PUBLIC_RECOMMENDATION_API_URL || 
         process.env.RECOMMENDATION_API_URL || 
         "http://localhost:8000";
}
