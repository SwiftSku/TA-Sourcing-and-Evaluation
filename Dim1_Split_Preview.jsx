import { useState } from "react";

// ── Current state (before split) ──
const BEFORE = {
  dim: {
    num: 1, name: "Full-Cycle Sales Recruiting", weight: 5, max: 4,
    weightedMax: 20, pct: "26.1%", tier: "CRITICAL",
    scores: [
      { s: 4, text: "Full-cycle (source→screen→interview→negotiate→close) AND hired Sales roles (SDRs, AEs, BDRs, AMs). Quantified." },
      { s: 3, text: "Full-cycle for non-Sales roles, OR Sales hiring with most stages owned but not full close authority." },
      { s: 2, text: "Partial ownership + Sales exposure. Agency full-cycle for Sales clients counts." },
      { s: 1, text: "Partial ownership (source + screen, hands off for close) with minimal/no Sales exposure." },
      { s: 0, text: "Pure coordination/scheduling/admin — no recruiting ownership, no Sales hiring evidence." },
    ],
  },
  baseMax: 76.6,
  formula: "(Dim1 × 5) + (Dim2 × 3) + (Dim3 × 3.5) + (Dim4 × 3) + (Dim5 × 5) + (Dim6 × 1) + (Dim7 × 0.7)",
  maxBreakdown: "20 + 9 + 10.5 + 12 + 20 + 3 + 2.1 = 76.6",
  dims: [
    { num: 1, name: "Full-Cycle Sales Recruiting", weight: 5, max: 4, wMax: 20, tier: "CRITICAL" },
    { num: 2, name: "Title Match — Recruiter", weight: 3, max: 3, wMax: 9, tier: "CORE" },
    { num: 3, name: "High-Volume Sourcing & Pipeline", weight: 3.5, max: 3, wMax: 10.5, tier: "CORE" },
    { num: 4, name: "SaaS / Tech Experience", weight: 3, max: 4, wMax: 12, tier: "CORE" },
    { num: 5, name: "Recruitment Career Concentration", weight: 5, max: 4, wMax: 20, tier: "CRITICAL" },
    { num: 6, name: "Sourcing Creativity & Tools", weight: 1, max: 3, wMax: 3, tier: "STANDARD" },
    { num: 7, name: "Tenure & Stability", weight: 0.7, max: 3, wMax: 2.1, tier: "STANDARD" },
  ],
  example: { dim1: 4, base: 72.6, raw: 80.7, pct: "105.4%" },
  a_rate: 'Full-Cycle Sales Recruiting (5×, 26.1%) and Career Concentration (5×, 26.1%) — together 52%',
  mentalModel: [
    { label: "Critical", items: "Full-Cycle Sales Recruiting 5× (26.1%), Career Concentration 5× (26.1%)" },
    { label: "Core", items: "High-Volume 3.5× (13.7%), SaaS 3× (15.7%), Title Match 3× (11.7%)" },
    { label: "Standard", items: "Sourcing Creativity 1× (3.9%), Tenure 0.7× (2.7%)" },
  ],
  columns: 43,
};

