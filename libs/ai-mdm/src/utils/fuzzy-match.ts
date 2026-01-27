// Fuzzy matching utilities for deduplication and golden record

export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!;
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        );
      }
    }
  }

  return matrix[b.length]![a.length]!;
}

export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (!s1.length || !s2.length) return 0;
  
  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(s1.length, s2.length)); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  
  return jaro + prefix * 0.1 * (1 - jaro);
}

export function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchScore(a: string, b: string): number {
  const normA = normalizeForMatch(a);
  const normB = normalizeForMatch(b);
  
  if (normA === normB) return 1;
  
  const jw = jaroWinklerSimilarity(normA, normB);
  const maxLen = Math.max(normA.length, normB.length);
  const lev = 1 - levenshteinDistance(normA, normB) / maxLen;
  
  return (jw * 0.6 + lev * 0.4);
}

export function findBestMatch(target: string, candidates: string[]): { match: string; score: number } | null {
  if (!candidates.length) return null;

  let bestMatch = candidates[0]!;
  let bestScore = matchScore(target, candidates[0]!);

  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i]!;
    const score = matchScore(target, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return { match: bestMatch, score: bestScore };
}
