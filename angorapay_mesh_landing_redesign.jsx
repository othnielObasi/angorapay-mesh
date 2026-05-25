import React from "react";
import { ArrowRight, Code2, Network, ShieldCheck } from "lucide-react";

const navItems = ["Product", "Developers", "Proof"];

const heroProofLine = [
  "select trusted provider",
  "gate payment",
  "return proof-backed answer",
];

const flowSteps = [
  {
    number: "01",
    title: "Ask",
    body: "The agent submits a market question with budget and proof requirements.",
  },
  {
    number: "02",
    title: "Select",
    body: "Angora chooses the provider path that best matches trust, cost, and policy.",
  },
  {
    number: "03",
    title: "Gate + settle",
    body: "Payment happens only after the request passes the configured policy checks.",
  },
  {
    number: "04",
    title: "Return proof",
    body: "The answer returns with proof, settlement receipt, and trace history.",
  },
];

const tracks = [
  "Perpetual futures trading agents",
  "Prediction market intelligence",
  "Adaptive portfolio management",
  "Cross-platform arbitrage",
  "Social trading signals",
  "Provider proof workflows",
];

const proofSnapshot = [
  { label: "Provider", value: "Signal Desk A" },
  { label: "Policy", value: "passed" },
  { label: "Settlement", value: "$0.009 USDC" },
  { label: "Proof", value: "receipt + trace" },
];

const approvedJourneyPath =
  "M360 112 C360 168 360 216 360 282 C440 240 502 214 594 178 C590 264 548 337 505 394 C454 444 410 466 360 486 C282 484 206 470 132 410";

const proofReturnPath =
  "M132 410 C170 292 246 244 360 282 C360 168 360 132 360 112";

