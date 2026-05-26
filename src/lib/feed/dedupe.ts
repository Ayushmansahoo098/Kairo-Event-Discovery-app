import { Event } from "../types";

/**
 * Pure JavaScript SHA-256 implementation to safely execute
 * in both client browser bundles and Node.js environments.
 */
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;

  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let asciiBitCount = asciiLength * 8;
  words[asciiLength >> 2] |= 128 << (24 - (asciiLength % 4) * 8);
  words[(((asciiLength + 8) >> 6) << 4) + 15] = asciiBitCount;

  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  for (i = 0; i < words[lengthProperty]; i += 16) {
    const w = words.slice(i, i + 16);
    let oldHash = hash.slice(0);

    for (j = 0; j < 64; j++) {
      if (j >= 16) {
        w[j] = (
          (rightRotate(w[j - 2], 17) ^ rightRotate(w[j - 2], 19) ^ (w[j - 2] >>> 10)) +
          w[j - 7] +
          (rightRotate(w[j - 15], 7) ^ rightRotate(w[j - 15], 18) ^ (w[j - 15] >>> 3)) +
          w[j - 16]
        ) | 0;
      }

      const temp1 = (
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ((hash[4] & hash[5]) ^ (~hash[4] & hash[6])) +
        k[j] +
        (w[j] || 0)
      );
      
      const temp2 = (
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        ((hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]))
      );

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  let finalHex = '';
  for (i = 0; i < 8; i++) {
    const hex = (hash[i] >>> 0).toString(16);
    finalHex += hex.padStart(8, '0');
  }
  return finalHex;
}

/**
 * Standardizes source ranking weight to select highest-quality details version.
 */
export function getSourcePriority(source?: string): number {
  if (!source) return 0;
  const s = source.toLowerCase();
  if (s.includes("devfolio")) return 10;
  if (s.includes("unstop")) return 8;
  if (s.includes("hackerearth")) return 7;
  if (s.includes("eventbrite")) return 5;
  return 4;
}

/**
 * Strips URLs down to core path for robust comparison matching.
 */
function cleanUrl(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return (u.hostname + u.pathname).replace(/^www\./i, "").replace(/\/$/, "");
  } catch {
    return url.toLowerCase().replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
  }
}

/**
 * Generates tokens to compare title similarities.
 */
function cleanTitle(title: string): string[] {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
}

/**
 * Computes Jaccard index similarity over title tokens.
 */
function getTitleSimilarity(t1: string, t2: string): number {
  const tokens1 = cleanTitle(t1);
  const tokens2 = cleanTitle(t2);
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  
  return intersection.size / Math.max(set1.size, set2.size);
}

/**
 * Ingestion Deduplication Engine. Group and merges duplicate entries based on:
 * - Exact registration URLs
 * - Match stable IDs
 * - Date match AND fuzzy title overlaps (>= 70%)
 * Preserves the highest priority source, merges tags, and retains the earliest deadline.
 */
export function dedupeEvents(events: Event[]): Event[] {
  const deduped: Event[] = [];
  const visited = new Set<string>();

  for (let i = 0; i < events.length; i++) {
    const current = events[i];
    if (visited.has(current.id)) continue;

    // Build duplicates cluster
    const duplicates = [current];

    for (let j = i + 1; j < events.length; j++) {
      const candidate = events[j];
      if (visited.has(candidate.id)) continue;

      let isDuplicate = false;

      // Rule 1: Exact registration URL match
      if (
        current.registrationUrl && 
        candidate.registrationUrl && 
        cleanUrl(current.registrationUrl) === cleanUrl(candidate.registrationUrl)
      ) {
        isDuplicate = true;
      }
      
      // Rule 2: Title and Date fuzzy overlap match
      if (!isDuplicate && current.date && candidate.date && current.date === candidate.date) {
        if (getTitleSimilarity(current.title, candidate.title) >= 0.70) {
          isDuplicate = true;
        }
      }

      if (isDuplicate) {
        duplicates.push(candidate);
        visited.add(candidate.id);
      }
    }

    visited.add(current.id);

    if (duplicates.length === 1) {
      deduped.push(current);
    } else {
      // Sort cluster to select the highest-quality source
      duplicates.sort((a, b) => {
        const sourceA = (a as any).source || "";
        const sourceB = (b as any).source || "";
        return getSourcePriority(sourceB) - getSourcePriority(sourceA);
      });

      const base = duplicates[0];
      const otherDuplicates = duplicates.slice(1);

      // Merge tags intelligently
      const mergedTags = Array.from(new Set([
        ...(base.tags || []),
        ...otherDuplicates.flatMap((d) => d.tags || [])
      ])).map((t) => t.toLowerCase().trim()).filter(Boolean);

      // Preserve earliest registration date (deadline)
      const allDates = [base.date, ...otherDuplicates.map((d) => d.date)].filter(Boolean);
      const earliestDate = allDates.sort()[0] || base.date;

      // Extract expiresAt dates
      const allExpires = [(base as any).expiresAt, ...otherDuplicates.map((d) => (d as any).expiresAt)].filter(Boolean);
      const earliestExpires = allExpires.sort()[0] || earliestDate;

      // Standardize content hash
      const sourceName = (base as any).source || "Unknown";
      const contentHash = sha256(base.title + earliestDate + sourceName);

      const mergedEvent: Event = {
        ...base,
        date: earliestDate,
        tags: mergedTags,
        // Carry along extended schema attributes
        ...({
          expiresAt: earliestExpires,
          contentHash,
        } as any)
      };

      deduped.push(mergedEvent);
    }
  }

  return deduped;
}
