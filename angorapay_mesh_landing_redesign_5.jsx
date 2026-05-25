import React from "react";
import { ArrowRight, Code2, Network, ShieldCheck } from "lucide-react";

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Flow", href: "#flow" },
  { label: "Infrastructure", href: "#developers" },
  { label: "Proof", href: "#proof-surface" },
];

const heroProofLine = [
  "provider trust",
  "route score",
  "policy gate",
  "payment receipt",
  "reconciliation trail",
];

const problemPoints = [
  "Which provider should the agent trust?",
  "Should this payment be allowed?",
  "Did the provider actually deliver?",
  "Can the final recommendation be audited later?",
];

const flowSteps = [
  {
    number: "01",
    title: "Mission",
    body: "A market agent submits a question with budget, trust, and proof requirements.",
  },
  {
    number: "02",
    title: "Discovery",
    body: "Angora discovers registered, preferred, provisional, and external providers.",
  },
  {
    number: "03",
    title: "Route score",
    body: "Providers are scored for mission fit, trust, cost, latency, proof support, and delivery quality.",
  },
  {
    number: "04",
    title: "Policy gate",
    body: "Weak routes, low-trust providers, repeated payment keys, and unsupported proof calls are blocked.",
  },
  {
    number: "05",
    title: "Payment + delivery",
    body: "Approved calls settle through Circle/x402-style rails and provider delivery is tracked.",
  },
  {
    number: "06",
    title: "Receipt + reconcile",
    body: "The payment, provider output, receipt, and recommendation are reconciled into an audit trail.",
  },
];

const tracks = [
  "Prediction-market intelligence",
  "Cross-venue arbitrage",
  "Social trading signals",
  "Perpetual futures agents",
  "Portfolio intelligence",
  "Provider proof workflows",
];

const infrastructureItems = [
  {
    title: "Gateway / SDK",
    body: "One integration point for agents to request paid intelligence before acting.",
  },
  {
    title: "Route Scorecard",
    body: "Scores mission fit, provider trust, proof support, cost, latency, delivery history, and reconciliation success.",
  },
  {
    title: "Policy Engine",
    body: "Trust thresholds, route score rules, budget limits, proof requirements, and duplicate-payment blocks.",
  },
  {
    title: "Payment Rail",
    body: "Labels calls as real_x402, arc_testnet, fallback, blocked, pending, failed, or local_proof.",
  },
  {
    title: "Proof Receipts",
    body: "Receipt ID, mission ID, provider ID, route score, policy verdict, amount, output hash, and linked recommendation.",
  },
  {
    title: "Workspace Controls",
    body: "Teams manage policies, budgets, API keys, provider access, receipts, traces, and audit logs.",
  },
];

const proofSnapshot = [
  { label: "Mission", value: "BTC market mispricing check" },
  { label: "Agent", value: "Prediction Market Intelligence" },
  { label: "Providers scanned", value: "7" },
  { label: "Approved", value: "OddsNode, SignalMesh, RiskLens, ProofSmith" },
  { label: "Blocked", value: "GreyAlpha · trust below threshold" },
  { label: "USDC routed", value: "0.013" },
  { label: "Receipts", value: "4 created" },
  { label: "Reconciliation", value: "payment + delivery matched" },
];

const proofTimeline = [
  { event: "providers.scanned", detail: "7 services evaluated" },
  { event: "route.scored", detail: "4 approved · 1 blocked" },
  { event: "payment.authorized", detail: "0.013 USDC routed" },
  { event: "provider.delivery", detail: "outputs received" },
  { event: "receipt.created", detail: "4 proof receipts" },
  { event: "reconciliation.checked", detail: "matched" },
];

const approvedJourneyPath =
  "M360 112 C360 168 360 216 360 282 C440 240 502 214 594 178 C590 264 548 337 505 394 C454 444 410 466 360 486 C282 484 206 470 132 410";

const proofReturnPath =
  "M132 410 C170 292 246 244 360 282 C360 168 360 132 360 112";