// ── Proposed state (after split) ──
const AFTER = {
  dim1: {
    num: 1, name: "Full-Cycle Recruiting Ownership", weight: 3, max: 4,
    weightedMax: 12, pct: "15.7%", tier: "CRITICAL",
    scores: [
      { s: 4, text: "Full-cycle ownership (source→screen→interview→negotiate→close) for multiple roles. Quantified pipeline metrics. Independently managed reqs from open to close." },
      { s: 3, text: "Full-cycle for most stages — may hand off offer negotiation or close to HM but owns sourcing through interview. Evidence of independent judgment." },
      { s: 2, text: "Partial ownership — owns sourcing + screening, assists with interviews. Agency recruiter who owned full-cycle for clients counts." },
      { s: 1, text: "Limited ownership — sourcing or screening only, hands off for everything after. Coordinator growing into recruiting." },
      { s: 0, text: "Pure coordination/scheduling/admin — no independent recruiting ownership." },
    ],
  },
  dim2: {
    num: 2, name: "Sales Hiring Track Record", weight: 2, max: 4,
    weightedMax: 8, pct: "10.4%", tier: "CRITICAL",
    scores: [
      { s: 4, text: "Explicitly hired Sales roles (SDRs, AEs, BDRs, AMs, Sales Managers) as primary focus. Quantified: 'hired X salespeople in Y months.' Sales hiring is a major part of portfolio." },
      { s: 3, text: "Hired Sales roles but not primary focus — Sales was one of several departments. Or hired Sales-adjacent (CS, BD) at volume." },
      { s: 2, text: "Some Sales hiring exposure — a few Sales positions among many other roles. Or supported Sales hiring team without owning the full req." },
      { s: 1, text: "Minimal Sales exposure — aware of needs, possibly screened a few Sales candidates, but no meaningful track record." },
      { s: 0, text: "No evidence of Sales hiring experience." },
    ],
  },
  baseMax: 76.6,
  formula: "(Dim1 × 3) + (Dim2 × 2) + (Dim3 × 3) + (Dim4 × 3.5) + (Dim5 × 3) + (Dim6 × 5) + (Dim7 × 1) + (Dim8 × 0.7)",
  maxBreakdown: "12 + 8 + 9 + 10.5 + 12 + 20 + 3 + 2.1 = 76.6",
  dims: [
    { num: 1, name: "Full-Cycle Recruiting Ownership", weight: 3, max: 4, wMax: 12, tier: "CRITICAL", isNew: true },
    { num: 2, name: "Sales Hiring Track Record", weight: 2, max: 4, wMax: 8, tier: "CRITICAL", isNew: true },
    { num: 3, name: "Title Match — Recruiter", weight: 3, max: 3, wMax: 9, tier: "CORE" },
    { num: 4, name: "High-Volume Sourcing & Pipeline", weight: 3.5, max: 3, wMax: 10.5, tier: "CORE" },
    { num: 5, name: "SaaS / Tech Experience", weight: 3, max: 4, wMax: 12, tier: "CORE" },
    { num: 6, name: "Recruitment Career Concentration", weight: 5, max: 4, wMax: 20, tier: "CRITICAL" },
    { num: 7, name: "Sourcing Creativity & Tools", weight: 1, max: 3, wMax: 3, tier: "STANDARD" },
    { num: 8, name: "Tenure & Stability", weight: 0.7, max: 3, wMax: 2.1, tier: "STANDARD" },
  ],
  example: { dim1: 4, dim2: 4, base: 72.6, raw: 80.7, pct: "105.4%", note: "4×3 + 4×2 = 20 (same as old 4×5 = 20)" },
  a_rate: 'Full-Cycle Recruiting (3×, 15.7%), Sales Hiring (2×, 10.4%), and Career Concentration (5×, 26.1%) — together 52.2%',
  mentalModel: [
    { label: "Critical", items: "Full-Cycle Recruiting 3× (15.7%), Sales Hiring 2× (10.4%), Career Concentration 5× (26.1%)" },
    { label: "Core", items: "High-Volume 3.5× (13.7%), SaaS 3× (15.7%), Title Match 3× (11.7%)" },
    { label: "Standard", items: "Sourcing Creativity 1× (3.9%), Tenure 0.7× (2.7%)" },
  ],
  columns: 45,
  renumbering: [
    { old: "Dim1 Full-Cycle Sales Recruiting (5×)", new: "Dim1 Full-Cycle Recruiting (3×) + Dim2 Sales Hiring (2×)" },
    { old: "Dim2 Title Match", new: "Dim3 Title Match" },
    { old: "Dim3 High-Volume", new: "Dim4 High-Volume" },
    { old: "Dim4 SaaS", new: "Dim5 SaaS" },
    { old: "Dim5 Career Concentration", new: "Dim6 Career Concentration" },
    { old: "Dim6 Sourcing Creativity", new: "Dim7 Sourcing Creativity" },
    { old: "Dim7 Tenure", new: "Dim8 Tenure" },
  ],
};

const tierColors = {
  CRITICAL: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  CORE: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  STANDARD: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
};

function Badge({ tier }) {
  const c = tierColors[tier];
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: 0.5 }}>{tier}</span>;
}

function WeightBar({ weight, maxW = 5, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 80, height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${(weight / maxW) * 100}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 32 }}>{weight}×</span>
    </div>
  );
}

function ScoreRow({ s, text, color }) {
  return (
    <div style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 12, color: "#374151" }}>
      <span style={{ fontWeight: 700, color, minWidth: 16, textAlign: "center" }}>{s}</span>
      <span>{text}</span>
    </div>
  );
}

