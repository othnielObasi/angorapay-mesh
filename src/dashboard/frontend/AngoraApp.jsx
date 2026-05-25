import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  FileCheck2,
  Globe2,
  LineChart,
  MessageSquare,
  Play,
  Route,
  Search,
  ShieldCheck,
  Store,
  WalletCards,
} from "lucide-react";

const APP_NAME = "AngoraPay Mesh";

const tabs = [
  { id: "workspace", label: "Agent Workspace", icon: MessageSquare, intent: "Run a market mission and watch the agent decide." },
  { id: "network", label: "Market Network", icon: Store, intent: "Inspect providers, trust, pricing, and routing policy." },
  { id: "ops", label: "Proof & Ops", icon: FileCheck2, intent: "Verify receipts, payments, reconciliation, and submission metrics." },
];

const rfpAreas = [
  "Perpetual Futures Trading Agent",
  "Prediction Market Trader Intelligence",
  "Prediction Market Verticals",
  "Adaptive Portfolio Manager",
  "Cross-Platform Arbitrage Agent",
  "Social Trading Intelligence",
];

const userWorkflows = [
  {
    user: "Market-agent builders",
    job: "Connect an agent to paid market services without hand-building provider discovery, spend policy, receipts, and proof storage.",
    support: "Agent Workspace runs missions, classifies intent, routes providers, records traces, and exposes Gateway/SDK examples.",
    console: "Agent Workspace",
  },
  {
    user: "Prediction-market teams",
    job: "Turn noisy odds, news, sentiment, and risk inputs into a proof-backed recommendation before acting.",
    support: "Specialist missions cover prediction-market intelligence, vertical questions, route scorecards, and receipt-backed recommendations.",
    console: "Agent Workspace",
  },
  {
    user: "Arbitrage and trading operators",
    job: "Check cross-venue prices, risk, and liquidity through trusted services while staying inside a USDC budget.",
    support: "Market Network shows provider trust, price, proof support, blocked routes, and mission policy before payment.",
    console: "Market Network",
  },
  {
    user: "Paid intelligence providers",
    job: "List a market-data, odds, sentiment, risk, social, arbitrage, or proof service and receive qualified demand.",
    support: "Provider onboarding captures service category, price, proof fields, delivery status, and reputation signals.",
    console: "Market Network",
  },
  {
    user: "Enterprise admins",
    job: "Control which agents can spend, which providers are allowed, and whether every paid call can be audited.",
    support: "Proof & Ops surfaces policy, receipts, payment intents, provider deliveries, reconciliation, and runtime metrics.",
    console: "Proof & Ops",
  },
  {
    user: "Auditors and reviewers",
    job: "Verify what signal was bought, why it was selected, what it cost, and which market decision it supported.",
    support: "Receipt packets connect mission intent, provider route, policy verdict, payment rail, output hash, and reconciliation tag.",
    console: "Proof & Ops",
  },
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
  const [
    dashboard,
    services,
    receipts,
    workspace,
    execution,
    payments,
    deliveries,
    reconciliation,
    conversations,
    traces,
    checkpoints,
    reputation,
  ] = await Promise.all([
    api("/v1/angora/dashboard/summary"),
    api("/v1/angora/services/search?max_price=1&require_verified=false"),
    api("/v1/angora/receipts"),
    api("/v1/angora/workspaces/current"),
    api("/v1/angora/execution-history?limit=12"),
    api("/v1/angora/payment-intents?limit=12"),
    api("/v1/angora/provider-deliveries?limit=12"),
    api("/v1/angora/reconciliation/runs?limit=8"),
    api("/v1/angora/conversations?limit=8"),
    api("/v1/angora/agent-traces?limit=12"),
    api("/v1/angora/agent-checkpoints?limit=12"),
    api("/v1/angora/reputation"),
  ]);
  return {
    dashboard,
    services: services.services || [],
    blockedServices: services.blocked || [],
    receipts: receipts.receipts || [],
    workspace,
    execution: execution.execution?.rows || execution.execution || [],
    executionSummary: execution.summary,
    paymentIntents: payments.paymentIntents || [],
    providerDeliveries: deliveries.providerDeliveries || [],
    reconciliationRuns: reconciliation.runs || [],
    conversations: conversations.conversations?.rows || conversations.conversations || [],
    traces: traces.traces?.rows || traces.traces || [],
    checkpoints: checkpoints.checkpoints?.rows || checkpoints.checkpoints || [],
    reputation: reputation.reputation || [],
  };
}

