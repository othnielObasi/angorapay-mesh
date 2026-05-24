import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Code2,
  FileCheck2,
  Gauge,
  Globe2,
  LineChart,
  Play,
  Route,
  Search,
  Settings2,
  ShieldCheck,
  Store,
  UploadCloud,
  WalletCards,
} from "lucide-react";

const APP_NAME = "AngoraPay Mesh";

const tabs = [
  { id: "run", label: "Live Demo", icon: Gauge },
  { id: "market", label: "Marketplace", icon: Store },
  { id: "scorecard", label: "Route Scorecard", icon: ShieldCheck },
  { id: "policy", label: "Policy", icon: Settings2 },
  { id: "providers", label: "Providers", icon: UploadCloud },
  { id: "history", label: "Execution History", icon: Activity },
  { id: "proof", label: "Proof", icon: FileCheck2 },
  { id: "metrics", label: "Submission Metrics", icon: BarChart3 },
  { id: "developers", label: "Developers", icon: Code2 },
];

const rfpAreas = [
  "Perpetual Futures Trading Agent",
  "Prediction Market Trader Intelligence",
  "Prediction Market Verticals",
  "Adaptive Portfolio Manager",
  "Cross-Platform Arbitrage Agent",
  "Social Trading Intelligence",
];

const marketServices = [
  {
    id: "svc-odds",
    name: "Prediction Market Odds API",
    provider: "OddsNode",
    price: 0.004,
    category: "odds",
    trust: 96,
    latency: "260ms",
    proof: true,
    status: "approved",
    score: 96,
    reason: "Best route for live odds, liquidity depth, and market drift detection.",
  },
  {
    id: "svc-news",
    name: "News Sentiment Feed",
    provider: "SignalMesh",
    price: 0.003,
    category: "sentiment",
    trust: 92,
    latency: "340ms",
    proof: true,
    status: "approved",
    score: 92,
    reason: "Verified news and sentiment feed with signed delivery metadata.",
  },
  {
    id: "svc-risk",
    name: "Execution Risk Check",
    provider: "RiskLens",
    price: 0.005,
    category: "risk",
    trust: 94,
    latency: "410ms",
    proof: true,
    status: "approved",
    score: 94,
    reason: "Strong volatility, downside-risk, and policy discipline score.",
  },
  {
    id: "svc-social",
    name: "Social Trading Intelligence",
    provider: "CrowdAlpha",
    price: 0.004,
    category: "social",
    trust: 88,
    latency: "520ms",
    proof: true,
    status: "approved",
    score: 88,
    reason: "Useful social signal with acceptable trust and proof support.",
  },
  {
    id: "svc-arb",
    name: "Cross-Venue Price Feed",
    provider: "VenueScan",
    price: 0.006,
    category: "arbitrage",
    trust: 90,
    latency: "295ms",
    proof: true,
    status: "approved",
    score: 90,
    reason: "Good fit for cross-platform pricing and opportunity checks.",
  },
  {
    id: "svc-proof",
    name: "Proof Bundle Writer",
    provider: "ProofSmith",
    price: 0.001,
    category: "proof",
    trust: 98,
    latency: "180ms",
    proof: true,
    status: "approved",
    score: 98,
    reason: "Required receipt, output hash, and reconciliation proof writer.",
  },
  {
    id: "svc-grey",
    name: "Unverified Alpha Feed",
    provider: "GreyAlpha",
    price: 0.002,
    category: "alpha",
    trust: 41,
    latency: "230ms",
    proof: false,
    status: "blocked",
    score: 41,
    reason: "Blocked because trust is below threshold and proof is missing.",
  },
];

const selectedRun = [
  { service: "Prediction Market Odds API", provider: "OddsNode", amount: 0.004, receipt: "ang_rcpt_9013", status: "settled", mode: "real_x402", score: 96 },
  { service: "News Sentiment Feed", provider: "SignalMesh", amount: 0.003, receipt: "ang_rcpt_9014", status: "pending", mode: "arc_testnet", score: 92 },
  { service: "Execution Risk Check", provider: "RiskLens", amount: 0.005, receipt: "ang_rcpt_9015", status: "pending", mode: "arc_testnet", score: 94 },
  { service: "Proof Bundle Writer", provider: "ProofSmith", amount: 0.001, receipt: "ang_rcpt_9016", status: "stored", mode: "local_proof", score: 98 },
];

