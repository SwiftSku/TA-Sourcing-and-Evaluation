import { useState } from "react";

const RC = {
  name: "Recruiting Coordinator",
  shortName: "RC",
  color: "#3B82F6",
  bgLight: "#EFF6FF",
  baseMax: 53.4,
  autoDQ: [
    "BPO / call centers",
    "Non-tech traditional industry",
    "Auto sales / heavy industries",
    "Accounting / bookkeeping / finance",
    "No Gujarat/Gujarati connection",
    { text: "Pure agency staffing — no in-house experience", unique: true },
  ],
  dims: [
    {
      num: 1, name: "Title Match — Coordination", weight: 5, max: 3, tier: "CRITICAL",
      scores: [
        { s: 3, text: "Recruiting Coordinator, TA Coordinator, Interview Coordinator — primary title at tech/SaaS" },
        { s: 2, text: "HR Coordinator with significant recruiting duties; or RC at non-tech; or high-volume sourcer with coordination duties" },
        { s: 1, text: "General HR / admin with some interview scheduling or hiring support" },
        { s: 0, text: "No recruiting or coordination experience — pure generalist HR, payroll, compliance" },
      ],
    },
    {
      num: 2, name: "High-Volume Hiring", weight: 4, max: 3, tier: "CORE",
      scores: [
        { s: 3, text: "Quantified metrics: X calls/day, X screens/week, pipelines of 50+, mass outreach, 'high volume' mentioned" },
        { s: 2, text: "Mentions high-volume without metrics, or clear high-throughput role (staffing agency, RPO)" },
        { s: 1, text: "Some volume indication — multiple reqs, busy hiring environment" },
        { s: 0, text: "No evidence of high-volume hiring" },
      ],
    },
    {
      num: 3, name: "Sales Hiring Experience", weight: 3, max: 3, tier: "CORE",
      scores: [
        { s: 3, text: "Explicitly recruited for Sales roles (SDRs, AEs, AMs, BDRs) at SaaS/tech" },
        { s: 2, text: "Sales-adjacent roles (CS, BD) or Sales at non-tech" },
        { s: 1, text: "Some Sales hiring exposure — supported team, scheduled interviews" },
        { s: 0, text: "No Sales hiring evidence" },
      ],
    },
    {
      num: 4, name: "SaaS Experience", weight: 3, max: 4, tier: "CORE",
      scores: [
        { s: 4, text: "US HQ SaaS company" },
        { s: 3, text: "Non-US SaaS on validated list" },
        { s: 2, text: "Clear SaaS/tech, not on list" },
        { s: 1, text: "Mixed SaaS + traditional" },
        { s: 0, text: "No SaaS exposure" },
      ],
    },
    {
      num: 5, name: "Education & Credentials", weight: 0.7, max: 3, tier: "STANDARD",
      scores: [
        { s: 3, text: "MBA (IIM, top-tier) + relevant undergrad, or HR cert (SHRM, PHR)" },
        { s: 2, text: "MBA, professional cert, or engineering degree" },
        { s: 1, text: "Bachelor's, relevant field" },
        { s: 0, text: "No degree or unrelated" },
      ],
    },
    {
      num: 6, name: "Recruiting Ops & ATS", weight: 0.6, max: 4, tier: "STANDARD",
      unique: true,
      scores: [
        { s: 4, text: "Greenhouse mentioned anywhere = automatic 4" },
        { s: 3, text: "Other named ATS (Lever, Ashby, Workday) + process ownership" },
        { s: 2, text: "ATS mentioned + basic coordination" },
        { s: 1, text: "Some coordination, no ATS mentioned" },
        { s: 0, text: "No ATS or recruiting ops evidence" },
      ],
    },
    {
      num: 7, name: "Tenure & Stability", weight: 0.3, max: 3, tier: "MINOR",
      scores: [
        { s: 3, text: "3+ year stint in recruiting/ops role" },
        { s: 2, text: "2-3 years, or multiple roles totaling 5+" },
        { s: 1, text: "1-2 years in recruiting/coordination" },
        { s: 0, text: "Under 1 year or all stints under 8 months" },
      ],
    },
  ],
  bonuses: [
    { name: "US Company Experience", mult: 0.8, max: 3, maxBonus: 2.4 },
    { name: "Startup / VC-Backed", mult: 2, max: 4, maxBonus: 8.0 },
  ],
};

