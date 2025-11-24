"use client";

import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";

const SHAP_DATA = [
  { feature: "P_2_last", importance: 1.08, impact: "negative" },
  { feature: "P_2_mean3", importance: 0.52, impact: "negative" },
  { feature: "B_7_mean3", importance: 0.35, impact: "positive" },
  { feature: "S_3_mean6", importance: 0.31, impact: "positive" },
  { feature: "B_2_last", importance: 0.24, impact: "negative" },
  { feature: "B_1_last", importance: 0.24, impact: "positive" },
  { feature: "R_1_mean3", importance: 0.23, impact: "positive" },
  { feature: "D_42_mean12", importance: 0.21, impact: "positive" },
  { feature: "R_1_mean12", importance: 0.19, impact: "positive" },
  { feature: "B_11_last", importance: 0.17, impact: "positive" },
];

// Feature definitions - labels match backend feature names exactly
// Order matches backend EXPECTED_FEATURES in server.py
const TOP_FEATURES = [
  "P_2_last",
  "P_2_mean3",
  "B_7_mean3",
  "R_1_mean12",
  "B_2_last",
];

const FEATURES = [
  {
    id: "B_11_last",
    label: "B_11_last",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "1.55",
    category: "Balance",
    help: "Snapshot of balance severity. Higher values are correlated with default risk.",
  },
  {
    id: "B_1_last",
    label: "B_1_last",
    type: "number",
    step: "0.0001",
    min: "-0.60",
    max: "1.35",
    category: "Balance",
    help: "Normalized current balance snapshot. Higher values indicate higher debt utilization.",
  },
  {
    id: "B_2_last",
    label: "B_2_last",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "1.01",
    category: "Balance",
    help: "Residual balance metric. Lower values may indicate higher risk.",
  },
  {
    id: "B_2_mean6",
    label: "B_2_mean6",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "1.01",
    category: "Balance",
    help: "6-month average of balance exposure.",
  },
  {
    id: "B_37_last",
    label: "B_37_last",
    type: "number",
    step: "0.0001",
    min: "-1.25",
    max: "1.33",
    category: "Balance",
    help: "Indicator of available liquidity or balance buffer.",
  },
  {
    id: "B_7_mean3",
    label: "B_7_mean3",
    type: "number",
    step: "0.0001",
    min: "-0.11",
    max: "1.26",
    category: "Balance",
    help: "3-month trend in average balance. Rising trends can indicate increasing debt.",
  },
  {
    id: "B_9_last",
    label: "B_9_last",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "14.84",
    category: "Balance",
    help: "Ratio of balance to credit limit or similar metric.",
  },
  {
    id: "D_42_mean12",
    label: "D_42_mean12",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "4.04",
    category: "Delinquency",
    help: "12-month average of past delinquency events. Higher values indicate more past defaults.",
  },
  {
    id: "D_64_O_mean3",
    label: "D_64_O_mean3",
    type: "select",
    step: "1",
    min: "0",
    max: "1",
    category: "Delinquency",
    help: "Proportion of specific delinquency category 'O' over 3 months. 'O' often signifies a specific negative status.",
    options: [
      { value: "0", label: "No (0)" },
      { value: "1", label: "Yes (1)" },
    ],
  },
  {
    id: "P_2_last",
    label: "P_2_last",
    type: "number",
    step: "0.0001",
    min: "-0.46",
    max: "1.01",
    category: "Payment",
    help: "Historical payment behavior score. Higher values indicate better repayment history.",
  },
  {
    id: "P_2_mean3",
    label: "P_2_mean3",
    type: "number",
    step: "0.0001",
    min: "-0.35",
    max: "1.01",
    category: "Payment",
    help: "3-month average payment score. Consistently high scores are good.",
  },
  {
    id: "R_1_mean12",
    label: "R_1_mean12",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "1.76",
    category: "Risk",
    help: "12-month average of risk assessment indicators. Higher values indicate higher risk.",
  },
  {
    id: "R_1_mean3",
    label: "R_1_mean3",
    type: "number",
    step: "0.0001",
    min: "0.00",
    max: "2.43",
    category: "Risk",
    help: "Short-term (3-month) risk indicator average.",
  },
  {
    id: "S_3_mean6",
    label: "S_3_mean6",
    type: "number",
    step: "0.0001",
    min: "-0.31",
    max: "2.86",
    category: "Spend",
    help: "6-month average spending behavior. Changes in spending can signal financial stress.",
  },
];