const runSteps = [
  ["Market mission", "Prediction agent evaluates a +EV BTC election-odds opportunity before taking a market action."],
  ["Service discovery", "Find odds, sentiment, risk, social, arbitrage, and proof services that support Circle/x402 on Arc."],
  ["Route scorecard", "Rank providers by mission fit, trust, price, proof completeness, latency, and delivery quality."],
  ["Mission policy", "Block GreyAlpha and approve trusted providers under the 0.05 USDC mission budget."],
  ["Circle/x402 payment", "Approved micro-payments are authorized in USDC through Circle/x402 with Arc settlement context."],
  ["Proof + history", "Store receipt, route score, output hash, settlement state, execution mode, and history row."],
];

const proofRows = [
  ["receipt_id", "ang_rcpt_9013"],
  ["agent_id", "prediction-agent-01"],
  ["mission_id", "prediction-market-intel-demo"],
  ["agent_intent", "evaluate +EV BTC election-odds market"],
  ["service_id", "prediction-market-odds"],
  ["provider_id", "oddsnode"],
  ["angora_role", "mission-aware trust, routing, and proof layer"],
  ["policy_status", "approved"],
  ["route_score", "96 / 100"],
  ["blocked_provider", "greyalpha: low trust and proof missing"],
  ["payment_provider", "Circle"],
  ["payment_rail", "x402"],
  ["asset", "USDC"],
  ["network", "Arc"],
  ["payment_reference", "x402_arc_ref_77fa"],
  ["execution_mode", "real_x402"],
  ["settlement_status", "settled"],
  ["output_hash", "sha256:8f42..."],
  ["reconciliation_tag", "prediction_market.intelligence.odds"],
];

const policyRules = [
  ["Max mission spend", "0.05 USDC"],
  ["Allowed categories", "Odds, Sentiment, Risk, Social, Arbitrage, Proof"],
  ["Minimum provider trust", "85 / 100"],
  ["Minimum route score", "80 / 100"],
  ["Proof required", "true"],
  ["Payment rail", "Circle/x402 on Arc"],
  ["Idempotency", "required per paid call"],
  ["Blocked provider classes", "Unverified, no-proof, low-trust"],
];

const providerOnboarding = [
  ["Register market service", "Provider submits category, x402 endpoint, USDC price, proof fields, Arc support, and delivery SLA."],
  ["Validate delivery contract", "Angora checks response schema, timeout behaviour, proof support, and metadata completeness."],
  ["Assign trust profile", "Provider receives a scorecard across policy compliance, cost discipline, proof completeness, and quality."],
  ["Receive routed demand", "Qualified market-agent requests are routed when mission policy, trust, and price constraints match."],
];

const routeCandidates = [
  { provider: "OddsNode", service: "Prediction Market Odds API", missionFit: 97, policy: 100, cost: 94, proof: 100, delivery: 93, routeScore: 96, verdict: "selected", reason: "Best trust/proof/cost fit for odds intelligence." },
  { provider: "SignalMesh", service: "News Sentiment Feed", missionFit: 91, policy: 100, cost: 96, proof: 96, delivery: 88, routeScore: 92, verdict: "approved", reason: "Strong sentiment support and proof-backed output." },
  { provider: "RiskLens", service: "Execution Risk Check", missionFit: 94, policy: 100, cost: 90, proof: 100, delivery: 91, routeScore: 94, verdict: "approved", reason: "Strong risk discipline before market action." },
  { provider: "GreyAlpha", service: "Unverified Alpha Feed", missionFit: 62, policy: 20, cost: 96, proof: 0, delivery: 45, routeScore: 41, verdict: "blocked", reason: "Low trust and no proof support." },
];

const executionHistory = [
  { time: "12:04:31", agent: "prediction-agent-01", mission: "BTC odds", service: "Odds API", provider: "OddsNode", score: 96, amount: 0.004, status: "settled", mode: "real_x402", receipt: "ang_rcpt_9013" },
  { time: "12:05:10", agent: "prediction-agent-01", mission: "BTC odds", service: "Sentiment", provider: "SignalMesh", score: 92, amount: 0.003, status: "pending", mode: "arc_testnet", receipt: "ang_rcpt_9014" },
  { time: "12:05:44", agent: "prediction-agent-01", mission: "BTC odds", service: "Risk Check", provider: "RiskLens", score: 94, amount: 0.005, status: "pending", mode: "arc_testnet", receipt: "ang_rcpt_9015" },
  { time: "12:06:02", agent: "prediction-agent-01", mission: "BTC odds", service: "Alpha Feed", provider: "GreyAlpha", score: 41, amount: 0, status: "blocked", mode: "blocked", receipt: "policy_block_22" },
];

