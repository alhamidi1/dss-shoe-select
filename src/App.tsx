import { useState, useMemo } from 'react';
import { 
  calculateWP, 
  calculateTOPSIS 
} from './madm';
import type { Criterion, Alternative } from './madm';

// Initial default criteria from the Project Document
const DEFAULT_CRITERIA: Criterion[] = [
  {
    id: 'c1',
    name: 'Cushioning / Comfort',
    description: 'Shock absorption & comfort over long distances.',
    type: 'benefit',
    weight: 0.25,
  },
  {
    id: 'c2',
    name: 'Durability',
    description: 'How many kilometres before the shoe wears out.',
    type: 'benefit',
    weight: 0.20,
  },
  {
    id: 'c3',
    name: 'Weight',
    description: 'Mass of the shoe — lighter is better for racing.',
    type: 'cost',
    weight: 0.20,
  },
  {
    id: 'c4',
    name: 'Grip / Traction',
    description: 'Stability and grip on the running surface.',
    type: 'benefit',
    weight: 0.15,
  },
  {
    id: 'c5',
    name: 'Price',
    description: 'Purchase price — lower is better for the athlete.',
    type: 'cost',
    weight: 0.20,
  },
];

// Initial default alternatives (shoe catalog) from the Project Document
const DEFAULT_ALTERNATIVES: Alternative[] = [
  {
    id: 'a1',
    name: 'SwiftRun Pro',
    description: 'A1 · premium all-rounder',
    values: { c1: 5, c2: 4, c3: 250, c4: 4, c5: 1800 },
  },
  {
    id: 'a2',
    name: 'EnduroMax',
    description: 'A2 · durable trainer',
    values: { c1: 4, c2: 5, c3: 290, c4: 5, c5: 1500 },
  },
  {
    id: 'a3',
    name: 'LightFeather',
    description: 'A3 · ultralight racer',
    values: { c1: 4, c2: 3, c3: 195, c4: 3, c5: 1650 },
  },
  {
    id: 'a4',
    name: 'TrailGrip X',
    description: 'A4 · grippy trail shoe',
    values: { c1: 3, c2: 4, c3: 270, c4: 5, c5: 1400 },
  },
  {
    id: 'a5',
    name: 'BudgetPace',
    description: 'A5 · budget option',
    values: { c1: 3, c2: 3, c3: 240, c4: 3, c5: 950 },
  },
];