const SR = {
  name: "Senior Sales Recruiter",
  shortName: "SR",
  color: "#8B5CF6",
  bgLight: "#F5F3FF",
  baseMax: 60.9,
  autoDQ: [
    "BPO / call centers",
    "Non-tech traditional industry",
    "Auto sales / heavy industries",
    "Accounting / bookkeeping / finance",
    "No Gujarat/Gujarati connection",
    { text: "Pure coordination/scheduling — zero recruiting ownership", unique: true },
    { text: "Bench sales / IT body shop only", unique: true },
  ],
  dims: [
    {
      num: 1, name: "Full-Cycle Recruiting Ownership", weight: 5, max: 3, tier: "CRITICAL",
      unique: true,
      scores: [
        { s: 3, text: "Full-cycle at tech/SaaS: sourcing → screening → interviewing → offer negotiation → close independently" },
        { s: 2, text: "Full-cycle at non-tech, OR most stages owned. Agency recruiter with full-cycle for clients counts." },
        { s: 1, text: "Partial ownership — sourcing + screening but hands off for interviews/close" },
        { s: 0, text: "Pure coordination/scheduling/admin — no independent recruiting ownership" },
      ],
    },
    {
      num: 2, name: "Sales Hiring Track Record", weight: 4, max: 3, tier: "CORE",
      scores: [
        { s: 3, text: "Explicitly recruited for Sales roles at SaaS/tech. Quantified: 'hired X salespeople in Y months'" },
        { s: 2, text: "Sales-adjacent roles (CS, BD, AM) or Sales at non-tech. Mentions Sales hiring without quantification." },
        { s: 1, text: "Some Sales hiring exposure — supported team, occasional Sales fills" },
        { s: 0, text: "No Sales hiring — only Engineering, Design, Product, or non-customer-facing roles" },
      ],
    },
    {
      num: 3, name: "High-Volume Sourcing & Pipeline", weight: 3.5, max: 3, tier: "CORE",
      scores: [
        { s: 3, text: "Quantified: X sourced/month, X hires/quarter, cold outreach campaigns, 50+ pipeline. Proactive sourcing." },
        { s: 2, text: "Mentions high-volume without metrics, or clear high-throughput role. Evidence of cold outreach." },
        { s: 1, text: "Some volume — multiple reqs, busy environment. Primarily inbound/application-based." },
        { s: 0, text: "No high-volume evidence — occasional reactive fills, or only coordinated others' pipelines" },
      ],
    },
    {
      num: 4, name: "SaaS / Tech Experience", weight: 3, max: 4, tier: "CORE",
      scores: [
        { s: 4, text: "US HQ SaaS company" },
        { s: 3, text: "Non-US SaaS on validated list" },
        { s: 2, text: "Clear SaaS/tech, not on list" },
        { s: 1, text: "Mixed SaaS + traditional" },
        { s: 0, text: "No SaaS exposure" },
      ],
    },
    {
      num: 5, name: "Recruiting Seniority & Years", weight: 2, max: 3, tier: "STANDARD",
      unique: true,
      scores: [
        { s: 3, text: "5+ years full-cycle. Senior/Lead titles. Evidence of mentoring or owning hiring strategy." },
        { s: 2, text: "3–5 years (meets JD minimum). Clear progression. Independent execution." },
        { s: 1, text: "1–3 years. Still developing — may need guidance on negotiation/stakeholder mgmt." },
        { s: 0, text: "Under 1 year, or no recruiting experience (only coordination/admin)" },
      ],
    },
    {
      num: 6, name: "Sourcing Creativity & Tools", weight: 1, max: 3, tier: "MINOR",
      unique: true,
      scores: [
        { s: 3, text: "Multi-channel: LinkedIn + Naukri + referrals + Boolean + cold outreach + unconventional. Named tools." },
        { s: 2, text: "LinkedIn + one other channel. Mentions sourcing tools or Boolean search." },
        { s: 1, text: "Basic — posts on boards, screens inbound. Single-channel." },
        { s: 0, text: "No sourcing evidence — only managed existing pipeline candidates" },
      ],
    },
    {
      num: 7, name: "Education & Credentials", weight: 0.5, max: 3, tier: "MINOR",
      scores: [
        { s: 3, text: "MBA (IIM, top-tier) + relevant undergrad, or HR cert (SHRM, PHR)" },
        { s: 2, text: "MBA, professional cert, or engineering degree" },
        { s: 1, text: "Bachelor's, relevant field" },
        { s: 0, text: "No degree or unrelated" },
      ],
    },
    {
      num: 8, name: "Tenure & Stability", weight: 0.3, max: 3, tier: "MINOR",
      scores: [
        { s: 3, text: "At least one 3+ year stint at a single company in a recruiting role" },
        { s: 2, text: "2–3 years in a recruiting role, or multiple recruiting roles totaling 5+" },
        { s: 1, text: "1–2 years in recruiting roles" },
        { s: 0, text: "Under 1 year total, or all stints under 8 months" },
      ],
    },
  ],
  bonuses: [
    { name: "US Company Experience", mult: 0.8, max: 3, maxBonus: 2.4 },
    { name: "Startup / VC-Backed", mult: 2, max: 4, maxBonus: 8.0 },
  ],
};

