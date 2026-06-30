export interface Criterion {
  id: string;
  name: string;
  description: string;
  type: 'benefit' | 'cost';
  weight: number;
}

export interface Alternative {
  id: string;
  name: string;
  description: string;
  values: Record<string, number>; // Maps criterion ID to score/value
}

export interface WPResult {
  alternativeId: string;
  name: string;
  vectorS: number;
  preferenceV: number;
  rank: number;
}

export interface TOPSISResult {
  alternativeId: string;
  name: string;
  dPlus: number;
  dMinus: number;
  closenessC: number;
  rank: number;
}

/**
 * Calculates preference values using the Weighted Product (WP) method.
 * S_i = \prod (x_ij ^ w_j) where w_j is positive for benefit and negative for cost.
 * V_i = S_i / \sum S_i
 */
export function calculateWP(criteria: Criterion[], alternatives: Alternative[]): WPResult[] {
  // 1. Calculate Vector S for each alternative
  const results = alternatives.map(alt => {
    let vectorS = 1;
    criteria.forEach(c => {
      const val = alt.values[c.id] || 0;
      // Use +weight for benefit, -weight for cost
      const w = c.type === 'benefit' ? c.weight : -c.weight;
      vectorS *= Math.pow(val, w);
    });

    return {
      alternativeId: alt.id,
      name: alt.name,
      vectorS,
      preferenceV: 0, // Filled in normalization step
      rank: 0, // Filled in sorting step
    };
  });

  // 2. Normalize to calculate Preference V
  const sumS = results.reduce((sum, r) => sum + r.vectorS, 0);
  results.forEach(r => {
    r.preferenceV = sumS > 0 ? r.vectorS / sumS : 0;
  });

  // 3. Rank alternatives by Preference V (descending)
  const sorted = [...results].sort((a, b) => b.preferenceV - a.preferenceV);
  sorted.forEach((item, index) => {
    const original = results.find(r => r.alternativeId === item.alternativeId);
    if (original) {
      original.rank = index + 1;
    }
  });

  return results;
}

/**
 * Calculates closeness coefficients using the TOPSIS method.
 */
export function calculateTOPSIS(criteria: Criterion[], alternatives: Alternative[]): TOPSISResult[] {
  // 1. Calculate norm for each criterion: Norm_j = sqrt( sum(x_ij^2) )
  const norms: Record<string, number> = {};
  criteria.forEach(c => {
    let sumSquares = 0;
    alternatives.forEach(alt => {
      const val = alt.values[c.id] || 0;
      sumSquares += val * val;
    });
    norms[c.id] = Math.sqrt(sumSquares);
  });

  // 2. Vector-normalize and weight: y_ij = (x_ij / Norm_j) * w_j
  const weightedMatrix: Record<string, Record<string, number>> = {}; // altId -> cId -> y_ij
  alternatives.forEach(alt => {
    weightedMatrix[alt.id] = {};
    criteria.forEach(c => {
      const val = alt.values[c.id] || 0;
      const normVal = norms[c.id] || 1;
      weightedMatrix[alt.id][c.id] = normVal > 0 ? (val / normVal) * c.weight : 0;
    });
  });

  // 3. Determine positive ideal (A+) and negative ideal (A-) solutions
  const aPlus: Record<string, number> = {};
  const aMinus: Record<string, number> = {};

  criteria.forEach(c => {
    const values = alternatives.map(alt => weightedMatrix[alt.id][c.id]);
    if (c.type === 'benefit') {
      aPlus[c.id] = Math.max(...values);
      aMinus[c.id] = Math.min(...values);
    } else {
      // For cost criteria, ideal is minimum, worst is maximum
      aPlus[c.id] = Math.min(...values);
      aMinus[c.id] = Math.max(...values);
    }
  });

  // 4. Calculate distances D+ and D- for each alternative
  const results = alternatives.map(alt => {
    let sumDPlusSq = 0;
    let sumDMinusSq = 0;

    criteria.forEach(c => {
      const y = weightedMatrix[alt.id][c.id];
      const ideal = aPlus[c.id];
      const worst = aMinus[c.id];

      sumDPlusSq += Math.pow(y - ideal, 2);
      sumDMinusSq += Math.pow(y - worst, 2);
    });

    const dPlus = Math.sqrt(sumDPlusSq);
    const dMinus = Math.sqrt(sumDMinusSq);
    const closenessC = (dPlus + dMinus) > 0 ? dMinus / (dPlus + dMinus) : 0;

    return {
      alternativeId: alt.id,
      name: alt.name,
      dPlus,
      dMinus,
      closenessC,
      rank: 0, // Filled in sorting step
    };
  });

  // 5. Rank alternatives by Closeness C (descending)
  const sorted = [...results].sort((a, b) => b.closenessC - a.closenessC);
  sorted.forEach((item, index) => {
    const original = results.find(r => r.alternativeId === item.alternativeId);
    if (original) {
      original.rank = index + 1;
    }
  });

  return results;
}