export default function Home() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    if (typeof window !== "undefined") {
      checkMobile();
    }

    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const modelRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToModel = () => {
    modelRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Sample data taken from high-risk profiles in the test set
  const fillSample = () => {
    const sample = {
      B_11_last: "0.0637",
      B_1_last: "0.1002",
      B_2_last: "0.1439",
      B_2_mean6: "0.0583",
      B_37_last: "0.1022",
      B_7_mean3: "0.6182",
      B_9_last: "0.5462",
      D_42_mean12: "0.2765",
      D_64_O_mean3: "1",
      P_2_last: "-0.0159",
      P_2_mean3: "0.0889",
      R_1_mean12: "0.5451",
      R_1_mean3: "1.1711",
      S_3_mean6: "0.5017",
    };
    setFormData(sample);
  };

  const getWaterfallData = () => {
    if (!explanation) return [];

    let current = explanation.base_value;
    // Sort by absolute impact to show biggest drivers first
    const sorted = [...explanation.values]
      .sort((a: any, b: any) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 10);

    return sorted.map((item: any) => {
      const prev = current;
      current += item.value;
      const isPositive = item.value >= 0;

      return {
        name: item.feature,
        // Recharts stacked bar trick:
        // 'base' is the invisible bottom segment
        // 'value' is the visible colored segment
        // If positive change: base = prev, value = diff
        // If negative change: base = current, value = diff (abs)
        base: isPositive ? prev : current,
        contribution: Math.abs(item.value),
        originalValue: item.value,
        isPositive,
      };
    });
  };

  const waterfallData = getWaterfallData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Build payload in the exact order of FEATURES array to match backend expectations
      const payload: Record<string, number> = {};
      FEATURES.forEach((f) => {
        const value = formData[f.id];
        payload[f.id] = value ? parseFloat(value) || 0.0 : 0.0;
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.predictions && data.predictions.length > 0) {
        setResult(data.predictions[0]);
        setExplanation(data.explanation);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <div className="w-6 h-6 bg-white rounded-full" />
          <span className="text-xl font-bold tracking-tight">Credex</span>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-[#111] p-1 rounded-full border border-[#222]">
          <button
            onClick={scrollToAbout}
            className="px-5 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#222] rounded-full transition-all cursor-pointer"
          >
            About Model
          </button>
          <button
            onClick={scrollToFeatures}
            className="px-5 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#222] rounded-full transition-all cursor-pointer"
          >
            Features
          </button>
        </div>

        <button
          onClick={scrollToModel}
          className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Try Model
        </button>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center relative">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-900/20 blur-3xl rounded-full -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 blur-3xl rounded-full -z-10" />

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          Credit platform for <br />
          <span className="text-gray-400">smart decisions</span>
        </h1>

        <p className="text-gray-500 text-lg mb-12 max-w-2xl mx-auto">
          Predicts the probability of default based on a customer's financial
          features. All variables are anonymized for privacy following the AMEX
          Kaggle dataset guidelines.
        </p>

        {/* Prediction Form Card */}
        <div
          ref={modelRef}
          className="bg-[#0a0a0a] border border-[#222] rounded-3xl p-8 md:p-10 max-w-5xl mx-auto text-left shadow-2xl shadow-black/50 relative overflow-hidden scroll-mt-32"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-50" />

          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Risk Calculator</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter normalized customer metrics (features anonymized for
                privacy)
              </p>
            </div>
            <button
              onClick={fillSample}
              className="text-xs text-gray-400 hover:text-white underline underline-offset-4 transition-colors cursor-pointer w-full md:w-auto text-left mt-3 md:mt-0"
            >
              Load Sample Data
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((feature) => (
                <div key={feature.id} className="group relative">
                  <label
                    htmlFor={feature.id}
                    className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1.5 group-focus-within:text-white transition-colors"
                  >
                    {feature.label}
                    {TOP_FEATURES.includes(feature.id) && (
                      <span className="text-[10px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 rounded">
                        TOP
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    {feature.type === "select" ? (
                      <div className="relative">
                        <select
                          name={feature.id}
                          id={feature.id}
                          value={formData[feature.id] || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [feature.id]: e.target.value,
                            }))
                          }
                          className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-[#161616] transition-all appearance-none cursor-pointer"
                        >
                          <option value="" disabled>
                            Select value...
                          </option>
                          {feature.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          ▼
                        </div>
                      </div>
                    ) : (
                      <input
                        type={feature.type}
                        name={feature.id}
                        id={feature.id}
                        step={feature.step}
                        value={formData[feature.id] || ""}
                        onChange={handleChange}
                        placeholder={`${feature.min} — ${feature.max}`}
                        className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-white/30 focus:bg-[#161616] transition-all appearance-none"
                      />
                    )}
                    {feature.type !== "select" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#333] uppercase select-none pointer-events-none">
                        {feature.category}
                      </div>
                    )}
                  </div>
                  {feature.help && (
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block w-64 p-3 bg-[#222] border border-[#333] rounded-lg text-xs text-gray-300 shadow-xl z-10 leading-relaxed">
                      {feature.help}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Results Section */}
            {result !== null && (
              <div className="flex flex-col gap-4 w-full border-t border-[#222] pt-8">
                <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="">
                    <div className="text-xs text-gray-500 uppercase tracking-wider">
                      Probability
                    </div>
                    <div
                      className={`text-2xl font-mono font-bold ${
                        result > 0.5 ? "text-red-500" : "text-green-500"
                      }`}
                    >
                      {(result * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      result > 0.5
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-green-500/10 text-green-500 border-green-500/20"
                    }`}
                  >
                    {result > 0.5 ? "HIGH RISK" : "SAFE"}
                  </div>
                </div>

                {/* Waterfall Chart */}
                {explanation && (
                  <div className="w-full mt-6 bg-[#111] p-4 rounded-xl border border-[#222]">
                    <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
                      Prediction Drivers (Waterfall)
                    </h4>
                    <div className="h-[400px] md:h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={waterfallData}
                          layout="vertical"
                          margin={
                            isMobile
                              ? { top: 20, right: 10, left: -20, bottom: 20 }
                              : { top: 20, right: 30, left: 40, bottom: 20 }
                          }
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            stroke="#666"
                            tick={{ fill: "#666", fontSize: 10 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#666"
                            tick={{ fill: "#666", fontSize: 10 }}
                            width={80}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.05)" }}
                            content={({ active, payload }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-black border border-[#333] p-2 rounded shadow-xl text-xs">
                                    <p className="font-bold text-white mb-1">
                                      {data.name}
                                    </p>
                                    <p
                                      className={
                                        data.isPositive
                                          ? "text-red-400"
                                          : "text-emerald-400"
                                      }
                                    >
                                      Impact:{" "}
                                      {data.originalValue > 0 ? "+" : ""}
                                      {data.originalValue.toFixed(4)}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine
                            x={explanation.base_value}
                            stroke="#666"
                            strokeDasharray="3 3"
                            label={{
                              value: "Base",
                              fill: "#666",
                              fontSize: 10,
                              position: "top",
                            }}
                          />
                          <Bar dataKey="base" stackId="a" fill="transparent" />
                          <Bar
                            dataKey="contribution"
                            stackId="a"
                            radius={[2, 2, 2, 2]}
                          >
                            {waterfallData.map((entry: any, index: number) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.isPositive ? "#ef4444" : "#10b981"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                        <span>Increases Risk</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                        <span>Decreases Risk</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="sticky bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 -mx-8 md:mx-0 md:bg-transparent md:border-none md:static md:p-0 md:pt-8 flex justify-end z-50">
              <button
                type="submit"
                disabled={loading}
                className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-white/10 w-full md:w-auto"
              >
                {loading ? "Calculating..." : "Assess Risk"}
              </button>
            </div>
          </form>
        </div>

        {/* Features Analysis Section */}
        <div
          ref={featuresRef}
          className="mt-32 max-w-5xl mx-auto text-left scroll-mt-32"
        >
          <h2 className="text-3xl font-bold mb-8">Feature Analysis</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="p-6 bg-[#111] border border-[#222] rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Temporal Aggregation
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our model relies on a{" "}
                  <strong>12-month historical window</strong> of customer
                  behavior. Rather than using raw transaction logs, we
                  aggregated data over 3, 6, and 12-month intervals. This allows
                  the model to detect both recent changes in financial health
                  (e.g., a sudden spike in spending) and long-term stability
                  (e.g., consistent repayment over a year).
                </p>
              </div>
              <div className="p-6 bg-[#111] border border-[#222] rounded-2xl">
                <h3 className="text-lg font-semibold text-white mb-3">
                  Deterministic vs. Stochastic
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The input features (payment history, balance ratios) are{" "}
                  <strong>deterministic</strong>—they are fixed historical
                  facts. However, the target variable (future default) is{" "}
                  <strong>stochastic</strong>. The model estimates the{" "}
                  <em>probability</em> of this uncertain future event based on
                  the known behavioral patterns extracted from the historical
                  data.
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Feature Categories
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                The 700+ engineered features are derived from five key
                categories of anonymized financial variables:
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    D_*
                  </span>
                  <div>
                    <strong className="text-white block text-sm">
                      Delinquency
                    </strong>
                    <span className="text-gray-500 text-xs">
                      Indicators of past past-due payments or negative status.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    S_*
                  </span>
                  <div>
                    <strong className="text-white block text-sm">Spend</strong>
                    <span className="text-gray-500 text-xs">
                      Transaction volumes and spending behavior patterns.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    P_*
                  </span>
                  <div>
                    <strong className="text-white block text-sm">
                      Payment
                    </strong>
                    <span className="text-gray-500 text-xs">
                      Repayment history and maturity scores.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    B_*
                  </span>
                  <div>
                    <strong className="text-white block text-sm">
                      Balance
                    </strong>
                    <span className="text-gray-500 text-xs">
                      Current balance amounts and credit utilization ratios.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5">
                    R_*
                  </span>
                  <div>
                    <strong className="text-white block text-sm">Risk</strong>
                    <span className="text-gray-500 text-xs">
                      Internal risk estimates and aggregated risk signals.
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* About Section (Moved Below) */}
        <div
          ref={aboutRef}
          className="mt-32 max-w-5xl mx-auto text-left scroll-mt-32"
        >
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-6">Project Overview</h2>
              <div className="space-y-6 text-gray-400 leading-relaxed text-sm md:text-base">
                <p>
                  Credit default prediction is a task that has characteristics
                  of high dimensionality, class imbalance, scale, privacy
                  constraints, and financial impact. In the lending industry
                  today, transaction data is being generated at a massive scale,
                  comes in anonymized forms, and is critical for risk
                  management. The ability to process this vast amount of
                  historical records and generate accurate default probabilities
                  is a fundamental capability for modern lending institutions.
                </p>
                <p>
                  My project goal, which is to build a robust risk assessment
                  system, relies heavily on the ability to engineer features
                  from and model these large datasets. Credit risk modeling
                  involves training algorithms with millions of customer
                  snapshots to be able to forecast delinquencies and make
                  lending decisions without manual review of every case. The
                  higher the quality of features engineered into the XGBoost
                  models, the more reliable the predictions are because their
                  accuracy is dependent on the signal extracted from 12-month
                  historical windows to be able to distinguish safe borrowers
                  from risky ones. Also, the volume of digital transactions in
                  the economy has increased and the complexity of financial
                  behavior on these payment networks has increased accordingly.
                  To be able to protect lenders and borrowers alike relies on
                  the ability to interpret the signals they generate in their
                  transaction history and that history is also labelled big
                  data.
                </p>
                <p>
                  In conclusion, automated credit scoring is a technology that
                  will continue to evolve in the financial sector. Building this
                  mastery now is definitely required to deploying successful
                  machine learning solutions and better securing the financial
                  future.
                </p>
              </div>
            </div>

            <div className="space-y-8 sticky top-32">
              <div className="p-8 rounded-3xl bg-[#111] border border-[#222]">
                <h3 className="text-xl font-bold text-white mb-4">
                  Model Interpretation (SHAP)
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                  The chart below shows the top features driving the model's
                  decisions.
                  <br />
                  <span className="text-red-400 font-bold">Red</span> bars
                  indicate features where higher values{" "}
                  <strong>increase risk</strong>.
                  <br />
                  <span className="text-emerald-400 font-bold">Green</span> bars
                  indicate features where higher values{" "}
                  <strong>decrease risk</strong> (safer).
                </p>
                <div className="h-[500px] md:h-[400px] w-full -ml-2 md:-ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={SHAP_DATA}
                      layout="vertical"
                      margin={
                        isMobile
                          ? { top: 5, right: 10, left: -20, bottom: 5 }
                          : { top: 5, right: 30, left: 40, bottom: 5 }
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#333"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        stroke="#666"
                        tick={{ fill: "#666", fontSize: 10 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#999"
                        tick={{ fill: "#999", fontSize: 11 }}
                        width={80}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-black border border-[#333] p-2 rounded shadow-xl text-xs">
                                <p className="font-bold text-white mb-1">
                                  {data.feature}
                                </p>
                                <p className="text-gray-400">
                                  Importance:{" "}
                                  <span className="text-white font-mono">
                                    {data.importance.toFixed(4)}
                                  </span>
                                </p>
                                <p
                                  className={
                                    data.impact === "positive"
                                      ? "text-red-400"
                                      : "text-emerald-400"
                                  }
                                >
                                  {data.impact === "positive"
                                    ? "Increases Risk"
                                    : "Decreases Risk"}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                        {SHAP_DATA.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.impact === "positive"
                                ? "#ef4444"
                                : "#10b981"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-linear-to-br from-blue-900/20 to-purple-900/20 border border-white/10">
                <div className="text-blue-300 mb-2 text-sm font-bold uppercase">
                  Performance
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">
                  Validation Metrics
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-2xl font-bold text-white">0.945</div>
                    <div className="text-xs text-gray-500 uppercase">
                      AUC Score
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">XGBoost</div>
                    <div className="text-xs text-gray-500 uppercase">
                      Algorithm
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative BG X's */}
        <div className="absolute top-32 right-10 text-[#222] text-9xl font-serif opacity-20 select-none -z-20">
          ×
        </div>
        <div className="absolute bottom-10 left-10 text-[#222] text-8xl font-serif opacity-20 select-none -z-20">
          ×
        </div>
      </main>
    </div>
  );
}