const submissionMetrics = [
  ["Users onboarded", "14"],
  ["Missions created", "38"],
  ["Gateway calls", "91"],
  ["Paid service calls", "67"],
  ["Receipts created", "67"],
  ["Total USDC routed", "0.431"],
  ["Real x402 calls", "18"],
  ["Arc testnet calls", "46"],
  ["Fallback calls", "3"],
  ["Blocked calls", "11"],
  ["Providers used", "6"],
  ["RFP coverage", "6 / 6"],
];

const developerExamples = {
  sdk: `npm install @angorapay/sdk

import { AngoraPay } from '@angorapay/sdk';

const angora = new AngoraPay({
  apiKey: process.env.ANGORA_API_KEY,
  gatewayUrl: process.env.ANGORA_GATEWAY_URL,
});

const result = await angora.runMarketMission({
  missionId: 'prediction-market-intel-demo',
  agentId: 'prediction-agent-01',
  intent: 'evaluate +EV BTC election-odds market',
  maxSpendUSDC: '0.05',
  allowedCategories: ['odds', 'sentiment', 'risk', 'proof'],
  minProviderTrust: 85,
  requiredProof: true,
});`,
  gateway: `POST /v1/angora/gateway/call
Authorization: Bearer ang_live_xxxxx
Idempotency-Key: mission-001-odds-call-001

{
  "agent_id": "prediction-agent-01",
  "mission_id": "prediction-market-intel-demo",
  "intent": "evaluate +EV BTC election-odds market",
  "max_spend_usdc": "0.05",
  "allowed_categories": ["odds", "sentiment", "risk", "proof"],
  "min_provider_trust": 85,
  "required_proof": true
}`,
  provider: `POST /v1/angora/providers/register

{
  "provider_id": "oddsnode",
  "service_name": "Prediction Market Odds API",
  "x402_endpoint": "https://oddsnode.example/x402",
  "categories": ["odds", "prediction_markets"],
  "price_usdc": "0.004",
  "proof_supported": true,
  "arc_supported": true
}`,
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function approvedServices(items) {
  return items.filter((item) => item.status === "approved");
}

function blockedServices(items) {
  return items.filter((item) => item.status === "blocked");
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price || item.amount || 0), 0);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`${path} failed with ${response.status}`);
  return response.json();
}

async function loadLiveSnapshot() {
  const [dashboard, services, receipts] = await Promise.all([
    api("/v1/angora/dashboard/summary"),
    api("/v1/angora/services/search?max_price=1&require_verified=false"),
    api("/v1/angora/receipts"),
  ]);
  return {
    dashboard,
    services: services.services || [],
    receipts: receipts.receipts || [],
  };
}

function runSelfTests() {
  console.assert(tabs.length === 9, "Angora UI should expose nine workspace tabs");
  console.assert(new Set(tabs.map((tab) => tab.id)).size === tabs.length, "tab IDs should be unique");
  console.assert(approvedServices(marketServices).length === 6, "six market services should be approved");
  console.assert(blockedServices(marketServices).length === 1, "one market service should be blocked");
  console.assert(Math.abs(calculateTotal(selectedRun) - 0.013) < 0.000001, "selected run cost should equal 0.013 USDC");
  console.assert(runSteps.length === 6, "live run should show six production steps");
  console.assert(proofRows.some(([key, value]) => key === "network" && value === "Arc"), "proof must include Arc network");
  console.assert(proofRows.some(([key, value]) => key === "asset" && value === "USDC"), "proof must include USDC asset");
  console.assert(proofRows.some(([key, value]) => key === "payment_provider" && value === "Circle"), "proof must identify Circle as payment provider");
  console.assert(policyRules.some(([key]) => key === "Minimum route score"), "policy must include route-score gate");
  console.assert(rfpAreas.length === 6, "UI should cover all six AngoraPay Mesh RFP areas");
  console.assert(routeCandidates.some((candidate) => candidate.verdict === "blocked"), "scorecard should show a blocked provider");
  console.assert(executionHistory.length >= 4, "execution history should show delivered and blocked calls");
  console.assert(submissionMetrics.some(([key]) => key === "Total USDC routed"), "submission metrics should include volume");
  console.assert(Object.values(developerExamples).every((value) => typeof value === "string" && value.length > 20), "developer examples should be complete strings");
}

runSelfTests();

function Pill({ children, tone = "neutral", compact = false }) {
  const toneClass = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-700 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    blue: "bg-sky-50 text-sky-700 ring-sky-200",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone] || "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={cx("inline-flex items-center rounded-full font-black ring-1", compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs", toneClass)}>
      {children}
    </span>
  );
}