export function runAngoraLandingSelfTest() {
  const checks = [
    navItems.length === 4,
    navItems.every((item) => item.href.startsWith("#")),
    heroProofLine.length === 5,
    problemPoints.length === 4,
    flowSteps.length === 6,
    infrastructureItems.length === 6,
    proofSnapshot.length === 8,
    proofTimeline.length === 6,
    tracks.length === 6,
    approvedJourneyPath.startsWith("M360 112"),
    proofReturnPath.startsWith("M132 410"),
  ];

  return checks.every(Boolean);
}

function Badge({ children }) {
  return (
    <span className="inline-flex w-fit items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-700/80">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.45)]" />
      {children}
    </span>
  );
}

function MeshNode({ cx, cy, r, fill, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      {r > 5 ? (
        <circle cx={cx} cy={cy} r={r + 7} fill={fill} opacity="0.035" filter="url(#softNodeGlow)" />
      ) : null}
      <circle cx={cx} cy={cy} r={r} fill={fill} filter={r > 5 ? "url(#softNodeGlow)" : undefined} />
      {r > 5 ? <circle cx={cx} cy={cy} r={r + 3.5} stroke={fill} strokeOpacity="0.075" /> : null}
    </g>
  );
}

function MeshLabel({
  x,
  y,
  align = "middle",
  eyebrow,
  label,
  eyebrowClass = "fill-slate-400",
  labelClass = "fill-slate-800",
}) {
  return (
    <>
      <text
        x={x}
        y={y}
        textAnchor={align}
        className={`${eyebrowClass} text-[9px] font-semibold uppercase tracking-[0.22em]`}
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
      >
        {eyebrow}
      </text>
      <text
        x={x}
        y={y + 22}
        textAnchor={align}
        className={`${labelClass} text-[13px] font-semibold`}
        style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
      >
        {label}
      </text>
    </>
  );
}