function App() {
  const [step, setStep] = useState<number>(1);
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [alternatives, setAlternatives] = useState<Alternative[]>(DEFAULT_ALTERNATIVES);

  // Sum of weights validation
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const isWeightValid = Math.abs(totalWeight - 1.00) < 0.001;

  // Validation for decision matrix values
  const isMatrixValid = useMemo(() => {
    return alternatives.every(alt =>
      criteria.every(c => {
        const val = alt.values[c.id];
        if (val === undefined || val === null || isNaN(val)) return false;
        if (c.id === 'c1' || c.id === 'c2' || c.id === 'c4') {
          // Must be an integer between 1 and 5
          return Number.isInteger(val) && val >= 1 && val <= 5;
        }
        // Weight (c3) and Price (c5) must be positive values
        return val > 0;
      })
    );
  }, [criteria, alternatives]);

  // Helper to check if a specific matrix cell is invalid
  const isValInvalid = (altId: string, critId: string) => {
    const alt = alternatives.find(a => a.id === altId);
    if (!alt) return true;
    const val = alt.values[critId];
    if (val === undefined || val === null || isNaN(val) || val <= 0) return true;
    if (critId === 'c1' || critId === 'c2' || critId === 'c4') {
      return !Number.isInteger(val) || val < 1 || val > 5;
    }
    return false;
  };

  // Handle criteria weight changes
  const handleWeightChange = (id: string, value: number) => {
    // Round to 2 decimal places to avoid floating point issues
    const rounded = Math.round(value * 100) / 100;
    setCriteria(prev => 
      prev.map(c => (c.id === id ? { ...c, weight: rounded } : c))
    );
  };

  // Handle matrix value changes
  const handleValueChange = (altId: string, critId: string, valueStr: string) => {
    let val = parseFloat(valueStr);
    if (isNaN(val)) {
      val = 0; // Empty / invalid field representation
    }

    const isScale1to5 = critId === 'c1' || critId === 'c2' || critId === 'c4';

    if (isScale1to5 && val !== 0) {
      // Clamp between 1 and 5
      if (val < 1) val = 1;
      if (val > 5) val = 5;
      val = Math.round(val);
    } else if (val !== 0) {
      // Enforce positive number for weight and price
      if (val < 0) val = 0;
    }

    setAlternatives(prev =>
      prev.map(alt => {
        if (alt.id === altId) {
          return {
            ...alt,
            values: {
              ...alt.values,
              [critId]: val,
            },
          };
        }
        return alt;
      })
    );
  };

  // Toggle criterion type
  const handleTypeToggle = (id: string) => {
    setCriteria(prev =>
      prev.map(c => (c.id === id ? { ...c, type: c.type === 'benefit' ? 'cost' : 'benefit' } : c))
    );
  };

  // Run Calculations
  const wpResults = calculateWP(criteria, alternatives);
  const topsisResults = calculateTOPSIS(criteria, alternatives);

  // Get winning alternative for each method
  const wpWinner = [...wpResults].sort((a, b) => a.rank - b.rank)[0];
  const topsisWinner = [...topsisResults].sort((a, b) => a.rank - b.rank)[0];

  // Check if both methods agree on the recommended winner
  const methodsAgree = wpWinner && topsisWinner && wpWinner.alternativeId === topsisWinner.alternativeId;

  // Get ranked order of alternatives for results rendering
  const sortedWp = [...wpResults].sort((a, b) => a.rank - b.rank);
  const sortedTopsis = [...topsisResults].sort((a, b) => a.rank - b.rank);

  // Reset to default settings
  const handleStartOver = () => {
    setCriteria(DEFAULT_CRITERIA);
    setAlternatives(DEFAULT_ALTERNATIVES);
    setStep(1);
  };

  return (
    <div className="app-container">
      {/* Brand Header */}
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div className="brand-info">
            <h1>ShoeSelect DSS</h1>
            <p>MADM · Weighted Product vs TOPSIS</p>
          </div>
        </div>
        <div className="meta-info">
          <div>marathon shoe selection</div>
          <div>5 alternatives · 5 criteria</div>
        </div>
      </header>

      {/* Stepper Navigation */}
      <nav className="stepper">
        <div className={`step-node ${step >= 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
          <div className="step-circle">1</div>
          <div className="step-text">
            <h3>Criteria</h3>
            <p>Weights & type</p>
          </div>
        </div>
        <div className={`step-node ${step >= 2 ? 'active' : ''}`} onClick={() => isWeightValid && setStep(2)}>
          <div className="step-circle">2</div>
          <div className="step-text">
            <h3>Data entry</h3>
            <p>Decision matrix</p>
          </div>
        </div>
        <div className={`step-node ${step >= 3 ? 'active' : ''}`} onClick={() => isWeightValid && setStep(3)}>
          <div className="step-circle">3</div>
          <div className="step-text">
            <h3>Results</h3>
            <p>WP vs TOPSIS</p>
          </div>
        </div>
        <div className={`step-node ${step >= 4 ? 'active' : ''}`} onClick={() => isWeightValid && setStep(4)}>
          <div className="step-circle">4</div>
          <div className="step-text">
            <h3>Recommendation</h3>
            <p>Final pick</p>
          </div>
        </div>
      </nav>

      {/* Screen 1: Criteria & Weights Setup */}
      {step === 1 && (
        <section className="screen-content">
          <div className="screen-header">
            <span className="screen-subtitle">Step 01 · Setup</span>
            <h2 className="screen-title">Criteria & weights</h2>
            <p className="screen-desc">
              Set how much each factor matters to the runner. <strong>Benefit</strong> criteria reward higher values; <strong>cost</strong> criteria reward lower ones. The model handles the direction automatically.
            </p>
          </div>

          <div className="criteria-list">
            {criteria.map(c => (
              <div className="criterion-card" key={c.id}>
                <div className="criterion-left">
                  <div className="criterion-code">{c.id.toUpperCase()}</div>
                  <div className="criterion-info">
                    <h4>{c.name}</h4>
                    <p>{c.description}</p>
                  </div>
                </div>

                <div className="criterion-right">
                  <span 
                    className={`badge ${c.type} clickable`}
                    onClick={() => handleTypeToggle(c.id)}
                    title="Click to toggle between Benefit and Cost"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    {c.type === 'benefit' ? '▲ Benefit' : '▼ Cost'}
                  </span>

                  <div className="weight-input-container">
                    <div className="weight-input-wrapper">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={c.weight}
                        onChange={(e) => handleWeightChange(c.id, parseFloat(e.target.value) || 0)}
                        className="weight-number-input"
                      />
                    </div>
                    {/* Visual weight bar */}
                    <div className="weight-bar-track">
                      <div className="weight-bar-fill" style={{ width: `${c.weight * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="actions-row">
            <div className="status-info">
              <span className="total-weight-text">
                Total weight: <strong>{totalWeight.toFixed(2)}</strong>
              </span>
              <span className={`badge ${isWeightValid ? 'status-ok' : 'status-error'}`}>
                {isWeightValid ? '✓ sums to 1.00' : `⚠️ must sum to 1.00 (difference: ${(1.00 - totalWeight).toFixed(2)})`}
              </span>
            </div>

            <button 
              className="btn btn-primary"
              disabled={!isWeightValid}
              onClick={() => setStep(2)}
            >
              Continue to data entry →
            </button>
          </div>
        </section>
      )}

      {/* Screen 2: Shoe Data Entry (Decision Matrix) */}
      {step === 2 && (
        <section className="screen-content">
          <div className="screen-header">
            <span className="screen-subtitle">Step 02 · Decision Matrix</span>
            <h2 className="screen-title">Shoe data entry</h2>
            <p className="screen-desc">
              Enter each shoe's rating or measured value on every criterion. Ratings are 1–5; weight is in grams; price is in thousands of Rupiah.
            </p>
          </div>

          <div className="table-card">
            <table className="dss-table">
              <thead>
                <tr>
                  <th className="col-alt">Alternative</th>
                  {criteria.map(c => (
                    <th key={c.id} className="col-criterion">
                      <div className="th-criterion-content">
                        <span className="th-criterion-name">{c.name.split(' / ')[0]}</span>
                        <span className="th-criterion-desc">
                          {c.id === 'c3' ? 'grams' : c.id === 'c5' ? '×1,000 Rp' : '1-5 scale'}
                        </span>
                        <span className={`badge ${c.type}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                          {c.type.toUpperCase()}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alternatives.map(alt => (
                  <tr key={alt.id}>
                    <td>
                      <div className="alt-name-wrapper">
                        <span className="alt-name">{alt.name}</span>
                        <span className="alt-desc">{alt.description}</span>
                      </div>
                    </td>
                    {criteria.map(c => {
                      const isScale = c.id === 'c1' || c.id === 'c2' || c.id === 'c4';
                      const isInvalid = isValInvalid(alt.id, c.id);
                      return (
                        <td key={c.id}>
                          <div className="cell-input-wrapper">
                            <input
                              type="number"
                              min={isScale ? 1 : 1}
                              max={isScale ? 5 : undefined}
                              value={alt.values[c.id] || ''}
                              onChange={(e) => handleValueChange(alt.id, c.id, e.target.value)}
                              className="cell-input"
                              style={{ 
                                borderColor: isInvalid ? 'var(--color-cost-text)' : 'var(--border-light)', 
                                backgroundColor: isInvalid ? 'var(--color-cost-bg)' : '#fff',
                                transition: 'all 0.2s ease'
                              }}
                              title={isScale ? "Must be an integer between 1 and 5" : "Must be a positive number"}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!isMatrixValid && (
            <div className="badge status-error" style={{ display: 'block', textTransform: 'none', padding: '12px 16px', fontSize: '13px', borderRadius: '8px', marginTop: '12px', textAlign: 'left', lineHeight: '1.5' }}>
              ⚠️ <strong>Validation Warning:</strong> Some values in the decision matrix are incomplete or out of bounds. Cushioning (C1), Durability (C2), and Grip (C4) must be integers between 1 and 5. Weight and Price must be positive values.
            </div>
          )}

          <div className="actions-row">
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              ← Back to criteria
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setStep(3)}
              disabled={!isMatrixValid}
            >
              ⚡ Run analysis
            </button>
          </div>
        </section>
      )}

      {/* Screen 3: Rankings Dashboard */}
      {step === 3 && (
        <section className="screen-content">
          <div className="screen-header">
            <span className="screen-subtitle">Step 03 · Results</span>
            <h2 className="screen-title">Rankings dashboard</h2>
            <p className="screen-desc">
              Two independent MADM methods, computed side by side. The top-ranked shoe is highlighted in each.
            </p>
          </div>

          <div className="results-columns">
            {/* Weighted Product Method Card */}
            <div className="results-column-card">
              <div className="results-column-header">
                <h3>Weighted Product</h3>
                <span className="badge benefit" style={{ textTransform: 'lowercase' }}>multiplicative</span>
              </div>
              <div className="results-formula">
                <div className="results-formula-title">
                  <span>Weighted Product Formulation</span>
                  <span className="badge benefit" style={{ textTransform: 'uppercase', fontSize: '9px' }}>WP Method</span>
                </div>
                <div className="results-formula-grid">
                  <div className="results-formula-step">
                    <span>1. Weighted Vector (S<sub>i</sub>)</span>
                    <code>S<sub>i</sub> = ∏ (x<sub>ij</sub>)<sup>w<sub>j</sub></sup></code>
                  </div>
                  <div className="results-formula-step">
                    <span>2. Exponents (w<sub>j</sub>)</span>
                    <code>w<sub>j</sub> &gt; 0 (benefit) / w<sub>j</sub> &lt; 0 (cost)</code>
                  </div>
                  <div className="results-formula-step">
                    <span>3. Preference Score (V<sub>i</sub>)</span>
                    <code>V<sub>i</sub> = S<sub>i</sub> / ∑ S<sub>k</sub></code>
                  </div>
                </div>
                <p className="results-formula-expl">
                  ℹ️ Multiplies scores raised to their weights. <strong>A single poor score heavily penalizes the shoe</strong>, favoring balanced all-rounders.
                </p>
              </div>

              <div className="rankings-list">
                {sortedWp.map((item, index) => (
                  <div key={item.alternativeId} className={`ranking-item ${index === 0 ? 'winner' : ''}`}>
                    <div className="ranking-left">
                      <div className="rank-badge">{index + 1}</div>
                      <span className="rank-shoe-name">{item.name}</span>
                      {index === 0 && <span className="rank-shoe-best">★ BEST</span>}
                    </div>
                    <div className="rank-value-fields">
                      <div className="rank-value-item">
                        <span className="rank-value-label">Vector S</span>
                        <span className="rank-value-val">{item.vectorS.toFixed(5)}</span>
                      </div>
                      <div className="rank-value-item">
                        <span className="rank-value-label">Pref V</span>
                        <span className="rank-value-val" style={{ fontWeight: 700 }}>{item.preferenceV.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOPSIS Method Card */}
            <div className="results-column-card">
              <div className="results-column-header">
                <h3>TOPSIS</h3>
                <span className="badge cost" style={{ textTransform: 'lowercase' }}>ideal-distance</span>
              </div>
              <div className="results-formula">
                <div className="results-formula-title">
                  <span>TOPSIS Formulation</span>
                  <span className="badge cost" style={{ textTransform: 'uppercase', fontSize: '9px' }}>TOPSIS Method</span>
                </div>
                <div className="results-formula-grid">
                  <div className="results-formula-step">
                    <span>1. Vector Norm (|X<sub>j</sub>|)</span>
                    <code>|X<sub>j</sub>| = √∑ (x<sub>ij</sub>)<sup>2</sup></code>
                  </div>
                  <div className="results-formula-step">
                    <span>2. Weighted Normalized (y<sub>ij</sub>)</span>
                    <code>y<sub>ij</sub> = (x<sub>ij</sub> / |X<sub>j</sub>|) × w<sub>j</sub></code>
                  </div>
                  <div className="results-formula-step">
                    <span>3. Closeness Score (C<sub>i</sub>)</span>
                    <code>C<sub>i</sub> = D<sub>i</sub><sup>−</sup> / (D<sub>i</sub><sup>+</sup> + D<sub>i</sub><sup>−</sup>)</code>
                  </div>
                </div>
                <p className="results-formula-expl">
                  ℹ️ Measures distance to Best Ideal (D<sup>+</sup>) and Worst Ideal (D<sup>−</sup>). <strong>Rewards shoes that excel on the highest-weighted attributes.</strong>
                </p>
              </div>

              <div className="rankings-list">
                {sortedTopsis.map((item, index) => (
                  <div key={item.alternativeId} className={`ranking-item ${index === 0 ? 'winner' : ''}`}>
                    <div className="ranking-left">
                      <div className="rank-badge">{index + 1}</div>
                      <span className="rank-shoe-name">{item.name}</span>
                      {index === 0 && <span className="rank-shoe-best">★ BEST</span>}
                    </div>
                    <div className="rank-value-fields">
                      <div className="rank-value-item">
                        <span className="rank-value-label">D⁺</span>
                        <span className="rank-value-val">{item.dPlus.toFixed(4)}</span>
                      </div>
                      <div className="rank-value-item">
                        <span className="rank-value-label">D⁻</span>
                        <span className="rank-value-val">{item.dMinus.toFixed(4)}</span>
                      </div>
                      <div className="rank-value-item">
                        <span className="rank-value-label">C</span>
                        <span className="rank-value-val" style={{ fontWeight: 700 }}>{item.closenessC.toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cross-Method Agreement Card */}
          <div className="agreement-card">
            <div className="agreement-header">
              🤝 {methodsAgree 
                ? `Both methods agree on the recommended winner: ${wpWinner?.name}` 
                : 'The methods diverge on the recommended winner'}
            </div>
            
            <div className="agreement-grid">
              {alternatives.map(alt => {
                const wpRank = wpResults.find(r => r.alternativeId === alt.id)?.rank || 0;
                const topsisRank = topsisResults.find(r => r.alternativeId === alt.id)?.rank || 0;
                const isMatch = wpRank === topsisRank;
                return (
                  <div key={alt.id} className="agreement-badge">
                    <strong>{alt.name}</strong> 
                    <span style={{ color: 'var(--text-muted)' }}>WP {wpRank} · TOP {topsisRank}</span>
                    <span className={`agreement-match-label ${isMatch ? 'match' : 'differs'}`}>
                      {isMatch ? 'match' : 'differs'}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="agreement-text">
              Agreement on the winner across two very different mathematical methods provides strong evidence for the recommendation. 
              {methodsAgree && ` Both Weighted Product (WP) and TOPSIS independently confirm ${wpWinner?.name} as the highest scoring running shoe.`}
              {` Divergences in lower ranks (such as BudgetPace) arise because TOPSIS rewards options that are far from the worst values on key criteria (e.g. Price), whereas WP uses a multiplicative penalty for mediocrity across criteria.`}
            </p>
          </div>

          <div className="actions-row">
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              ← Edit data
            </button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>
              See recommendation →
            </button>
          </div>
        </section>
      )}

      {/* Screen 4: Recommendation Page */}
      {step === 4 && (
        <section className="screen-content">
          <div className="screen-header">
            <span className="screen-subtitle">Step 04 · Decision</span>
            <h2 className="screen-title">Recommendation</h2>
          </div>

          {/* Winner Hero Card */}
          {wpWinner && topsisWinner && (
            <div className="recommendation-card">
              <div className="shoe-artwork" style={{ padding: '0', overflow: 'hidden' }}>
                <img src="/marathon-shoe.png" alt="Recommended Shoe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="rec-details">
                <span className="badge rec-badge-winner">🏆 Recommended Winner</span>
                <h2 className="rec-title">
                  {methodsAgree ? wpWinner.name : `${wpWinner.name} (WP) / ${topsisWinner.name} (TOPSIS)`}
                </h2>
                <p className="rec-desc">
                  {alternatives.find(a => a.id === (methodsAgree ? wpWinner.alternativeId : wpWinner.alternativeId))?.description.split(' · ')[1]} — strong balance of comfort, durability and performance.
                </p>
                <div className="rec-vectors">
                  <div className="rec-vector-item">
                    <span className="rec-vector-label">Weighted Product</span>
                    <div className="rec-vector-val">Rank #{wpWinner.rank} · V = {wpWinner.preferenceV.toFixed(4)}</div>
                  </div>
                  <div className="rec-vector-item">
                    <span className="rec-vector-label">TOPSIS</span>
                    <div className="rec-vector-val">Rank #{topsisWinner.rank} · C = {topsisWinner.closenessC.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show criteria values of the recommended shoe */}
          {wpWinner && (
            <div className="rec-metrics-grid">
              {criteria.map(c => {
                const winningAlt = alternatives.find(alt => alt.id === wpWinner.alternativeId);
                const rawValue = winningAlt?.values[c.id] || 0;
                return (
                  <div className="rec-metric-card" key={c.id}>
                    <span className="rec-metric-label">{c.name.split(' / ')[0]}</span>
                    <div className="rec-metric-value">
                      {c.id === 'c3' ? (
                        <>
                          {rawValue} <span>g</span>
                        </>
                      ) : c.id === 'c5' ? (
                        <>
                          Rp {rawValue.toLocaleString()}<span>k</span>
                        </>
                      ) : (
                        `${rawValue} / 5`
                      )}
                    </div>
                    <span className={`badge ${c.type}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {c.type.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary text */}
          <div className="agreement-card" style={{ backgroundColor: 'var(--bg-card)' }}>
            <p className="agreement-text" style={{ fontSize: '14px' }}>
              {methodsAgree ? (
                <>
                  Both the <strong>Weighted Product</strong> and <strong>TOPSIS</strong> methods independently rank <strong>{wpWinner.name}</strong> first — a robust result that holds because the shoe scores well across cushioning, durability, and grip without suffering from extreme weaknesses. 
                  Runner-up in both methods is <strong>{sortedWp[1]?.name}</strong>. With two independent methods agreeing on the winner, the recommendation is strongly supported.
                </>
              ) : (
                <>
                  The algorithms recommend different shoes: <strong>Weighted Product</strong> recommends <strong>{wpWinner.name}</strong> while <strong>TOPSIS</strong> recommends <strong>{topsisWinner.name}</strong>. This difference is a direct result of how each mathematical model handles trade-offs. TOPSIS rewards alternatives that excel in single criteria (like cost/price), while WP favors alternatives that show balanced performance across all factors.
                </>
              )}
            </p>
          </div>

          <div className="actions-row">
            <button className="btn btn-secondary" onClick={() => setStep(3)}>
              ← Back to rankings
            </button>
            <button className="btn btn-primary" onClick={handleStartOver}>
              🔄 Start over
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;