function Background({ children }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#F8FAFC_0%,#EEF6F8_48%,#F8FAFC_100%)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function Glass({ children, className = "" }) {
  return (
    <div className={cx("rounded-lg border border-slate-200/80 bg-white/80 shadow-2xl shadow-slate-200/60 backdrop-blur-xl", className)}>
      {children}
    </div>
  );
}

function Header({ mode, setMode, openConsole }) {
  const landingItems = [
    { id: "home", label: "Home" },
    { id: "product", label: "Product" },
    { id: "developers", label: "Developers" },
  ];

  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <button type="button" onClick={() => setMode("home")} className="flex items-center gap-3 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200">
          <Globe2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-slate-950">{APP_NAME}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Market-agent routing and proof</p>
        </div>
      </button>
      <div className="hidden items-center gap-2 md:flex">
        {landingItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={cx("rounded-full px-4 py-2 text-xs font-black transition", mode === item.id ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-white hover:text-slate-950")}
          >
            {item.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => openConsole("run")} className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-200">
        Open console
      </button>
    </nav>
  );
}

function Landing({ openConsole }) {
  const [mode, setMode] = useState("home");
  const content = mode === "product" ? <Product openConsole={openConsole} setMode={setMode} /> : mode === "developers" ? <Developers /> : <Home openConsole={openConsole} setMode={setMode} />;
  return (
    <Background>
      <Header mode={mode} setMode={setMode} openConsole={openConsole} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">{content}</main>
    </Background>
  );
}

function Home({ openConsole, setMode }) {
  const proofPoints = [
    ["Choose trusted services", "Find the right provider before the agent acts."],
    ["Pay through Circle/x402", "Use the payment rail without hiding the route logic."],
    ["Prove every call", "Keep receipts for every market-supporting service."],
  ];

  return (
    <div className="space-y-12">
      <section className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
        <div>
          <Pill tone="blue">Market-agent routing and proof on Arc</Pill>
          <div className="mt-7 max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.55)]" />
              Trusted service routing before market action
            </div>
            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 md:text-6xl lg:text-7xl">
              <span className="block">Discover.</span>
              <span className="block">Route.</span>
              <span className="block">Pay.</span>
              <span className="block bg-gradient-to-r from-cyan-600 via-slate-950 to-violet-600 bg-clip-text text-transparent">Prove.</span>
            </h1>
          </div>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">AngoraPay Mesh helps market agents route trusted paid services and prove every call.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => openConsole("run")} className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-200">Run market mission</button>
            <button type="button" onClick={() => setMode("product")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200">View product</button>
          </div>
        </div>
        <MeshHeroVisual openConsole={openConsole} />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {proofPoints.map(([title, detail]) => (
          <div key={title} className="border-l border-cyan-200 pl-5">
            <p className="font-black text-slate-950">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </div>
        ))}
      </section>

      <section className="pt-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Angora RFP coverage</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Built for prediction-market, arbitrage, social-trading, portfolio, and perps agents.</p>
          </div>
          <div className="flex max-w-3xl flex-wrap gap-x-6 gap-y-3 text-sm font-black text-slate-700">
            {rfpAreas.map((area) => (
              <span key={area} className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MeshHeroVisual({ openConsole }) {
  const routeMetrics = [
    ["route", "OddsNode"],
    ["cost", "0.004"],
    ["score", "96"],
    ["asset", "USDC"],
  ];

  return (
    <Glass className="relative min-h-[620px] overflow-hidden p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_48%)]" />
      <div className="absolute left-8 top-8 rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">mission-aware route</div>
      <div className="absolute right-8 top-8 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">Arc USDC</div>
      <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-200" />
      <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200" />
      <div className="absolute left-[120px] right-[120px] top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
      <div className="absolute left-1/2 top-[112px] h-[410px] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />

      <div className="absolute left-1/2 top-1/2 z-10 flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-[2rem] border border-cyan-200 bg-white/95 text-center shadow-2xl shadow-slate-200/70 backdrop-blur-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 ring-1 ring-cyan-200">
          <Route className="h-6 w-6 text-cyan-700" />
        </div>
        <p className="mt-3 text-sm font-black text-slate-950">Route mesh</p>
        <p className="mt-1 text-xs text-slate-500">select - pay - prove</p>
      </div>

      <HeroNode className="left-1/2 top-14 -translate-x-1/2" label="Market mission" value="+EV odds" badge="intent" tone="blue" />
      <HeroNode className="right-12 top-[33%]" label="Route policy" value="trust >= 85" badge="score" tone="purple" />
      <HeroNode className="right-[20%] bottom-36" label="OddsNode" value="0.004 USDC" badge="selected" tone="good" />
      <HeroNode className="left-[20%] bottom-36" label="Circle/x402" value="Arc USDC" badge="pay" tone="blue" />
      <HeroNode className="left-12 top-[33%]" label="Proof" value="receipt + hash" badge="stored" tone="good" />

      <div className="absolute bottom-6 left-8 right-8 z-30 rounded-[24px] border border-slate-200 bg-white/85 p-3.5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-700">Live route trace</p>
            <p className="mt-1 text-xs text-slate-500">mission - marketplace - scorecard - Circle/x402 - receipt</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {routeMetrics.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 px-2.5 py-1.5 text-center ring-1 ring-slate-200">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
                <p className="mt-0.5 text-[11px] font-black text-slate-700">{value}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => openConsole("run")} className="rounded-full bg-cyan-400 px-3.5 py-2 text-xs font-black text-slate-950">Inspect</button>
        </div>
      </div>
    </Glass>
  );
}

function HeroNode({ className, label, value, badge, tone }) {
  return (
    <div className={cx("absolute z-20 flex h-[92px] w-[148px] flex-col justify-between rounded-[22px] border border-slate-200 bg-white/80 p-3 shadow-xl shadow-slate-200/50 backdrop-blur-xl", className)}>
      <div className="mb-2 flex items-center justify-between">
        <span className={cx("h-2 w-2 rounded-full", tone === "good" ? "bg-emerald-400" : tone === "purple" ? "bg-violet-400" : "bg-cyan-400")} />
        <Pill tone={tone} compact>{badge}</Pill>
      </div>
      <div>
        <p className="truncate text-[13px] font-black text-slate-950">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{value}</p>
      </div>
    </div>
  );
}

function Product({ openConsole, setMode }) {
  const audiences = [
    ["Market-agent builders", "Use one Gateway/SDK to buy odds, sentiment, risk, social, arbitrage, and proof services."],
    ["x402 providers", "Become discoverable to policy-qualified market-agent demand on Arc."],
    ["Trading and prediction teams", "Let agents use paid intelligence with budget, trust, proof, and execution history."],
    ["Finance and judges", "Inspect users, calls, receipts, USDC volume, real/testnet/fallback split, and blocked routes."],
  ];

  return (
    <div className="space-y-14">
      <section className="mx-auto max-w-4xl text-center">
        <Pill tone="purple">Product</Pill>
        <h1 className="mt-5 text-5xl font-black leading-[0.92] tracking-[-0.06em] text-slate-950 md:text-7xl">The market-agent routing layer above Circle/x402 payments.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600">Circle/x402 enables payment. AngoraPay Mesh helps market agents decide which service to buy, which provider to trust, how to route the call, and how to prove the service supported a market decision.</p>
        <p className="mx-auto mt-4 max-w-2xl text-sm font-black uppercase tracking-[0.18em] text-cyan-700">Circle enables payment. Angora decides, routes, and proves.</p>
      </section>
      <section className="grid gap-5 md:grid-cols-4">
        {[
          ["Discover", "Market agents find paid intelligence services across odds, sentiment, risk, social trading, arbitrage, and proof."],
          ["Route", "Angora ranks providers with a trust scorecard instead of choosing the cheapest endpoint blindly."],
          ["Pay", "Only approved calls move to Circle/x402 for USDC authorization and Arc settlement tracking."],
          ["Prove", "Every market-supporting call returns a receipt, output hash, policy verdict, route score, and reconciliation tag."],
        ].map(([title, detail], index) => (
          <Glass key={title} className="p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-sm font-black text-cyan-700">{index + 1}</div>
            <p className="mt-5 text-xl font-black text-slate-950">{title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
          </Glass>
        ))}
      </section>
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <Glass className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">How Angora complements Circle</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Circle moves value. Angora governs the market-service route.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">Circle/x402 handles payment authorization and service unlock. Angora sits around that payment path to decide whether a market agent should use a provider, whether the mission policy allows it, and what proof must be stored after delivery.</p>
        </Glass>
        <Glass className="p-6">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Adoption</p>
          <div className="mt-5 space-y-5">
            {audiences.map(([title, detail]) => (
              <div key={title} className="border-l border-slate-200 pl-5">
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => openConsole("run")} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">Open console</button>
            <button type="button" onClick={() => setMode("developers")} className="rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200">Developer docs</button>
          </div>
        </Glass>
      </section>
    </div>
  );
}

function Developers() {
  return (
    <div className="space-y-12">
      <section className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <Pill tone="blue">Developers</Pill>
          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950">Gateway and SDKs for paid market-agent services.</h1>
          <p className="mt-5 text-base leading-8 text-slate-600">Use AngoraPay Mesh as the policy-aware wrapper around Circle/x402 on Arc. Developers call one Gateway or SDK while Angora handles discovery, provider routing, receipts, execution history, and traction metrics.</p>
        </div>
        <CodeBlock title="TypeScript SDK" code={developerExamples.sdk} />
      </section>
      <section className="grid gap-8 lg:grid-cols-2">
        <div><p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Gateway API</p><CodeBlock title="market mission call" code={developerExamples.gateway} /></div>
        <div><p className="mb-4 text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Provider onboarding</p><CodeBlock title="provider registration" code={developerExamples.provider} /></div>
      </section>
    </div>
  );
}

function CodeBlock({ title, code }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-950 shadow-2xl shadow-slate-200/70">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <span className="font-mono text-[11px] text-white/45">{title}</span>
      </div>
      <pre className="overflow-auto p-6 text-xs leading-7 text-cyan-50/90">{code}</pre>
    </div>
  );
}

function ConsoleShell({ activeTab, setActiveTab, goHome, children }) {
  return (
    <Background>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <button type="button" onClick={goHome} className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200"><Globe2 className="h-5 w-5" /></div>
            <div><p className="text-sm font-black text-slate-950">{APP_NAME}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Console</p></div>
          </button>
          <div className="flex gap-2 overflow-auto">
            {tabs.map((tabItem) => {
              const Icon = tabItem.icon;
              const active = activeTab === tabItem.id;
              return (
                <button key={tabItem.id} type="button" onClick={() => setActiveTab(tabItem.id)} className={cx("flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black transition", active ? "bg-slate-950 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-950")}>
                  <Icon className="h-4 w-4" />{tabItem.label}
                </button>
              );
            })}
          </div>
        </div>
        {children}
      </div>
    </Background>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <Glass className="p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>
        <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700"><Icon className="h-5 w-5" /></div>
      </div>
    </Glass>
  );
}

function RunPanel({ runDemo, completed, live }) {
  const metrics = live?.dashboard?.metrics;
  const currentSteps = runSteps.map(([title, detail], index) => ({ title, detail, status: index < completed ? "done" : index === completed ? "running" : "waiting" }));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4"><Stat label="Matched providers" value={String(metrics?.providersUsed || 6)} icon={Search} /><Stat label="Gateway calls" value={String(metrics?.gatewayCalls || 4)} icon={Route} /><Stat label="Mission budget" value="0.05" icon={WalletCards} /><Stat label="USDC routed" value={String(metrics?.totalVolumeUSDC || "0.013")} icon={LineChart} /></div>
        <Glass className="p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Live market mission</p><h2 className="mt-1 text-2xl font-black text-slate-950">Prediction agent evaluates BTC election-odds market</h2></div><button type="button" onClick={runDemo} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 font-black text-slate-950"><Play className="h-4 w-4" />Run</button></div>
          <div className="space-y-3">{currentSteps.map((step, index) => <StepRow key={step.title} step={step} index={index} />)}</div>
        </Glass>
      </div>
      <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Route decision</p><div className="mt-5 space-y-4"><RouteLine label="Selected" value="OddsNode" tone="good" /><RouteLine label="Route score" value="96 / 100" tone="good" /><RouteLine label="Price" value="0.004 USDC" tone="blue" /><RouteLine label="Blocked" value="GreyAlpha" tone="bad" /><RouteLine label="Payment" value={completed >= 5 ? "Circle/x402 on Arc" : "waiting"} tone={completed >= 5 ? "good" : "warn"} /></div></Glass>
    </div>
  );
}

function StepRow({ step, index }) {
  const tone = step.status === "done" ? "good" : step.status === "running" ? "blue" : "neutral";
  return <div className="flex gap-4 rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700">{index + 1}</div><div className="min-w-0 flex-1"><p className="font-black text-slate-950">{step.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p></div><Pill tone={tone}>{step.status}</Pill></div>;
}

function RouteLine({ label, value, tone }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0"><span className="text-sm text-slate-500">{label}</span><Pill tone={tone}>{value}</Pill></div>;
}

function ServiceTile({ service }) {
  const statusTone = service.status === "approved" ? "good" : "bad";
  return (
    <div className="rounded-3xl bg-white/70 p-5 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{service.name}</p><p className="mt-1 text-sm text-slate-500">{service.provider}</p></div><Pill tone={statusTone}>{service.status}</Pill></div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{service.reason}</p>
      <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
        <Metric label="Price" value={service.price.toFixed(3)} />
        <Metric label="Trust" value={service.trust} />
        <Metric label="Score" value={service.score} />
        <Metric label="Proof" value={service.proof ? "yes" : "no"} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 font-black text-slate-950">{value}</p></div>;
}

function MarketplacePanel({ live }) {
  const [query, setQuery] = useState("odds");
  const liveServices = (live?.services || []).map((service) => ({
    id: service.serviceId,
    name: service.name,
    provider: service.providerId,
    price: Number(service.price || 0),
    category: service.category,
    trust: service.trustScore || 0,
    latency: service.avgLatencyMs ? `${service.avgLatencyMs}ms` : "n/a",
    proof: Boolean(service.proofRequired),
    status: service.verified === false ? "blocked" : "approved",
    score: service.trustScore || 0,
    reason: service.description || "Live AngoraPay Mesh provider.",
  }));
  const sourceServices = liveServices.length > 0 ? liveServices : marketServices;
  const filtered = sourceServices.filter((service) => `${service.name} ${service.provider} ${service.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Glass className="p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Marketplace</p><h2 className="mt-1 text-2xl font-black text-slate-950">Paid market services</h2></div><div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-slate-200"><Search className="h-4 w-4 text-cyan-700" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-36 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Search" /></div></div>
        <div className="grid gap-3 md:grid-cols-2">{filtered.map((service) => <ServiceTile key={service.id} service={service} />)}</div>
      </Glass>
      <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Mission filters</p><div className="mt-5 space-y-4"><RouteLine label="Max spend" value="0.05 USDC" tone="blue" /><RouteLine label="Min trust" value="85" tone="good" /><RouteLine label="Proof" value="required" tone="good" /><RouteLine label="Network" value="Arc" tone="purple" /></div></Glass>
    </div>
  );
}

function ScorecardPanel() {
  return (
    <Glass className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Route scorecard</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Why providers were selected or blocked</h2>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1fr_90px_90px_90px_90px_110px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><span>Provider</span><span>Fit</span><span>Policy</span><span>Proof</span><span>Score</span><span>Verdict</span></div>
        {routeCandidates.map((candidate) => <div key={candidate.provider} className="grid grid-cols-[1fr_90px_90px_90px_90px_110px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0"><span><b>{candidate.provider}</b><br /><span className="text-xs text-slate-500">{candidate.service}</span></span><span>{candidate.missionFit}</span><span>{candidate.policy}</span><span>{candidate.proof}</span><span>{candidate.routeScore}</span><Pill compact tone={candidate.verdict === "blocked" ? "bad" : candidate.verdict === "selected" ? "good" : "blue"}>{candidate.verdict}</Pill></div>)}
      </div>
    </Glass>
  );
}

function PolicyPanel() {
  return <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Policy</p><h2 className="mt-1 text-2xl font-black text-slate-950">Mission controls before payment</h2><div className="mt-6 grid gap-3 md:grid-cols-2">{policyRules.map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-2xl bg-white/70 p-4 ring-1 ring-slate-200"><span className="text-sm text-slate-500">{key}</span><span className="text-sm font-black text-slate-950">{value}</span></div>)}</div></Glass>;
}

function ProviderPanel() {
  return <div className="grid gap-5 lg:grid-cols-2">{providerOnboarding.map(([title, detail], index) => <Glass key={title} className="p-5"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-sm font-black text-cyan-700">{index + 1}</div><p className="mt-5 text-xl font-black text-slate-950">{title}</p><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p></Glass>)}</div>;
}

function HistoryPanel({ live }) {
  const liveRows = (live?.receipts || []).slice(0, 8).map((receipt) => ({
    time: new Date(receipt.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    provider: receipt.providerId,
    service: receipt.serviceId,
    score: receipt.scorecard?.routeScore || "-",
    amount: Number(receipt.amountUSDC || receipt.amount || 0),
    status: receipt.serviceStatus || receipt.settlementStatus || "pending",
  }));
  const rows = liveRows.length > 0 ? liveRows : executionHistory;
  return (
    <Glass className="p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Execution history</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Paid, pending, and blocked calls</h2>
      <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[90px_1fr_120px_90px_100px_120px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><span>Time</span><span>Provider</span><span>Service</span><span>Score</span><span>Amount</span><span>Status</span></div>
        {rows.map((row) => <div key={`${row.time}-${row.provider}-${row.service}`} className="grid grid-cols-[90px_1fr_120px_90px_100px_120px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0"><span className="font-mono text-xs text-slate-500">{row.time}</span><span className="font-semibold text-slate-800">{row.provider}</span><span>{row.service}</span><span>{row.score}</span><span>{row.amount.toFixed(3)}</span><Pill compact tone={row.status === "blocked" ? "bad" : row.status === "settled" || row.status === "delivered" ? "good" : "warn"}>{row.status}</Pill></div>)}
      </div>
    </Glass>
  );
}

function ProofPanel() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Receipt packet</p><h2 className="mt-1 text-2xl font-black text-slate-950">Payment-linked market proof</h2><div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-3xl bg-white/70 ring-1 ring-slate-200">{proofRows.map(([key, value]) => <div key={key} className="grid gap-3 p-4 md:grid-cols-[220px_1fr]"><p className="font-mono text-xs text-slate-400">{key}</p><p className="font-semibold text-slate-700">{value}</p></div>)}</div></Glass>
      <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Audit answer</p><h3 className="mt-2 text-2xl font-black text-slate-950">What signal was bought, why, and which mission did it support?</h3><p className="mt-4 text-sm leading-7 text-slate-600">The receipt connects mission intent, provider route, policy verdict, Circle/x402 authorization, Arc settlement state, provider output, output hash, and recommendation.</p></Glass>
    </div>
  );
}

function MetricsPanel({ live }) {
  const metrics = live?.dashboard?.metrics;
  const liveMetrics = metrics ? [
    ["Users onboarded", metrics.usersOnboarded],
    ["Missions created", metrics.missionsCreated],
    ["Gateway calls", metrics.gatewayCalls],
    ["Paid service calls", metrics.paidServiceCalls],
    ["Receipts created", metrics.receiptsCreated],
    ["Total USDC routed", metrics.totalVolumeUSDC],
    ["Real x402 calls", metrics.realX402Calls],
    ["Arc testnet calls", metrics.arcTestnetCalls],
    ["Fallback calls", metrics.fallbackCalls],
    ["Blocked calls", metrics.blockedCalls],
    ["Providers used", metrics.providersUsed],
    ["RFP coverage", "6 / 6"],
  ] : submissionMetrics;
  return <Glass className="p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Submission metrics</p><h2 className="mt-1 text-2xl font-black text-slate-950">Users, transactions, volume, receipts</h2><div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-4">{liveMetrics.map(([label, value]) => <div key={label} className="rounded-3xl bg-white/70 p-5 ring-1 ring-slate-200"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>)}</div></Glass>;
}

function DeveloperPanel() {
  return <Developers />;
}

export default function AngoraUiCanvas() {
  const [view, setView] = useState("landing");
  const [tab, setTab] = useState("run");
  const [completed, setCompleted] = useState(0);
  const [live, setLive] = useState(null);

  const refreshLive = async () => {
    try {
      setLive(await loadLiveSnapshot());
    } catch (error) {
      console.warn("Angora live snapshot unavailable", error);
    }
  };

  useEffect(() => {
    refreshLive();
  }, []);

  const openConsole = (target = "run") => {
    setTab(target);
    setView("console");
  };

  const runDemo = async () => {
    setCompleted(0);
    runSteps.forEach((_, index) => {
      window.setTimeout(() => setCompleted(index + 1), 350 + index * 420);
    });
    try {
      await api("/v1/angora/demo/market-mission", {
        method: "POST",
        body: JSON.stringify({
          userGoal: "Evaluate whether a BTC prediction market is mispriced after breaking news",
          paymentMode: "arc_testnet",
        }),
      });
      await refreshLive();
    } catch (error) {
      console.warn("Angora demo mission unavailable", error);
    }
  };

  const Panel = useMemo(() => {
    const panelMap = {
      run: RunPanel,
      market: MarketplacePanel,
      scorecard: ScorecardPanel,
      policy: PolicyPanel,
      providers: ProviderPanel,
      history: HistoryPanel,
      proof: ProofPanel,
      metrics: MetricsPanel,
      developers: DeveloperPanel,
    };
    return panelMap[tab] || RunPanel;
  }, [tab]);

  if (view === "landing") {
    return <Landing openConsole={openConsole} />;
  }

  return (
    <ConsoleShell activeTab={tab} setActiveTab={setTab} goHome={() => setView("landing")}>
      <Panel runDemo={runDemo} completed={completed} live={live} />
    </ConsoleShell>
  );
}