function runSelfTests() {
  console.assert(tabs.length === 3, "Angora UI should expose three product-level console sections");
  console.assert(new Set(tabs.map((tab) => tab.id)).size === tabs.length, "tab IDs should be unique");
  console.assert(approvedServices(marketServices).length === 6, "six market services should be approved");
  console.assert(blockedServices(marketServices).length === 1, "one market service should be blocked");
  console.assert(Math.abs(calculateTotal(selectedRun) - 0.013) < 0.000001, "selected run cost should equal 0.013 USDC");
  console.assert(runSteps.length === 6, "live run should show six production steps");
  console.assert(policyRules.some(([key]) => key === "Minimum route score"), "policy must include route-score gate");
  console.assert(rfpAreas.length === 6, "UI should cover all six AngoraPay Mesh RFP areas");
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
    <section className={cx("bg-white/55", className)}>
      {children}
    </section>
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
      <button type="button" onClick={() => openConsole("workspace")} className="rounded-full bg-slate-950 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-200">
        Sign in
      </button>
    </nav>
  );
}

function Landing({ openConsole }) {
  const [mode, setMode] = useState("home");
  const content = mode === "product" ? <Product setMode={setMode} /> : mode === "developers" ? <Developers /> : <Home setMode={setMode} />;
  return (
    <Background>
      <Header mode={mode} setMode={setMode} openConsole={openConsole} />
      <main className="mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">{content}</main>
    </Background>
  );
}