export function runAngoraLandingSelfTest() {
  const checks = [
    navItems.length === 3,
    heroProofLine.length === 3,
    flowSteps.length === 4,
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
        <circle
          cx={cx}
          cy={cy}
          r={r + 7}
          fill={fill}
          opacity="0.035"
          filter="url(#softNodeGlow)"
        />
      ) : null}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        filter={r > 5 ? "url(#softNodeGlow)" : undefined}
      />
      {r > 5 ? (
        <circle cx={cx} cy={cy} r={r + 3.5} stroke={fill} strokeOpacity="0.075" />
      ) : null}
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

          <radialGradient
            id="coreSoft"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(360 282) rotate(90) scale(68)"
          >
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

        <path
          id="approvedJourney"
          d={approvedJourneyPath}
          stroke="url(#quietPath)"
          strokeWidth="0.45"
          strokeOpacity="0.035"
          strokeLinecap="round"
        />
        <path
          id="proofReturn"
          d={proofReturnPath}
          stroke="url(#quietPath)"
          strokeWidth="0.4"
          strokeOpacity="0.025"
          strokeLinecap="round"
        />
        <path
          d="M360 282 C446 300 520 310 632 308"
          stroke="#64748b"
          strokeOpacity="0.032"
          strokeWidth="0.5"
          strokeDasharray="3 11"
        />
        <path
          d="M360 282 C280 218 205 180 112 176"
          stroke="#ef4444"
          strokeOpacity="0.032"
          strokeWidth="0.5"
          strokeDasharray="2 11"
        />

        <g opacity="0.82">
          <circle r="4.8" fill="url(#signalDot)" filter="url(#softNodeGlow)">
            <animateMotion dur="10.8s" repeatCount="indefinite" path={approvedJourneyPath} />
            <animate
              attributeName="opacity"
              values="0;0.8;0.8;0"
              keyTimes="0;0.08;0.9;1"
              dur="10.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="url(#signalDot)" filter="url(#softNodeGlow)">
            <animateMotion dur="10.8s" begin="3.6s" repeatCount="indefinite" path={approvedJourneyPath} />
            <animate
              attributeName="opacity"
              values="0;0.48;0.48;0"
              keyTimes="0;0.08;0.86;1"
              dur="10.8s"
              begin="3.6s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="2.2" fill="#ffffff" opacity="0.32">
            <animateMotion dur="10.8s" begin="6.8s" repeatCount="indefinite" path={proofReturnPath} />
            <animate
              attributeName="opacity"
              values="0;0.38;0.38;0"
              keyTimes="0;0.15;0.75;1"
              dur="10.8s"
              begin="6.8s"
              repeatCount="indefinite"
            />
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

        <text
          x="360"
          y="274"
          textAnchor="middle"
          className="fill-slate-950 text-[16px] font-semibold"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
        >
          Angora Mesh
        </text>
        <text
          x="360"
          y="300"
          textAnchor="middle"
          className="fill-cyan-700/72 text-[9px] font-semibold uppercase tracking-[0.22em]"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}
        >
          select · gate · settle · prove
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
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
              {item}
            </a>
          ))}
        </nav>

        <button className="text-sm font-medium text-slate-950 transition hover:text-cyan-700">Sign in</button>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-28 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:pt-18">
        <div>
          <Badge>Policy-gated paid intelligence for market agents</Badge>

          <h1 className="mt-8 max-w-3xl text-5xl font-extrabold leading-[1.04] tracking-[-0.038em] text-slate-950 md:text-6xl lg:text-[5rem]">
            Paid market intelligence, routed before agents act.
          </h1>

          <p className="mt-8 max-w-xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
            One API for market agents to select trusted providers, enforce policy before payment, settle approved calls, and return proof-backed answers.
          </p>
          <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-slate-500">
            Built for the moment between a market question and an autonomous action — where trust, cost, payment, and auditability matter.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button className="group inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-medium text-white shadow-[0_20px_55px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-900">
              View product <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/40 bg-white/34 px-6 py-4 text-sm font-medium text-slate-600 shadow-none backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/70 hover:text-cyan-800">
              Developer docs <Code2 className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200/30 pt-6 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400">
            {heroProofLine.map((item, index) => (
              <React.Fragment key={item}>
                <span>{item}</span>
                {index < heroProofLine.length - 1 ? <span className="text-cyan-500/50">/</span> : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <MeshVisual />
      </section>

      <section id="product" className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Badge>First mission</Badge>
            <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              From market question to proof-backed answer.
            </h2>
            <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600">
              The product story stays simple: ask, select the provider, gate the payment, then return an answer with proof, receipt, and trace.
            </p>
          </div>

          <div className="relative grid gap-9 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-[22px] hidden h-px bg-gradient-to-r from-cyan-100/60 via-slate-200/60 to-cyan-100/40 md:block" />
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
              One API for governed paid signal calls.
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            <Feature title="Agent API" body="A market agent calls Angora before consuming paid intelligence." />
            <Feature title="Payment rail" body="Approved provider calls settle through Arc/x402-style payment flows." />
            <Feature title="Proof layer" body="Each answer carries proof, receipt, selected route, and provider evidence." />
          </div>
        </div>
      </section>

      <section id="proof" className="mx-auto max-w-7xl border-t border-slate-200/55 px-6 py-24">
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <Badge>Built for market-agent tracks</Badge>
            <p className="mt-6 text-base font-medium leading-8 text-slate-600">
              Prediction markets, arbitrage, perpetual futures, social trading, portfolio management, paid signal providers, and proof workflows.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-10 gap-y-5 text-sm font-medium text-slate-700">
            {tracks.map((item) => (
              <span key={item} className="inline-flex items-center gap-2 transition hover:text-cyan-800">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/80 shadow-[0_0_14px_rgba(6,182,212,0.38)]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-28">
        <div className="grid items-center gap-12 rounded-[2rem] border border-slate-200/55 bg-white/48 p-8 shadow-[0_24px_80px_rgba(15,42,61,0.055)] backdrop-blur-xl md:p-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <Badge>Proof surface</Badge>
            <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[1.12] tracking-[-0.028em] text-slate-950 md:text-[2.75rem]">
              Every paid answer has an inspectable trail.
            </h2>
            <p className="mt-5 max-w-xl text-base font-medium leading-8 text-slate-600">
              Angora is designed to make the selected provider, policy result, settlement, and proof visible after every intelligence call.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200/65 bg-white/70 p-4 shadow-[0_18px_55px_rgba(15,42,61,0.06)]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-950">Proof receipt</p>
                  <p className="text-xs font-medium text-slate-400">intelligence.route.confirmed</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-700">
                passed
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {proofSnapshot.map((item) => (
                <div key={item.label} className="rounded-2xl bg-slate-50/75 px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