function DimRow({ dim, color, baseMax, expanded, onToggle }) {
  const pct = ((dim.wMax || dim.weightedMax) / baseMax * 100).toFixed(1);
  return (
    <div onClick={onToggle} style={{ background: dim.isNew ? "#F5F3FF" : "#fff", border: dim.isNew ? "2px solid #8B5CF6" : "1px solid #E5E7EB", borderRadius: 8, padding: "10px 12px", cursor: "pointer", transition: "all 0.15s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>D{dim.num}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{dim.name}</span>
          {dim.isNew && <span style={{ fontSize: 9, background: "#8B5CF6", color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>NEW</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Badge tier={dim.tier} />
          <WeightBar weight={dim.weight} color={color} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", minWidth: 42, textAlign: "right" }}>{pct}%</span>
        </div>
      </div>
      {expanded && dim.scores && (
        <div style={{ marginTop: 8, borderTop: "1px solid #E5E7EB", paddingTop: 8 }}>
          {dim.scores.map(sc => <ScoreRow key={sc.s} s={sc.s} text={sc.text} color={color} />)}
          <div style={{ marginTop: 4, fontSize: 11, color: "#9CA3AF" }}>Max weighted: {dim.weight} × {dim.max} = {dim.weight * dim.max}</div>
        </div>
      )}
    </div>
  );
}

export default function Dim1SplitPreview() {
  const [tab, setTab] = useState("overview");
  const [expandedBefore, setExpandedBefore] = useState(false);
  const [expandedAfter, setExpandedAfter] = useState({});

  const toggleAfter = (i) => setExpandedAfter(p => ({ ...p, [i]: !p[i] }));

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 960, margin: "0 auto", padding: 16, background: "#F9FAFB", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>Dim1 Split Preview</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 0" }}>Senior Sales Recruiter — splitting Full-Cycle Sales Recruiting back into two dimensions</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "scoring", label: "Scoring Criteria" },
          { id: "cascade", label: "Full Cascade" },
          { id: "example", label: "Example Row" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: tab === t.id ? "#111" : "#E5E7EB", color: tab === t.id ? "#fff" : "#374151" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Before → After cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "start" }}>
            {/* Before */}
            <div style={{ background: "#fff", border: "2px solid #EF4444", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>BEFORE (CURRENT)</div>
              <div style={{ background: "#FEF2F2", borderRadius: 6, padding: 10, border: "1px solid #FECACA" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>D1 Full-Cycle Sales Recruiting</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>5×</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weight</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>4</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>max</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>20</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weighted</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#EF4444" }}>26.1%</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>of base</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 8, fontStyle: "italic" }}>Merged dim — measures BOTH full-cycle ownership AND Sales domain in one score</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                <strong>Problem:</strong> A score of 3 could mean "great full-cycle recruiter who's never hired Sales" OR "Sales recruiter who only screens." These are very different gaps.
              </div>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", alignItems: "center", paddingTop: 40 }}>
              <span style={{ fontSize: 28, color: "#9CA3AF" }}>→</span>
            </div>

            {/* After */}
            <div style={{ background: "#fff", border: "2px solid #22C55E", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", marginBottom: 8 }}>AFTER (PROPOSED)</div>
              <div style={{ background: "#F0FDF4", borderRadius: 6, padding: 10, border: "1px solid #BBF7D0", marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>D1 Full-Cycle Recruiting Ownership</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>3×</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weight</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>4</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>max</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>12</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weighted</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>15.7%</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>of base</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6, fontStyle: "italic" }}>Can they independently own sourcing → close? (domain-agnostic)</div>
              </div>
              <div style={{ background: "#F0FDF4", borderRadius: 6, padding: 10, border: "1px solid #BBF7D0" }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>D2 Sales Hiring Track Record</div>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>2×</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weight</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>4</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>max</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>8</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>weighted</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>10.4%</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>of base</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6, fontStyle: "italic" }}>Have they specifically hired SDRs, AEs, BDRs? (domain-specific)</div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#374151" }}>
                <strong>Combined:</strong> 12 + 8 = <strong>20 weighted</strong> (same as before). Base max stays 76.6.
              </div>
            </div>
          </div>

          {/* Key insight */}
          <div style={{ background: "#FFFBEB", border: "2px solid #F59E0B", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E", marginBottom: 4 }}>Why split?</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
              The merged dimension conflated two independent signals. With the split, a candidate who scores Dim1=4 / Dim2=0 is clearly readable as "strong full-cycle recruiter, zero Sales experience" — you know exactly what the gap is and whether it's trainable. The old merged score of 3 was ambiguous.
            </div>
          </div>

          {/* Weight distribution comparison */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Full Weight Distribution (After)</div>
            {AFTER.dims.map((d, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "200px 1fr 60px", gap: 8, padding: "5px 0", borderBottom: i < AFTER.dims.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600, minWidth: 22 }}>D{d.num}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{d.name}</span>
                  {d.isNew && <span style={{ fontSize: 9, background: "#8B5CF6", color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>NEW</span>}
                </div>
                <div style={{ height: 14, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${(d.wMax / 20) * 100}%`, height: "100%", background: d.isNew ? "#8B5CF6" : d.tier === "CRITICAL" ? "#EF4444" : d.tier === "CORE" ? "#F97316" : "#22C55E", borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 4 }}>
                    <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{d.weight}×</span>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textAlign: "right" }}>{d.wMax}</span>
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 60px", gap: 8, padding: "8px 0", borderTop: "2px solid #111", marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>BASE TOTAL</span>
              <span />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#8B5CF6", textAlign: "right" }}>76.6</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SCORING CRITERIA TAB ── */}
      {tab === "scoring" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Before */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", marginBottom: 8 }}>BEFORE — Single merged dimension</div>
            <div onClick={() => setExpandedBefore(!expandedBefore)} style={{ cursor: "pointer", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>D1</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{BEFORE.dim.name}</span>
                  <Badge tier="CRITICAL" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#EF4444" }}>5× (max 4 = 20)</span>
              </div>
              {expandedBefore && (
                <div style={{ marginTop: 8, borderTop: "1px solid #FECACA", paddingTop: 8 }}>
                  {BEFORE.dim.scores.map(sc => <ScoreRow key={sc.s} s={sc.s} text={sc.text} color="#EF4444" />)}
                </div>
              )}
            </div>
          </div>

          {/* After */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#22C55E", marginBottom: 8 }}>AFTER — Two independent dimensions (click to expand)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <DimRow dim={{ ...AFTER.dim1, wMax: 12, isNew: true, scores: AFTER.dim1.scores }} color="#8B5CF6" baseMax={76.6} expanded={expandedAfter[0]} onToggle={() => toggleAfter(0)} />
              <DimRow dim={{ ...AFTER.dim2, wMax: 8, isNew: true, scores: AFTER.dim2.scores }} color="#8B5CF6" baseMax={76.6} expanded={expandedAfter[1]} onToggle={() => toggleAfter(1)} />
            </div>
          </div>

          {/* Diagnostic scenarios */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Diagnostic clarity — same candidate, two readings</div>
            {[
              { name: "Strong full-cycle, zero Sales", before: "Dim1 = 3 (ambiguous)", after: "Dim1 = 4, Dim2 = 0", gap: "Trainable — they can recruit, just need Sales domain context", beforeW: 15, afterW: 12 },
              { name: "Sales sourcer, no close authority", before: "Dim1 = 2 (ambiguous)", after: "Dim1 = 1, Dim2 = 3", gap: "Structural — they need to grow into full-cycle ownership", beforeW: 10, afterW: 9 },
              { name: "Full-cycle Sales recruiter", before: "Dim1 = 4", after: "Dim1 = 4, Dim2 = 4", gap: "No gap — ideal candidate", beforeW: 20, afterW: 20 },
            ].map((sc, i) => (
              <div key={i} style={{ padding: "8px 0", borderBottom: i < 2 ? "1px solid #F3F4F6" : "none" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{sc.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 12 }}><span style={{ color: "#EF4444", fontWeight: 600 }}>Before:</span> {sc.before} → {sc.beforeW}pts</div>
                  <div style={{ fontSize: 12 }}><span style={{ color: "#22C55E", fontWeight: 600 }}>After:</span> {sc.after} → {sc.afterW}pts</div>
                  <div style={{ fontSize: 12, color: "#6B7280", fontStyle: "italic" }}>{sc.gap}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CASCADE TAB ── */}
      {tab === "cascade" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Renumbering */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Dimension Renumbering</div>
            {AFTER.renumbering.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, padding: "5px 0", borderBottom: i < AFTER.renumbering.length - 1 ? "1px solid #F3F4F6" : "none", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: i === 0 ? "#EF4444" : "#374151", fontWeight: i === 0 ? 700 : 400, textDecoration: i === 0 ? "line-through" : "none" }}>{r.old}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>→</span>
                <span style={{ fontSize: 12, color: i === 0 ? "#22C55E" : "#374151", fontWeight: i === 0 ? 700 : 600 }}>{r.new}</span>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Formula Change</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>BEFORE</div>
              <code style={{ fontSize: 12, color: "#374151", background: "#FEF2F2", padding: "4px 8px", borderRadius: 4, display: "block" }}>{BEFORE.formula}</code>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{BEFORE.maxBreakdown}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>AFTER</div>
              <code style={{ fontSize: 12, color: "#374151", background: "#F0FDF4", padding: "4px 8px", borderRadius: 4, display: "block" }}>{AFTER.formula}</code>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{AFTER.maxBreakdown}</div>
            </div>
          </div>

          {/* Mental model */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Mental Model Update</div>
            {AFTER.mentalModel.map((m, i) => (
              <div key={i} style={{ padding: "4px 0", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: i === 0 ? "#991B1B" : i === 1 ? "#9A3412" : "#166534" }}>{m.label}:</span>{" "}
                <span style={{ color: "#374151" }}>{m.items}</span>
              </div>
            ))}
          </div>

          {/* a_rate_signals */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>a_rate_signals YAML Update</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444" }}>BEFORE</div>
              <div style={{ fontSize: 11, color: "#374151", background: "#FEF2F2", padding: 8, borderRadius: 4, lineHeight: 1.5 }}>{BEFORE.a_rate}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>AFTER</div>
              <div style={{ fontSize: 11, color: "#374151", background: "#F0FDF4", padding: 8, borderRadius: 4, lineHeight: 1.5 }}>{AFTER.a_rate}</div>
            </div>
          </div>

          {/* Other cascade items */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Other Cascade Changes</div>
            {[
              { item: "Column count", before: "43", after: "45 (+2 for new Dim2 score + note)" },
              { item: "Base max", before: "76.6", after: "76.6 (unchanged)" },
              { item: "Tier thresholds", before: "A≥80%, B≥65%…", after: "Unchanged" },
              { item: "Rubric summary table", before: "7 rows", after: "8 rows (Dim1 split into two)" },
              { item: "JSX viewer SR object", before: "7 dims in array", after: "8 dims, updated comparisons + differences view" },
              { item: "Recruiting Coordinator", before: "—", after: "No changes (SaaS dim already identical)" },
            ].map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 8, padding: "5px 0", borderBottom: i < 5 ? "1px solid #F3F4F6" : "none", fontSize: 12 }}>
                <span style={{ fontWeight: 600, color: "#374151" }}>{r.item}</span>
                <span style={{ color: "#9CA3AF" }}>{r.before}</span>
                <span style={{ color: "#374151", fontWeight: 600 }}>{r.after}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXAMPLE ROW TAB ── */}
      {tab === "example" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Example: Ankit Sharma (Razorpay)</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Full-cycle TA at Razorpay, hired 20+ SDRs and AEs in 6 months</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Before */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginBottom: 6 }}>BEFORE</div>
                <div style={{ background: "#FEF2F2", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Dim1 Full-Cycle Sales Recruiting:</strong> 4 × 5 = <strong>20</strong></div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>"Full-cycle TA at Razorpay, owns sourcing→close, hired 20+ SDRs and AEs in 6 months"</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div>Base Score: <strong>72.6</strong></div>
                  <div>Raw Score: <strong>80.7</strong></div>
                  <div>Percentage: <strong>105.4%</strong> → <strong style={{ color: "#22C55E" }}>A / Strong Yes</strong></div>
                </div>
              </div>

              {/* After */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#22C55E", marginBottom: 6 }}>AFTER</div>
                <div style={{ background: "#F0FDF4", borderRadius: 6, padding: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Dim1 Full-Cycle Recruiting:</strong> 4 × 3 = <strong>12</strong></div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>"Full-cycle TA at Razorpay, owns sourcing→close independently"</div>
                </div>
                <div style={{ background: "#F0FDF4", borderRadius: 6, padding: 10 }}>
                  <div style={{ fontSize: 12, marginBottom: 4 }}><strong>Dim2 Sales Hiring:</strong> 4 × 2 = <strong>8</strong></div>
                  <div style={{ fontSize: 11, color: "#6B7280", fontStyle: "italic" }}>"Hired 20+ SDRs and AEs in 6 months — Sales is primary focus"</div>
                </div>
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <div>Dim1 + Dim2 combined: 12 + 8 = <strong>20</strong> (same as before)</div>
                  <div>Base Score: <strong>72.6</strong> (unchanged)</div>
                  <div>Raw Score: <strong>80.7</strong> (unchanged)</div>
                  <div>Percentage: <strong>105.4%</strong> → <strong style={{ color: "#22C55E" }}>A / Strong Yes</strong></div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, background: "#ECFDF5", border: "1px solid #34D399", borderRadius: 6, padding: 10 }}>
              <div style={{ fontSize: 12, color: "#065F46", fontWeight: 600 }}>Score preservation: For candidates who max both signals (like Ankit), the math is identical: 4×5=20 → 4×3 + 4×2 = 20. Scores only diverge when the two signals differ — which is exactly the diagnostic value of the split.</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 16, background: "#F3F4F6", borderRadius: 10, padding: 12, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#6B7280" }}>
          Review all tabs, then tell me to apply. I'll cascade through: JD dimensions → formula → base max refs → column spec → example row → summary table → a_rate_signals YAML → JSX viewer data + hardcoded text.
        </div>
      </div>
    </div>
  );
}