function MeshVisual() {
  return (
    <div className="relative isolate min-h-[590px] overflow-hidden rounded-[2rem] bg-white/46 shadow-[0_24px_76px_rgba(15,42,61,0.06)] ring-1 ring-cyan-900/[0.028] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.105),transparent_36%),radial-gradient(circle_at_12%_20%,rgba(14,165,233,0.045),transparent_31%),radial-gradient(circle_at_84%_82%,rgba(45,212,191,0.065),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.95),rgba(235,248,252,0.66)_54%,rgba(246,251,253,0.96)_100%)]" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:radial-gradient(rgba(15,118,110,.5)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/20 to-transparent" />
      <div className="absolute inset-x-16 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-200/14 to-transparent" />
      <div className="absolute left-7 top-7 z-10 text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-300">
        Live intelligence route
      </div>

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 610" fill="none" aria-hidden="true">
        <defs>
          <filter id="softNodeGlow" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="quietPath" x1="360" y1="92" x2="132" y2="470" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="0.48" stopColor="#06b6d4" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>

          <radialGradient id="coreSoft" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(360 282) rotate(90) scale(68)">
            <stop stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#e0f7ff" />
            <stop offset="1" stopColor="#67e8f9" stopOpacity="0.12" />
          </radialGradient>

          <radialGradient id="signalDot" cx="0" cy="0" r="1">
            <stop stopColor="#ffffff" />
            <stop offset="0.5" stopColor="#67e8f9" stopOpacity="0.86" />
            <stop offset="1" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="360" cy="292" rx="236" ry="188" stroke="#0e7490" strokeOpacity="0.022" />
        <ellipse cx="360" cy="292" rx="164" ry="130" stroke="#0e7490" strokeOpacity="0.03" />
        <ellipse cx="360" cy="292" rx="96" ry="76" stroke="#0e7490" strokeOpacity="0.035" />

        <path id="approvedJourney" d={approvedJourneyPath} stroke="url(#quietPath)" strokeWidth="0.45" strokeOpacity="0.035" strokeLinecap="round" />
        <path id="proofReturn" d={proofReturnPath} stroke="url(#quietPath)" strokeWidth="0.4" strokeOpacity="0.025" strokeLinecap="round" />
        <path d="M360 282 C446 300 520 310 632 308" stroke="#64748b" strokeOpacity="0.032" strokeWidth="0.5" strokeDasharray="3 11" />
        <path d="M360 282 C280 218 205 180 112 176" stroke="#ef4444" strokeOpacity="0.032" strokeWidth="0.5" strokeDasharray="2 11" />

        <g opacity="0.82">
          <circle r="4.8" fill="url(#signalDot)" filter="url(#softNodeGlow)">
            <animateMotion dur="10.8s" repeatCount="indefinite" path={approvedJourneyPath} />
            <animate attributeName="opacity" values="0;0.8;0.8;0" keyTimes="0;0.08;0.9;1" dur="10.8s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="url(#signalDot)" filter="url(#softNodeGlow)">
            <animateMotion dur="10.8s" begin="3.6s" repeatCount="indefinite" path={approvedJourneyPath} />
            <animate attributeName="opacity" values="0;0.48;0.48;0" keyTimes="0;0.08;0.86;1" dur="10.8s" begin="3.6s" repeatCount="indefinite" />
          </circle>
          <circle r="2.2" fill="#ffffff" opacity="0.32">
            <animateMotion dur="10.8s" begin="6.8s" repeatCount="indefinite" path={proofReturnPath} />
            <animate attributeName="opacity" values="0;0.38;0.38;0" keyTimes="0;0.15;0.75;1" dur="10.8s" begin="6.8s" repeatCount="indefinite" />
          </circle>
        </g>

        <g opacity="0.38">
          <circle cx="360" cy="112" r="13" fill="none" stroke="#0ea5e9" strokeOpacity="0">
            <animate attributeName="r" values="8;17;8" dur="10.8s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.16;0" dur="10.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="360" cy="282" r="52" fill="none" stroke="#06b6d4" strokeOpacity="0">
            <animate attributeName="r" values="42;56;42" dur="10.8s" begin="1.35s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.1;0" dur="10.8s" begin="1.35s" repeatCount="indefinite" />
          </circle>
          <circle cx="594" cy="178" r="13" fill="none" stroke="#10b981" strokeOpacity="0">
            <animate attributeName="r" values="8;18;8" dur="10.8s" begin="2.55s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.13;0" dur="10.8s" begin="2.55s" repeatCount="indefinite" />
          </circle>
          <circle cx="505" cy="394" r="13" fill="none" stroke="#22c55e" strokeOpacity="0">
            <animate attributeName="r" values="8;18;8" dur="10.8s" begin="4s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.13;0" dur="10.8s" begin="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="360" cy="486" r="13" fill="none" stroke="#06b6d4" strokeOpacity="0">
            <animate attributeName="r" values="8;18;8" dur="10.8s" begin="5.25s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.13;0" dur="10.8s" begin="5.25s" repeatCount="indefinite" />
          </circle>
          <circle cx="132" cy="410" r="13" fill="none" stroke="#14b8a6" strokeOpacity="0">
            <animate attributeName="r" values="8;18;8" dur="10.8s" begin="6.25s" repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0;0.15;0" dur="10.8s" begin="6.25s" repeatCount="indefinite" />
          </circle>
        </g>

        <circle cx="360" cy="282" r="63" fill="url(#coreSoft)" filter="url(#softNodeGlow)" />
        <circle cx="360" cy="282" r="43" fill="rgba(255,255,255,0.9)" stroke="#67e8f9" strokeOpacity="0.22" />
        <circle cx="360" cy="282" r="28" fill="rgba(224,247,255,0.55)" stroke="#06b6d4" strokeOpacity="0.12" />
        <circle cx="360" cy="282" r="4.8" fill="#0891b2" filter="url(#softNodeGlow)" />

        <MeshNode cx={360} cy={112} r={7} fill="#0ea5e9" opacity={0.78} />
        <MeshNode cx={594} cy={178} r={8} fill="#10b981" opacity={0.82} />
        <MeshNode cx={505} cy={394} r={8} fill="#22c55e" opacity={0.82} />
        <MeshNode cx={360} cy={486} r={8} fill="#06b6d4" opacity={0.82} />
        <MeshNode cx={132} cy={410} r={8} fill="#14b8a6" opacity={0.82} />
        <MeshNode cx={632} cy={308} r={4.5} fill="#64748b" opacity={0.18} />
        <MeshNode cx={112} cy={176} r={4.5} fill="#ef4444" opacity={0.16} />
        <MeshNode cx={226} cy={130} r={2.2} fill="#0ea5e9" opacity={0.16} />
        <MeshNode cx={502} cy={126} r={2.2} fill="#0ea5e9" opacity={0.16} />
        <MeshNode cx={224} cy={494} r={2.2} fill="#14b8a6" opacity={0.18} />
        <MeshNode cx={580} cy={454} r={2.2} fill="#0ea5e9" opacity={0.14} />

        <MeshLabel x={360} y={72} eyebrow="Agent asks" label="Market question" />
        <MeshLabel x={632} y={142} align="end" eyebrow="Mesh selects" label="Trusted provider" eyebrowClass="fill-emerald-700/65" />
        <MeshLabel x={545} y={418} align="start" eyebrow="Policy approves" label="Payment gate" eyebrowClass="fill-emerald-700/65" />
        <MeshLabel x={360} y={526} eyebrow="Call settles" label="Arc / x402" eyebrowClass="fill-cyan-700/65" />
        <MeshLabel x={96} y={438} align="start" eyebrow="Proof returns" label="Proof-backed answer" eyebrowClass="fill-teal-700/65" />

        <text x="360" y="274" textAnchor="middle" className="fill-slate-950 text-[16px] font-semibold" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
          Angora Mesh
        </text>
        <text x="360" y="300" textAnchor="middle" className="fill-cyan-700/72 text-[9px] font-semibold uppercase tracking-[0.22em]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
          discover · score · block · pay · prove
        </text>
      </svg>
    </div>
  );
}

function Feature({ title, body }) {
  return (
    <div className="group relative py-2">
      <div className="absolute -left-4 top-3 h-1.5 w-1.5 rounded-full bg-cyan-400/60 transition group-hover:bg-cyan-400" />
      <p className="text-sm font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500/80">{body}</p>
    </div>
  );
}

function FlowStep({ number, title, body }) {
  return (
    <div className="relative py-2">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-cyan-700">{number}</p>
      <p className="mt-3 text-base font-medium text-slate-950">{title}</p>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-500/90">{body}</p>
    </div>
  );
}

export default function AngoraPayMeshLanding() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6fbfd] text-slate-950 selection:bg-cyan-200/70">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_18%,rgba(59,130,246,0.09),transparent_32%),linear-gradient(180deg,#f8fdff_0%,#f3f8fb_48%,#f8fbfd_100%)]" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)] ring-1 ring-white/40">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <p className="text-base font-medium tracking-[-0.02em]">AngoraPay Mesh</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">Market-agent routing and proof</p>
          </div>
        </div>

        <nav className="hidden items-center gap-7 rounded-full border border-slate-200/45 bg-white/45 px-4 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.025)] backdrop-blur-md md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>

        <button className="text-sm font-medium text-slate-950 transition hover:text-cyan-700">Sign in</button>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-28 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:pt-18">
        <div>
          <Badge>Paid-intelligence routing and proof for market agents</Badge>

          <h1 className="mt-8 max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-0.038em] text-slate-950 md:text-6xl lg:text-[5rem]">
            Buy trusted market intelligence before agents act.
          </h1>

          <p className="mt-8 max-w-xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
            AngoraPay Mesh lets market agents discover paid providers, score routes, block weak services, pay approved calls through Circle/x402, and prove which intelligence supported the final recommendation.
          </p>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-500">
            Circle enables payment. Angora decides, routes, blocks, proves, and reconciles.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-medium text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-900">
              Run market mission <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/40 bg-white/34 px-6 py-4 text-sm font-medium text-slate-600 shadow-none backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/70 hover:text-cyan-800">
              View Gateway <Code2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-12 border-t border-slate-200/30 pt-6">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
              {heroProofLine.map((item, index) => (
                <React.Fragment key={item}>
                  <span>{item}</span>
                  {index < heroProofLine.length - 1 ? <span className="text-cyan-500/50">/</span> : null}
                </React.Fragment>
              ))}
            </div>
            <p className="mt-4 text-xs font-medium leading-6 text-slate-500">
              Example mission: 7 providers scanned · 4 approved · 1 blocked · 0.013 USDC routed · reconciliation matched
            </p>
          </div>
        </div>

        <MeshVisual />
      </section>

      <section id="problem" className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <Badge>Problem</Badge>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              The problem is not payment. The problem is trusted paid intelligence.
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600">
              Market agents can call APIs and pay providers, but they still need to know who to trust, what to block, whether delivery happened, and what evidence supports the recommendation.
            </p>
            <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-cyan-800/75">
              Angora answers those questions before money leaves the agent workflow.
            </p>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
              It is not another AI trader; it is the trust, routing, proof, and reconciliation layer around paid market intelligence.
            </p>
          </div>

          <div className="space-y-5 border-l border-cyan-200/60 pl-7">
            {problemPoints.map((point) => (
              <div key={point} className="relative">
                <span className="absolute -left-[31px] top-2 h-2 w-2 rounded-full bg-cyan-500/70 shadow-[0_0_14px_rgba(6,182,212,0.28)]" />
                <p className="text-base font-medium leading-7 text-slate-700">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="flow" className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <Badge>The Angora flow</Badge>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              Mission to recommendation, with proof in the middle.
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600">
              Angora turns a market mission into a scored, policy-gated, paid, delivered, receipted, and reconciled intelligence trail.
            </p>
          </div>

          <div className="relative grid gap-x-8 gap-y-10 md:grid-cols-3">
            <div className="absolute left-0 right-0 top-5 hidden h-px bg-gradient-to-r from-cyan-100/70 via-slate-200/70 to-cyan-100/40 md:block" />
            {flowSteps.map((step) => (
              <FlowStep key={step.title} number={step.number} title={step.title} body={step.body} />
            ))}
          </div>
        </div>
      </section>

      <section id="developers" className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <Badge>Developer infrastructure</Badge>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              Circle enables payment. Angora governs the paid-intelligence workflow.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {infrastructureItems.map((item) => (
              <Feature key={item.title} title={item.title} body={item.body} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Badge>Built for market-agent tracks</Badge>
            <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              Built for agents that need paid signals before action.
            </h2>
            <p className="mt-6 text-base font-medium leading-8 text-slate-600">
              Prediction markets, arbitrage, perpetual futures, social trading, portfolio management, paid signal providers, and proof workflows.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-5 text-sm font-medium text-slate-700 lg:pt-10">
            {tracks.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 transition hover:text-cyan-800">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/80 shadow-[0_0_14px_rgba(6,182,212,0.38)]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="proof-surface" className="mx-auto max-w-7xl px-6 pb-28">
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/55 bg-white/50 p-8 shadow-[0_24px_80px_rgba(15,42,61,0.055)] backdrop-blur-xl md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_24%,rgba(34,211,238,0.10),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.78),transparent_42%)]" />

          <div className="relative grid items-start gap-12 lg:grid-cols-[0.74fr_1.26fr]">
            <div>
              <Badge>Concrete proof surface</Badge>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
                Every paid signal should leave an inspectable trail.
              </h2>
              <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600">
                The proof surface makes the operational truth visible: what was bought, who was paid, why they were selected, what was blocked, whether delivery matched, and which proof receipt supports the recommendation.
              </p>

              <div className="mt-8 space-y-4 border-l border-cyan-200/70 pl-6">
                {proofTimeline.map((item) => (
                  <div key={item.event} className="relative">
                    <span className="absolute -left-[29px] top-2 h-2 w-2 rounded-full bg-cyan-500/70 shadow-[0_0_14px_rgba(6,182,212,0.28)]" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{item.event}</p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.65rem] border border-slate-200/70 bg-white/74 p-5 shadow-[0_20px_60px_rgba(15,42,61,0.065)] backdrop-blur-md">
              <div className="flex flex-col gap-4 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-950">BTC prediction-market mission</p>
                    <p className="text-xs font-medium text-slate-400">mission_7f32 · recommendation.monitor.created</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                    reconciled
                  </span>
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-700">
                    4 receipts
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {proofSnapshot.map((item) => (
                  <div key={item.label} className="border-b border-slate-200/55 pb-3 last:border-b sm:last:border-b sm:[&:nth-last-child(-n+2)]:border-b-0">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-cyan-200/55 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-700/75">Recommendation</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">Monitor — signal strength not yet sufficient for execution.</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-cyan-700/75">Output hash</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">0x7ac4...91ef</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