const tierColors = {
  CRITICAL: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
  CORE: { bg: "#FFF7ED", text: "#9A3412", border: "#FED7AA" },
  STANDARD: { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  MINOR: { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
};

function TierBadge({ tier }) {
  const c = tierColors[tier];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}`, letterSpacing: 0.5 }}>
      {tier}
    </span>
  );
}

function WeightBar({ weight, maxWeight = 5, color }) {
  const pct = (weight / maxWeight) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 80, height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 32 }}>{weight}×</span>
    </div>
  );
}

function DimCard({ dim, color, bgLight, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: dim.unique ? bgLight : "#fff",
        border: dim.unique ? `2px solid ${color}` : "1px solid #E5E7EB",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>D{dim.num}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{dim.name}</span>
          {dim.unique && <span style={{ fontSize: 9, background: color, color: "#fff", padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>UNIQUE</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TierBadge tier={dim.tier} />
          <WeightBar weight={dim.weight} color={color} />
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, borderTop: "1px solid #E5E7EB", paddingTop: 8 }}>
          {dim.scores.map((sc) => (
            <div key={sc.s} style={{ display: "flex", gap: 8, padding: "3px 0", fontSize: 12, color: "#374151" }}>
              <span style={{ fontWeight: 700, color, minWidth: 16, textAlign: "center" }}>{sc.s}</span>
              <span>{sc.text}</span>
            </div>
          ))}
          <div style={{ marginTop: 4, fontSize: 11, color: "#9CA3AF" }}>
            Max weighted: {dim.weight} × {dim.max} = {dim.weight * dim.max}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RubricComparison() {
  const [view, setView] = useState("side-by-side");
  const [expandedRC, setExpandedRC] = useState({});
  const [expandedSR, setExpandedSR] = useState({});
  const [showDQ, setShowDQ] = useState(true);

  const toggleRC = (i) => setExpandedRC((p) => ({ ...p, [i]: !p[i] }));
  const toggleSR = (i) => setExpandedSR((p) => ({ ...p, [i]: !p[i] }));
  const expandAll = () => {
    const rcAll = {}; RC.dims.forEach((_, i) => rcAll[i] = true);
    const srAll = {}; SR.dims.forEach((_, i) => srAll[i] = true);
    setExpandedRC(rcAll); setExpandedSR(srAll);
  };
  const collapseAll = () => { setExpandedRC({}); setExpandedSR({}); };

  const sharedDQ = RC.autoDQ.filter((d) => typeof d === "string");
  const rcUniqueDQ = RC.autoDQ.filter((d) => typeof d === "object");
  const srUniqueDQ = SR.autoDQ.filter((d) => typeof d === "object");

  // Weight comparison data
  const weightData = [];
  const allDimNames = new Set();
  RC.dims.forEach((d) => allDimNames.add(d.name));
  SR.dims.forEach((d) => allDimNames.add(d.name));

  // Build comparison rows matching by similar purpose
  const comparisons = [
    { rc: RC.dims[0], sr: SR.dims[0], label: "Top Dimension (5×)" },
    { rc: RC.dims[1], sr: SR.dims[2], label: "Volume Hiring" },
    { rc: RC.dims[2], sr: SR.dims[1], label: "Sales Hiring" },
    { rc: RC.dims[3], sr: SR.dims[3], label: "SaaS Experience" },
    { rc: RC.dims[4], sr: SR.dims[6], label: "Education" },
    { rc: RC.dims[5], sr: null, label: "RC-Only Dim" },
    { rc: null, sr: SR.dims[4], label: "SR-Only Dim (Seniority)" },
    { rc: RC.dims[6], sr: SR.dims[7], label: "Tenure & Stability" },
    { rc: null, sr: SR.dims[5], label: "SR-Only Dim (Sourcing)" },
  ];

  return (
    <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", maxWidth: 1200, margin: "0 auto", padding: 16, background: "#F9FAFB", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", margin: 0 }}>Rubric Comparison</h1>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "4px 0 12px" }}>Recruiting Coordinator vs Senior Sales Recruiter — click any dimension to expand scoring criteria</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 6 }}>
          {["side-by-side", "differences", "weights"].map((v) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: view === v ? "#111" : "#E5E7EB", color: view === v ? "#fff" : "#374151" }}>
              {v === "side-by-side" ? "Side by Side" : v === "differences" ? "Key Differences" : "Weight Chart"}
            </button>
          ))}
          <button onClick={expandAll} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: 11, color: "#6B7280" }}>Expand All</button>
          <button onClick={collapseAll} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", cursor: "pointer", fontSize: 11, color: "#6B7280" }}>Collapse All</button>
        </div>
      </div>

      {/* Stats Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[RC, SR].map((role) => (
          <div key={role.shortName} style={{ background: role.bgLight, border: `2px solid ${role.color}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: role.color }}>{role.name}</div>
                <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{role.dims.length} base dims + {role.bonuses.length} bonus</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: role.color }}>{role.baseMax}</div>
                <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>BASE MAX</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {role.dims.map((d) => (
                <span key={d.num} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#fff", border: `1px solid ${role.color}33`, color: "#374151" }}>
                  D{d.num} {d.weight}×
                </span>
              ))}
              {role.bonuses.map((b, i) => (
                <span key={i} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, background: "#FEF3C7", border: "1px solid #FCD34D", color: "#92400E" }}>
                  B{i + 1} ×{b.mult}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-DQ Section */}
      {showDQ && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Auto-Disqualifiers</h3>
            <button onClick={() => setShowDQ(false)} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>hide</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6B7280", marginBottom: 4 }}>SHARED (both roles)</div>
              {sharedDQ.map((dq, i) => (
                <div key={i} style={{ fontSize: 12, padding: "3px 0", color: "#374151" }}>• {dq}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: RC.color, marginBottom: 4 }}>RC ONLY</div>
              {rcUniqueDQ.map((dq, i) => (
                <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: RC.bgLight, borderRadius: 4, marginBottom: 4, color: "#374151", border: `1px solid ${RC.color}44` }}>{dq.text}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: SR.color, marginBottom: 4 }}>SR ONLY</div>
              {srUniqueDQ.map((dq, i) => (
                <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: SR.bgLight, borderRadius: 4, marginBottom: 4, color: "#374151", border: `1px solid ${SR.color}44` }}>{dq.text}</div>
              ))}
            </div>
          </div>
        </div>
      )}
      {!showDQ && (
        <button onClick={() => setShowDQ(true)} style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", marginBottom: 8 }}>Show auto-DQ section</button>
      )}

      {/* Side by Side View */}
      {view === "side-by-side" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[{ role: RC, expanded: expandedRC, toggle: toggleRC }, { role: SR, expanded: expandedSR, toggle: toggleSR }].map(({ role, expanded, toggle }) => (
            <div key={role.shortName}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: role.color, marginBottom: 8, borderBottom: `2px solid ${role.color}`, paddingBottom: 4 }}>
                {role.name}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {role.dims.map((dim, i) => (
                  <DimCard key={i} dim={dim} color={role.color} bgLight={role.bgLight} expanded={expanded[i]} onToggle={() => toggle(i)} />
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 6 }}>BONUS DIMENSIONS</div>
                {role.bonuses.map((b, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 8px", background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{b.name}</span>
                    <span style={{ color: "#92400E", marginLeft: 8 }}>×{b.mult} additive (max +{b.maxBonus})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Differences View */}
      {view === "differences" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Agency DQ difference */}
          <div style={{ background: "#FEF2F2", border: "2px solid #F87171", borderRadius: 10, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#991B1B" }}>Biggest Difference: Agency Recruiters</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#fff", borderRadius: 6, padding: 10, border: `2px solid ${RC.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: RC.color, marginBottom: 4 }}>RC: AUTO-DQ</div>
                <div style={{ fontSize: 12, color: "#374151" }}>Pure agency staffing with no in-house experience → instant F</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 6, padding: 10, border: `2px solid ${SR.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: SR.color, marginBottom: 4 }}>SR: WELCOME</div>
                <div style={{ fontSize: 12, color: "#374151" }}>Agency recruiters who did full-cycle are strong candidates. Only bench sales/IT body shop is DQ'd.</div>
              </div>
            </div>
          </div>

          {/* Core philosophy */}
          <div style={{ background: "#fff", border: "2px solid #D1D5DB", borderRadius: 10, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700 }}>Core Philosophy: What Are We Measuring?</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 10, borderRadius: 6, background: RC.bgLight, border: `1px solid ${RC.color}44` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: RC.color }}>RC: "Can they COORDINATE a hiring process?"</div>
                <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>ATS proficiency, interview scheduling, candidate experience ops. Support role that keeps the machine running.</div>
              </div>
              <div style={{ padding: 10, borderRadius: 6, background: SR.bgLight, border: `1px solid ${SR.color}44` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: SR.color }}>SR: "Can they FIND and CLOSE talent?"</div>
                <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>Full-cycle ownership, creative sourcing, pipeline building, offer negotiation. Revenue-driving role.</div>
              </div>
            </div>
          </div>

          {/* Unique dimensions */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700 }}>Unique Dimensions (only in one rubric)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: RC.color, marginBottom: 6 }}>RC ONLY</div>
                <div style={{ padding: 8, background: RC.bgLight, borderRadius: 6, border: `1px solid ${RC.color}44` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Recruiting Ops & ATS <span style={{ color: "#9CA3AF" }}>0.6×</span></div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Greenhouse = auto 4. Process ownership, pipeline management, interview workflows.</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: SR.color, marginBottom: 6 }}>SR ONLY</div>
                <div style={{ padding: 8, background: SR.bgLight, borderRadius: 6, marginBottom: 6, border: `1px solid ${SR.color}44` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Full-Cycle Ownership <span style={{ color: "#9CA3AF" }}>5×</span></div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>THE defining dimension. Source → screen → interview → negotiate → close. Independently.</div>
                </div>
                <div style={{ padding: 8, background: SR.bgLight, borderRadius: 6, marginBottom: 6, border: `1px solid ${SR.color}44` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Recruiting Seniority <span style={{ color: "#9CA3AF" }}>2×</span></div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>3+ years required per JD. Measures career level, not just tenure at one job.</div>
                </div>
                <div style={{ padding: 8, background: SR.bgLight, borderRadius: 6, border: `1px solid ${SR.color}44` }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Sourcing Creativity <span style={{ color: "#9CA3AF" }}>1×</span></div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>Multi-channel: LinkedIn + Naukri + referrals + Boolean + unconventional.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Weight shifts */}
          <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 14 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700 }}>Weight Shifts on Shared Concepts</h3>
            {[
              { concept: "Sales Hiring", rcW: "3×", srW: "4×", note: "More important for SR — it's their primary job" },
              { concept: "High-Volume", rcW: "4×", srW: "3.5×", note: "Slightly less for SR — quality sourcing matters more than raw volume" },
              { concept: "Education", rcW: "0.7×", srW: "0.5×", note: "Even less for SR — track record trumps credentials at senior level" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: i < 2 ? "1px solid #F3F4F6" : "none" }}>
                <span style={{ fontSize: 13, fontWeight: 600, width: 120 }}>{row.concept}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: RC.color, width: 40, textAlign: "center" }}>{row.rcW}</span>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>→</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: SR.color, width: 40, textAlign: "center" }}>{row.srW}</span>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{row.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weights View */}
      {view === "weights" && (
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Weight Distribution Comparison</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 1fr 60px", gap: 8, padding: "4px 0", borderBottom: "2px solid #111" }}>
              <span style={{ fontSize: 11, fontWeight: 700 }}>DIMENSION</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: RC.color, textAlign: "center" }}>RC</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: RC.color, textAlign: "right" }}>Wtd Max</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: SR.color, textAlign: "center" }}>SR</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: SR.color, textAlign: "right" }}>Wtd Max</span>
            </div>
            {comparisons.map((comp, i) => {
              const rcW = comp.rc ? comp.rc.weight : null;
              const srW = comp.sr ? comp.sr.weight : null;
              const rcMax = comp.rc ? comp.rc.weight * comp.rc.max : 0;
              const srMax = comp.sr ? comp.sr.weight * comp.sr.max : 0;
              const maxBar = 15;
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 1fr 60px", gap: 8, padding: "6px 0", borderBottom: "1px solid #F3F4F6", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                    {comp.rc ? comp.rc.name : comp.sr.name}
                    {(!comp.rc || !comp.sr) && <span style={{ fontSize: 9, color: !comp.rc ? SR.color : RC.color, marginLeft: 4, fontWeight: 700 }}>UNIQUE</span>}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {rcW !== null ? (
                      <>
                        <div style={{ flex: 1, height: 16, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${(rcMax / maxBar) * 100}%`, height: "100%", background: RC.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{rcW}×</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ flex: 1, height: 16, background: "#F3F4F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, color: "#D1D5DB" }}>—</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: rcW !== null ? RC.color : "#D1D5DB", textAlign: "right" }}>{rcW !== null ? rcMax : "—"}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {srW !== null ? (
                      <div style={{ flex: 1, height: 16, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(srMax / maxBar) * 100}%`, height: "100%", background: SR.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{srW}×</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, height: 16, background: "#F3F4F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, color: "#D1D5DB" }}>—</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: srW !== null ? SR.color : "#D1D5DB", textAlign: "right" }}>{srW !== null ? srMax : "—"}</span>
                </div>
              );
            })}
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 1fr 60px", gap: 8, padding: "8px 0", borderTop: "2px solid #111", marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>BASE TOTAL</span>
              <span />
              <span style={{ fontSize: 14, fontWeight: 800, color: RC.color, textAlign: "right" }}>{RC.baseMax}</span>
              <span />
              <span style={{ fontSize: 14, fontWeight: 800, color: SR.color, textAlign: "right" }}>{SR.baseMax}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 60px 1fr 60px", gap: 8, padding: "4px 0" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>+ Max Bonus</span>
              <span />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E", textAlign: "right" }}>+10.4</span>
              <span />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E", textAlign: "right" }}>+10.4</span>
            </div>
          </div>
        </div>
      )}

      {/* Dual-eval footer */}
      <div style={{ marginTop: 16, background: "#ECFDF5", border: "2px solid #34D399", borderRadius: 10, padding: 14 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: "#065F46" }}>Dual-Eval Flow</h3>
        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>
          Each candidate is scored against <strong>both</strong> rubrics in a single CE invocation. The candidate is placed in whichever role produces the higher percentage score. Ties go to the priority role (set at pipeline start). DQ'd from one role but not the other → non-DQ role wins. DQ'd from both → written to primary output as F.
        </div>
      </div>
    </div>
  );
}