function Home({ setMode }) {
  const proofPoints = [
    ["Route trusted providers", "Find the right paid signal before an agent acts."],
    ["Control spend", "Apply budget, trust, proof, and category policy."],
    ["Keep proof", "Attach receipts and traces to the market answer."],
  ];
  const missionPreview = [
    ["Ask", "Enter a market question or trading hypothesis."],
    ["Route", "Angora selects paid intelligence services that match the mission."],
    ["Prove", "The console returns an answer with receipts and trace history."],
  ];

  return (
    <div className="space-y-12">
      <section className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
        <div>
          <Pill tone="blue">Market-agent payments and proof on Arc</Pill>
          <div className="mt-7 max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
              <span className="h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.55)]" />
              Paid intelligence for autonomous market decisions
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.045em] text-slate-950 md:text-7xl">Paid market intelligence, routed before agents act.</h1>
          </div>
          <p className="mt-7 max-w-2xl text-xl font-semibold leading-9 text-slate-700">AngoraPay Mesh lets AI market agents buy trusted signals through Circle/x402, enforce spend policy, and keep proof for every service call.</p>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">It is the control surface between a market question and the paid data, risk, sentiment, odds, or proof services needed to answer it.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" onClick={() => setMode("product")} className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-xl shadow-cyan-200">View product</button>
            <button type="button" onClick={() => setMode("developers")} className="rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 ring-1 ring-slate-200">Developer docs</button>
          </div>
        </div>
        <MeshHeroVisual />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {proofPoints.map(([title, detail]) => (
          <div key={title} className="border-l border-cyan-200 pl-5">
            <p className="font-black text-slate-950">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 border-y border-slate-200 py-8 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">First mission</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">From market question to proof-backed answer.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">A mission starts with intent, routes paid services through policy, then returns an answer that can be inspected later.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {missionPreview.map(([title, detail]) => (
            <div key={title} className="border-t border-slate-200 py-4">
              <p className="font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-2">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Built for market-agent tracks</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">Prediction markets, arbitrage, social trading, portfolio management, perps, and proof workflows.</p>
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

      <section className="grid gap-6 border-y border-slate-200 py-8 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Next step</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Choose the path that matches your role.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Product", "See user categories, default console areas, provider routing, policy, receipts, and reconciliation."],
            ["Developers", "Use the Gateway and SDK examples to connect an agent or register a provider service."],
          ].map(([title, detail]) => (
            <button key={title} type="button" onClick={() => setMode(title === "Product" ? "product" : "developers")} className="border-t border-slate-200 py-4 text-left transition hover:border-cyan-300">
              <p className="font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function MeshHeroVisual() {
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
          <Pill tone="good" compact>policy-ready</Pill>
        </div>
      </div>
    </Glass>
  );
}

function WorkflowCard({ workflow }) {
  return (
    <div className="border-t border-slate-200 py-4">
      <div className="flex items-start justify-between gap-4">
        <p className="font-black text-slate-950">{workflow.user}</p>
        <Pill tone="blue" compact>{workflow.console}</Pill>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{workflow.job}</p>
      <p className="mt-3 border-l border-cyan-200 pl-3 text-xs font-semibold leading-5 text-slate-500">{workflow.support}</p>
    </div>
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

function Product({ setMode }) {
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
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Production use</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Useful when money-moving agents need a control layer.</h2>
          <div className="mt-5 space-y-4">
            {[
              ["Before payment", "Classify intent, select the specialist path, rank providers, and enforce budget/trust/proof policy."],
              ["During service use", "Create payment intent context, call approved services, collect delivery evidence, and capture output hashes."],
              ["After delivery", "Show receipts, route scorecards, reconciliation status, provider deliveries, and audit-ready trace history."],
            ].map(([title, detail]) => (
              <div key={title} className="border-l border-slate-200 pl-5">
                <p className="font-black text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setMode("developers")} className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950">Developer docs</button>
          </div>
        </Glass>
      </section>
      <section className="border-y border-slate-200 py-8">
        <div className="mb-6 max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">User categories</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">What each user can do today</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">The console is organized around the same operating loop: mission, network, proof. These user paths explain where each role fits.</p>
        </div>
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {userWorkflows.map((workflow) => (
            <WorkflowCard key={workflow.user} workflow={workflow} />
          ))}
        </div>
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

function ConsoleShell({ activeTab, setActiveTab, goHome, live, latestResult, children }) {
  const metrics = live?.dashboard?.metrics;
  const runtime = live?.dashboard?.runtime;
  const activeSection = tabs.find((tabItem) => tabItem.id === activeTab) || tabs[0];
  return (
    <Background>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center bg-slate-950 text-cyan-300"><Globe2 className="h-5 w-5" /></div>
            <div><p className="text-sm font-black text-slate-950">{APP_NAME}</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Market agent console</p></div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <nav className="grid gap-1 border border-slate-200 bg-white/70 p-1 sm:grid-cols-3" aria-label="Console sections">
              {tabs.map((tabItem) => {
                const Icon = tabItem.icon;
                const active = activeTab === tabItem.id;
                return (
                  <button key={tabItem.id} type="button" onClick={() => setActiveTab(tabItem.id)} className={cx("flex min-h-10 items-center justify-center gap-2 px-4 py-2 text-xs font-black transition", active ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950")}>
                    <Icon className="h-4 w-4" />{tabItem.label}
                  </button>
                );
              })}
            </nav>
            <button type="button" onClick={goHome} className="min-h-10 border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition hover:border-slate-950 hover:text-slate-950">
              Sign out
            </button>
          </div>
        </div>
        <div className="mb-8 grid gap-6 border-y border-slate-200 py-5 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">{activeSection.label}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{activeSection.intent}</h1>
          </div>
          <div className="grid gap-0 border border-slate-200 bg-white/45 sm:grid-cols-2">
            <Stat label="Agent state" value={latestResult ? "active" : "ready"} icon={MessageSquare} />
            <Stat label="Gateway calls" value={String(metrics?.gatewayCalls || 0)} icon={Route} />
            <Stat label="Receipts" value={String(metrics?.receiptsCreated || live?.receipts?.length || 0)} icon={FileCheck2} />
            <Stat label="Runtime requests" value={String(runtime?.requests || 0)} icon={Activity} />
          </div>
        </div>
        {children}
      </div>
    </Background>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <Glass className="border-b border-slate-200 p-4 even:border-r-0 last:border-b-0 sm:border-r sm:[&:nth-child(3)]:border-b-0">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-black text-slate-950">{value}</p></div>
        <div className="text-cyan-700"><Icon className="h-5 w-5" /></div>
      </div>
    </Glass>
  );
}

function AgentChatPanel({ runAgentMission, agentGoal, setAgentGoal, agentRunning, latestResult, live }) {
  const traces = latestResult?.traces || live?.traces || [];
  const checkpoints = latestResult?.checkpoints || live?.checkpoints || [];
  const receipts = latestResult?.receipts || live?.receipts || [];
  const recentExecutions = Array.isArray(live?.execution?.recent) ? live.execution.recent : [];
  const recommendation = latestResult?.recommendation;
  const missionTemplates = [
    "Find the best paid odds, sentiment, risk, and proof services for a BTC prediction market question.",
    "Route a cross-venue arbitrage check with max spend 0.05 USDC and proof required.",
    "Evaluate whether a social trading signal is reliable enough to support a copy-trading decision.",
  ];
  const messages = latestResult
    ? [
        { role: "user", content: latestResult.context?.userGoal || agentGoal },
        { role: "assistant", content: latestResult.recommendation?.summary || "Mission completed." },
      ]
    : [
        { role: "assistant", content: "Describe a market question. I will select a specialist agent, route paid services, enforce policy, create receipts, and return a recommendation." },
      ];
  const decisions = latestResult?.decisions || [];
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
      <Glass className="flex min-h-[680px] flex-col border-y border-slate-200 bg-white/45">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Agent workspace</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Ask, route, pay, prove</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">The agent classifies the mission, selects a specialist module, buys trusted market services, records receipts, and returns a proof-backed recommendation.</p>
            </div>
            <Pill tone={agentRunning ? "blue" : latestResult ? "good" : "neutral"}>{agentRunning ? "running mission" : latestResult ? "mission complete" : "ready"}</Pill>
          </div>
        </div>
        <div className="grid gap-0 border-b border-slate-200 bg-slate-950 text-white md:grid-cols-4">
          <StageCell label="1. Intent" value={latestResult?.specialistAgent || "classify"} />
          <StageCell label="2. Providers" value={latestResult ? `${latestResult.decisions?.length || 0} routed` : "pending"} />
          <StageCell label="3. Payment" value={latestResult?.totals?.usdcRouted || "0.00 USDC"} />
          <StageCell label="4. Proof" value={latestResult ? `${receipts.length} receipts` : "waiting"} />
        </div>
        <div className="flex-1 space-y-4 overflow-auto p-5">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={cx("max-w-[88%] border-l-4 p-4", message.role === "user" ? "ml-auto border-slate-950 bg-slate-950 text-white" : "border-cyan-300 bg-transparent text-slate-700")}>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-60">{message.role === "user" ? "Builder" : "Angora agent"}</p>
              <p className="mt-2 text-sm leading-6">{message.content}</p>
              {message.role === "assistant" && recommendation?.reasons?.length ? (
                <div className="mt-3 space-y-2">
                  {recommendation.reasons.slice(0, 3).map((reason) => <p key={reason} className="border-t border-slate-200 py-2 text-xs leading-5 text-slate-600">{reason}</p>)}
                </div>
              ) : null}
            </div>
          ))}
          {agentRunning ? (
            <div className="max-w-[88%] border-l-4 border-cyan-300 p-4 text-slate-700">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Angora agent</p>
              <p className="mt-2 text-sm leading-6">Running mission: discovering providers, scoring routes, checking policy, attempting payment, and writing receipts.</p>
            </div>
          ) : null}
        </div>
        <div className="border-t border-slate-200 bg-white/70 p-4">
          <div className="mb-4 grid gap-2 lg:grid-cols-3">
            {missionTemplates.map((template) => (
              <button key={template} type="button" onClick={() => setAgentGoal(template)} className="border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-600 transition hover:border-cyan-300 hover:text-slate-950">
                {template}
              </button>
            ))}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <textarea value={agentGoal} onChange={(event) => setAgentGoal(event.target.value)} className="min-h-24 resize-none border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-900 outline-none focus:border-cyan-300" />
            <button type="button" onClick={runAgentMission} disabled={agentRunning || agentGoal.trim().length < 8} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">
              <Play className="h-4 w-4" />Run agent
            </button>
          </div>
        </div>
      </Glass>
      <div className="space-y-5">
        <Glass className="border-y border-slate-200 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Mission control</p>
          <div className="mt-4 space-y-3">
            <RouteLine label="Specialist" value={latestResult?.specialistAgent || "auto"} tone="blue" />
            <RouteLine label="RFP track" value={latestResult?.rfpTrack || "pending"} tone="purple" />
            <RouteLine label="USDC routed" value={latestResult?.totals?.usdcRouted || "0.000000"} tone="good" />
            <RouteLine label="Receipts" value={String(latestResult?.totals?.receiptsCreated || receipts.length || 0)} tone="good" />
            <RouteLine label="Confidence" value={recommendation ? `${Math.round(recommendation.confidence * 100)}%` : "pending"} tone="blue" />
          </div>
        </Glass>
        <Glass className="border-y border-slate-200 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Live trace</p>
          <div className="mt-4 space-y-3">
            {(traces.length ? traces.slice(0, 6) : decisions.length ? decisions : recentExecutions.slice(0, 4)).map((item, index) => (
              <div key={item.traceId || item.receipt?.receiptId || item.id || index} className="border-t border-slate-200 py-3 first:border-t-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-900">{item.label || item.serviceName || item.serviceId || item.category}</p>
                  <Pill compact tone={item.status === "blocked" ? "bad" : "good"}>{item.status}</Pill>
                </div>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.details?.reason || item.routeReason || item.policyVerdict || item.eventType || "Recorded by the Angora mission runtime."}</p>
              </div>
            ))}
          </div>
        </Glass>
        <Glass className="border-y border-slate-200 p-5">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Recoverable checkpoints</p>
          <div className="mt-4 space-y-2">
            {(checkpoints.length ? checkpoints.slice(0, 5) : [{ stage: "waiting", status: "saved", resumeFrom: "Run a mission to create checkpoints" }]).map((checkpoint, index) => (
              <div key={checkpoint.checkpointId || index} className="flex items-center justify-between gap-3 border-t border-slate-200 py-2 first:border-t-0">
                <span className="text-xs font-semibold text-slate-700">{checkpoint.stage}</span>
                <Pill compact tone={checkpoint.status === "terminal" ? "bad" : "good"}>{checkpoint.status}</Pill>
              </div>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
}

function StageCell({ label, value }) {
  return (
    <div className="border-b border-white/10 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">{label}</p>
      <p className="mt-1 truncate text-sm font-black">{value}</p>
    </div>
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
  return <div className="flex gap-4 border-t border-slate-200 py-4 first:border-t-0"><div className="w-8 shrink-0 font-mono text-sm font-black text-cyan-700">{String(index + 1).padStart(2, "0")}</div><div className="min-w-0 flex-1"><p className="font-black text-slate-950">{step.title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p></div><Pill tone={tone}>{step.status}</Pill></div>;
}

function RouteLine({ label, value, tone }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0"><span className="text-sm text-slate-500">{label}</span><Pill tone={tone}>{value}</Pill></div>;
}

function ServiceTile({ service }) {
  const statusTone = service.status === "approved" ? "good" : "bad";
  return (
    <div className="border-t border-slate-200 py-5 first:border-t-0">
      <div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-950">{service.name}</p><p className="mt-1 text-sm text-slate-500">{service.provider}</p></div><Pill tone={statusTone}>{service.status}</Pill></div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{service.reason}</p>
      <div className="mt-5 grid grid-cols-4 divide-x divide-slate-200 border-y border-slate-200 text-center text-xs">
        <Metric label="Price" value={service.price.toFixed(3)} />
        <Metric label="Trust" value={service.trust} />
        <Metric label="Score" value={service.score} />
        <Metric label="Proof" value={service.proof ? "yes" : "no"} />
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 font-black text-slate-950">{value}</p></div>;
}

function EmptyState({ title, detail }) {
  return (
    <div className="border-y border-slate-200 bg-white/35 px-4 py-8">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{detail}</p>
    </div>
  );
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
    <div className="grid gap-8 xl:grid-cols-[1fr_280px]">
      <Glass className="border-y border-slate-200 p-5">
        <div className="mb-2 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Marketplace</p><h2 className="mt-1 text-2xl font-black text-slate-950">Paid market services</h2></div><div className="flex items-center gap-2 border-b border-slate-300 bg-transparent py-2"><Search className="h-4 w-4 text-cyan-700" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-40 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400" placeholder="Search services" /></div></div>
        <div className="grid gap-x-8 md:grid-cols-2">{filtered.map((service) => <ServiceTile key={service.id} service={service} />)}</div>
      </Glass>
      <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Mission filters</p><div className="mt-5 space-y-4"><RouteLine label="Max spend" value="0.05 USDC" tone="blue" /><RouteLine label="Min trust" value="85" tone="good" /><RouteLine label="Proof" value="required" tone="good" /><RouteLine label="Network" value="Arc" tone="purple" /></div></Glass>
    </div>
  );
}

function ScorecardPanel({ latestResult }) {
  const rows = (latestResult?.decisions || []).map((decision) => ({
    provider: decision.providerId || "not selected",
    service: decision.serviceName || decision.serviceId || decision.category,
    missionFit: decision.scorecard?.policyCompliance ?? "-",
    policy: decision.status === "blocked" ? 0 : 100,
    proof: decision.scorecard?.proofCompleteness ?? "-",
    routeScore: decision.routeScore || "-",
    verdict: decision.status,
    reason: decision.routeReason,
  }));
  return (
    <Glass className="border-y border-slate-200 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Route scorecard</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Why providers were selected or blocked</h2>
      {rows.length ? (
        <div className="mt-6 overflow-x-auto border-y border-slate-200 bg-white/40">
          <div className="grid grid-cols-[1fr_90px_90px_90px_90px_110px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><span>Provider</span><span>Fit</span><span>Policy</span><span>Proof</span><span>Score</span><span>Verdict</span></div>
          {rows.map((candidate) => <div key={`${candidate.provider}-${candidate.service}`} className="grid grid-cols-[1fr_90px_90px_90px_90px_110px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0"><span><b>{candidate.provider}</b><br /><span className="text-xs text-slate-500">{candidate.service}</span></span><span>{candidate.missionFit}</span><span>{candidate.policy}</span><span>{candidate.proof}</span><span>{candidate.routeScore}</span><Pill compact tone={candidate.verdict === "blocked" ? "bad" : candidate.verdict === "delivered" ? "good" : "blue"}>{candidate.verdict}</Pill></div>)}
        </div>
      ) : <EmptyState title="No route decisions yet" detail="Run an agent mission from the Agent Workspace to populate provider routing, policy verdicts, and proof status." />}
    </Glass>
  );
}

function PolicyPanel({ live }) {
  const policy = live?.workspace?.policy;
  const budget = live?.workspace?.budget;
  const rows = policy ? [
    ["Max mission spend", `${policy.maxMissionSpendUSDC} USDC`],
    ["Daily spend limit", `${budget?.dailyLimitUSDC || policy.dailySpendLimitUSDC} USDC`],
    ["Minimum provider trust", `${policy.minProviderTrustScore} / 100`],
    ["Minimum route score", `${policy.minRouteScore} / 100`],
    ["Proof required", String(policy.proofRequired)],
    ["Payment modes", (policy.allowedPaymentModes || []).join(", ")],
    ["Allowed categories", (policy.allowedCategories || []).join(", ")],
    ["Blocked providers", (policy.blockedProviders || []).join(", ") || "none"],
  ] : policyRules;
  return <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Policy</p><h2 className="mt-1 text-2xl font-black text-slate-950">Mission controls before payment</h2><div className="mt-6 divide-y divide-slate-200">{rows.map(([key, value]) => <div key={key} className="flex items-center justify-between gap-4 py-3"><span className="text-sm text-slate-500">{key}</span><span className="text-right text-sm font-black text-slate-950">{value}</span></div>)}</div></Glass>;
}

function ProviderPanel({ live }) {
  const deliveries = live?.providerDeliveries || [];
  return <div className="grid gap-5 lg:grid-cols-2">
    {providerOnboarding.map(([title, detail], index) => <Glass key={title} className="border-t border-slate-200 py-5"><div className="font-mono text-sm font-black text-cyan-700">{String(index + 1).padStart(2, "0")}</div><p className="mt-3 text-xl font-black text-slate-950">{title}</p><p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p></Glass>)}
    <Glass className="border-y border-slate-200 p-5 lg:col-span-2">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Live provider deliveries</p>
      <div className="mt-4 divide-y divide-slate-200">{deliveries.slice(0, 6).map((delivery) => <div key={delivery.deliveryId || delivery.receiptId} className="py-3"><div className="flex items-center justify-between"><p className="font-black text-slate-900">{delivery.providerId}</p><Pill compact tone={delivery.status === "delivered" ? "good" : "warn"}>{delivery.status}</Pill></div><p className="mt-1 text-xs text-slate-500">{delivery.serviceId} · {delivery.receiptId}</p></div>)}</div>
    </Glass>
  </div>;
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
  const rows = liveRows;
  return (
    <Glass className="border-y border-slate-200 p-5">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Execution history</p>
      <h2 className="mt-1 text-2xl font-black text-slate-950">Paid, pending, and blocked calls</h2>
      {rows.length ? (
        <div className="mt-6 overflow-x-auto border-y border-slate-200 bg-white/40">
          <div className="grid grid-cols-[90px_1fr_120px_90px_100px_120px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><span>Time</span><span>Provider</span><span>Service</span><span>Score</span><span>Amount</span><span>Status</span></div>
          {rows.map((row) => <div key={`${row.time}-${row.provider}-${row.service}`} className="grid grid-cols-[90px_1fr_120px_90px_100px_120px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0"><span className="font-mono text-xs text-slate-500">{row.time}</span><span className="font-semibold text-slate-800">{row.provider}</span><span>{row.service}</span><span>{row.score}</span><span>{row.amount.toFixed(3)}</span><Pill compact tone={row.status === "blocked" ? "bad" : row.status === "settled" || row.status === "delivered" ? "good" : "warn"}>{row.status}</Pill></div>)}
        </div>
      ) : <EmptyState title="No paid calls recorded" detail="Execution history is empty until a mission routes an approved provider call and creates a receipt." />}
    </Glass>
  );
}

function ProofPanel({ live, latestResult }) {
  const receipt = latestResult?.receipts?.[0] || live?.receipts?.[0];
  const rows = receipt ? [
    ["receipt_id", receipt.receiptId],
    ["agent_id", receipt.agentId],
    ["mission_id", receipt.missionId],
    ["service_id", receipt.serviceId],
    ["provider_id", receipt.providerId],
    ["policy_status", receipt.policyStatus],
    ["route_score", String(receipt.scorecard?.routeScore || "")],
    ["payment_rail", receipt.paymentRail],
    ["asset", receipt.asset],
    ["network", receipt.arcNetwork],
    ["payment_reference", receipt.x402Reference],
    ["execution_mode", receipt.executionMode],
    ["settlement_status", receipt.settlementStatus],
    ["output_hash", receipt.outputHash],
    ["reconciliation_tag", receipt.reconciliationTag],
  ] : [];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Receipt packet</p><h2 className="mt-1 text-2xl font-black text-slate-950">Payment-linked market proof</h2>{rows.length ? <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 bg-white/40">{rows.map(([key, value]) => <div key={key} className="grid gap-3 py-3 md:grid-cols-[220px_1fr]"><p className="font-mono text-xs text-slate-400">{key}</p><p className="break-all font-semibold text-slate-700">{value || "n/a"}</p></div>)}</div> : <EmptyState title="No receipt selected" detail="Run an agent mission to create payment-linked receipts, output hashes, and reconciliation tags." />}</Glass>
      <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Audit answer</p><h3 className="mt-2 text-2xl font-black text-slate-950">What signal was bought, why, and which mission did it support?</h3><p className="mt-4 text-sm leading-7 text-slate-600">The receipt connects mission intent, provider route, policy verdict, Circle/x402 authorization, Arc settlement state, provider output, output hash, and recommendation.</p></Glass>
    </div>
  );
}

function ReconciliationPanel({ live, runReconciliation, reconciliationRunning }) {
  const runs = live?.reconciliationRuns || [];
  const paymentIntents = live?.paymentIntents || [];
  const deliveries = live?.providerDeliveries || [];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Glass className="border-y border-slate-200 p-5">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Reconciliation</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Payment intent, delivery, receipt, and settlement matching</h2>
          </div>
          <button type="button" onClick={runReconciliation} disabled={reconciliationRunning} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50">
            <CheckCircle2 className="h-4 w-4" />{reconciliationRunning ? "Running" : "Run reconciliation"}
          </button>
        </div>
        {runs.length ? (
          <div className="overflow-x-auto border-y border-slate-200 bg-white/40">
            <div className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-3 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-[0.14em] text-slate-400"><span>Run</span><span>Checked</span><span>Matched</span><span>Pending</span><span>Failed</span></div>
            {runs.slice(0, 8).map((run) => (
              <div key={run.reconciliationRunId} className="grid grid-cols-[1fr_90px_90px_90px_90px] gap-3 border-b border-slate-100 p-3 text-sm last:border-b-0">
                <span className="truncate font-mono text-xs text-slate-600">{run.reconciliationRunId}</span><span>{run.checked}</span><span>{run.matched}</span><span>{run.pending}</span><span>{run.failed}</span>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No reconciliation runs" detail="Run reconciliation after a mission creates payment intents, provider deliveries, and receipts." />}
      </Glass>
      <div className="space-y-5">
        <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Payment intents</p>{paymentIntents.length ? <div className="mt-4 space-y-3">{paymentIntents.slice(0, 5).map((intent) => <RouteLine key={intent.paymentIntentId} label={intent.paymentIntentId?.slice(0, 18) || "intent"} value={intent.status || "pending"} tone={intent.status === "settled" ? "good" : "warn"} />)}</div> : <EmptyState title="No payment intents" detail="Approved provider calls create payment intents." />}</Glass>
        <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Provider deliveries</p>{deliveries.length ? <div className="mt-4 space-y-3">{deliveries.slice(0, 5).map((delivery) => <RouteLine key={delivery.deliveryId || delivery.receiptId} label={delivery.providerId || "provider"} value={delivery.status || "pending"} tone={delivery.status === "delivered" ? "good" : "warn"} />)}</div> : <EmptyState title="No provider deliveries" detail="Provider delivery records appear after paid calls complete." />}</Glass>
      </div>
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
  return <Glass className="border-y border-slate-200 p-5"><p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Submission metrics</p><h2 className="mt-1 text-2xl font-black text-slate-950">Users, transactions, volume, receipts</h2><div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-3 xl:grid-cols-4">{liveMetrics.map(([label, value]) => <div key={label} className="border-t border-slate-200 pt-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-slate-950">{value}</p></div>)}</div></Glass>;
}

function DeveloperPanel() {
  return <Developers />;
}

function MarketNetworkWorkspace({ live, latestResult }) {
  const metrics = live?.dashboard?.metrics;
  return (
    <div className="space-y-8">
      <ActionBand
        eyebrow="Market Network"
        title="Provider marketplace, trust policy, and route selection in one place."
        metrics={[
          ["Providers used", metrics?.providersUsed || live?.services?.length || 0],
          ["Min trust", live?.workspace?.policy?.minProviderTrustScore || 85],
          ["Route score", live?.workspace?.policy?.minRouteScore || 80],
        ]}
      />
      <MarketplacePanel live={live} />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <ScorecardPanel latestResult={latestResult} />
        <PolicyPanel live={live} />
      </div>
      <ProviderPanel live={live} />
    </div>
  );
}

function ProofOpsWorkspace({ live, latestResult, runReconciliation, reconciliationRunning }) {
  const metrics = live?.dashboard?.metrics;
  return (
    <div className="space-y-8">
      <ActionBand
        eyebrow="Proof & Operations"
        title="Audit the chain of intent, payment, delivery, receipt, and reconciliation."
        metrics={[
          ["Receipts", metrics?.receiptsCreated || live?.receipts?.length || 0],
          ["USDC routed", metrics?.totalVolumeUSDC || "0"],
          ["Reconciliation runs", live?.reconciliationRuns?.length || 0],
        ]}
      />
      <ProofPanel live={live} latestResult={latestResult} />
      <HistoryPanel live={live} />
      <ReconciliationPanel live={live} runReconciliation={runReconciliation} reconciliationRunning={reconciliationRunning} />
      <MetricsPanel live={live} />
      <DeveloperPanel />
    </div>
  );
}

function ActionBand({ eyebrow, title, metrics }) {
  return (
    <div className="grid gap-5 border-y border-slate-200 bg-white/35 py-5 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h2>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-200 border-y border-slate-200 bg-white/50">
        {metrics.map(([label, value]) => (
          <div key={label} className="p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</p>
            <p className="mt-1 truncate text-lg font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AngoraUiCanvas() {
  const [view, setView] = useState("landing");
  const [tab, setTab] = useState("workspace");
  const [completed, setCompleted] = useState(0);
  const [live, setLive] = useState(null);
  const [agentGoal, setAgentGoal] = useState("Evaluate whether this BTC prediction market is mispriced after breaking news and route the paid services needed for a proof-backed recommendation.");
  const [agentRunning, setAgentRunning] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [reconciliationRunning, setReconciliationRunning] = useState(false);

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

  const openConsole = (target = "workspace") => {
    const legacyTargets = {
      chat: "workspace",
      run: "workspace",
      marketplace: "network",
      market: "network",
      scorecard: "network",
      routing: "network",
      policy: "network",
      providers: "network",
      proof: "ops",
      reconciliation: "ops",
      history: "ops",
      metrics: "ops",
      developers: "ops",
    };
    setTab(legacyTargets[target] || target);
    setView("console");
  };

  const runAgentMission = async () => {
    setAgentRunning(true);
    try {
      const response = await api("/v1/angora/agent-missions/run", {
        method: "POST",
        body: JSON.stringify({
          userGoal: agentGoal,
          paymentMode: "arc_testnet",
          budgetUSDC: "0.05",
          maxPricePerCallUSDC: "0.01",
          proofRequired: true,
        }),
      });
      setLatestResult(response.result);
      setCompleted(runSteps.length);
      await refreshLive();
    } catch (error) {
      console.warn("Angora agent mission unavailable", error);
    } finally {
      setAgentRunning(false);
    }
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

  const runReconciliation = async () => {
    setReconciliationRunning(true);
    try {
      await api("/v1/angora/reconciliation/run", { method: "POST", body: JSON.stringify({}) });
      await refreshLive();
    } catch (error) {
      console.warn("Angora reconciliation unavailable", error);
    } finally {
      setReconciliationRunning(false);
    }
  };

  const Panel = useMemo(() => {
    const panelMap = {
      workspace: AgentChatPanel,
      network: MarketNetworkWorkspace,
      ops: ProofOpsWorkspace,
    };
    return panelMap[tab] || AgentChatPanel;
  }, [tab]);

  if (view === "landing") {
    return <Landing openConsole={openConsole} />;
  }

  return (
    <ConsoleShell activeTab={tab} setActiveTab={setTab} goHome={() => setView("landing")} live={live} latestResult={latestResult}>
      <Panel runDemo={runDemo} completed={completed} live={live} runAgentMission={runAgentMission} agentGoal={agentGoal} setAgentGoal={setAgentGoal} agentRunning={agentRunning} latestResult={latestResult} runReconciliation={runReconciliation} reconciliationRunning={reconciliationRunning} />
    </ConsoleShell>
  );
}
