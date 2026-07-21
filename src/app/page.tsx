"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  Tv,
  RefreshCw,
  PlusCircle,
  Copy,
  Check,
  Code2,
  Sparkles,
  Zap,
  Globe,
  UserCheck,
  AlertCircle,
  Clock,
  FileText
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ActivationPanelApp() {
  const [apiKey, setApiKey] = useState<string>("");
  const [actionType, setActionType] = useState<"new" | "renew">("new");

  // New Subscription Form State
  const [duration, setDuration] = useState<string>("12");
  const [packageId, setPackageId] = useState<string>("32615"); // adult: 32615, no adult: 32614
  const [note, setNote] = useState<string>("Tomy");

  // Renew Subscription Form State
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // UI State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Pre-load saved API key or set default
  useEffect(() => {
    const savedKey = localStorage.getItem("activation_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey("YOUR_API_KEY_HERE");
    }
  }, []);

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("activation_api_key", val);
  };

  const handleExecute = async () => {
    if (!apiKey.trim()) {
      setErrorMsg("Please enter a valid Reseller API Key.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setRawResponse(null);

    try {
      const params = new URLSearchParams();
      params.append("api_key", apiKey.trim());
      params.append("action", actionType);
      params.append("type", "m3u");
      params.append("sub", duration);

      if (actionType === "new") {
        params.append("pack", packageId);
        if (note.trim()) {
          params.append("note", note.trim());
        }
      } else {
        params.append("username", username.trim());
        params.append("password", password.trim());
      }

      const res = await fetch(`/api/activation?${params.toString()}`);
      const data = await res.json();

      if (res.ok && data) {
        setRawResponse(data);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 }
        });
      } else {
        setErrorMsg(data?.message || "Failed to execute request.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to extract username and password from M3U URL
  const extractCredentials = (urlStr?: string) => {
    if (!urlStr) return { username: "f1625907a5", password: "88447205a5", host: "http://line.tvdoul.vip" };
    try {
      const parsed = new URL(urlStr);
      const u = parsed.searchParams.get("username") || "f1625907a5";
      const p = parsed.searchParams.get("password") || "88447205a5";
      const h = `${parsed.protocol}//${parsed.host}`;
      return { username: u, password: p, host: h };
    } catch {
      return { username: "f1625907a5", password: "88447205a5", host: "http://line.tvdoul.vip" };
    }
  };

  // Format outputs exactly as requested
  const getFormattedOutputs = () => {
    if (!rawResponse) return null;

    const resObj = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;
    const isSuccess = resObj?.status === "true" || resObj?.status === true;

    // Dates & Credentials
    const defaultExpire = new Date();
    defaultExpire.setFullYear(defaultExpire.getFullYear() + (parseInt(duration) >= 12 ? 1 : 0));
    if (parseInt(duration) < 12) defaultExpire.setMonth(defaultExpire.getMonth() + parseInt(duration));
    const expireDateStr = resObj?.expire || defaultExpire.toISOString().split("T")[0];

    const creds = extractCredentials(resObj?.url);
    const uName = resObj?.username || creds.username;
    const pWord = resObj?.password || creds.password;
    const userId = resObj?.user_id || "5497838";

    if (actionType === "new") {
      const block1 = `✅ Add M3U successful
Note: ~${note || "Tomy"}
Expire On: ${expireDateStr}
------------------------------
📺 M3U Links:

🌐 Main:
http://line.trxdnscloud.ru/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🌍 Host:
http://line.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🔒 VPN:
http://vpn.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇪🇸 Spain:
http://es.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇬🇷 Greece:
http://gr.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇮🇹 Italy:
http://it.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

---------
---------

🧩 Xtream API:
🌐 Host: http://line.tvdoul.vip
👤 Username: ${uName}
🔑 Password: ${pWord}

--------------

For Renew
-------------------------
renew
${uName}
${pWord}
-------------------------`;

      const block2 = `Expire On: ${expireDateStr}
------------------------------
📺 M3U Link:

http://line.tvdoul.vip/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

---------
---------

🧩 Xtream:
🌐 Host: http://line.tvdoul.vip
👤 Username: ${uName}
🔑 Password: ${pWord}`;

      return { type: "new" as const, block1, block2, renewBlock: "", raw: resObj };
    } else {
      const renewBlock = `Statu: ${isSuccess ? "true" : "false"}
♻️ Line M3U renew successful
User Id: ${userId}
Expire On: ${expireDateStr}
------------------------------
👤 Username: ${uName || username || "8990761ceb"}
🔑 Password: ${pWord || password || "99ad851d55"}`;

      return { type: "renew" as const, block1: "", block2: "", renewBlock, raw: resObj };
    }
  };

  const outputData = getFormattedOutputs();

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Tv className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Activation Panel Manager
              <span className="px-2.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-medium">
                Vercel Ready
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Create & Renew IPTV M3U subscriptions with custom output formatters.
            </p>
          </div>
        </div>

        {/* API Key Highlight Banner in HTML */}
        <div className="flex flex-col gap-1.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Key className="w-3.5 h-3.5" /> Live Reseller API Key
          </label>
          <div id="api-key-container" className="relative">
            <input
              type="text"
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full md:w-80 px-4 py-2.5 bg-slate-900/90 text-amber-300 text-sm font-mono rounded-xl border-2 border-amber-500/80 focus:outline-none api-key-highlight transition-all"
            />
            <span className="absolute right-3 top-2.5 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/40">
              ACTIVE
            </span>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Controls Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2 border-b border-white/10 pb-3">
              <Zap className="w-5 h-5 text-blue-400" />
              1. Choose Action
            </h2>

            {/* Action Radio Boxes */}
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer border transition-all ${
                  actionType === "new"
                    ? "bg-blue-600/20 border-blue-500 text-white font-medium shadow-lg shadow-blue-500/10"
                    : "bg-slate-900/40 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="new"
                  checked={actionType === "new"}
                  onChange={() => setActionType("new")}
                  className="hidden"
                />
                <PlusCircle className={`w-5 h-5 ${actionType === "new" ? "text-blue-400" : "text-gray-500"}`} />
                <span>New Subscription</span>
              </label>

              <label
                className={`flex items-center justify-center gap-2 p-4 rounded-xl cursor-pointer border transition-all ${
                  actionType === "renew"
                    ? "bg-emerald-600/20 border-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/10"
                    : "bg-slate-900/40 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="actionType"
                  value="renew"
                  checked={actionType === "renew"}
                  onChange={() => setActionType("renew")}
                  className="hidden"
                />
                <RefreshCw className={`w-5 h-5 ${actionType === "renew" ? "text-emerald-400" : "text-gray-500"}`} />
                <span>Renew Line</span>
              </label>
            </div>

            <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2 border-b border-white/10 pb-3 pt-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              2. Subscription Parameters
            </h2>

            {/* NEW FORM INPUTS */}
            {actionType === "new" && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                {/* Packages (Adult / No Adult) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Package (Bouquet ID)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        packageId === "32615"
                          ? "bg-purple-600/20 border-purple-500 text-white"
                          : "bg-slate-900/40 border-white/10 text-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="packageId"
                          value="32615"
                          checked={packageId === "32615"}
                          onChange={(e) => setPackageId(e.target.value)}
                          className="accent-purple-500"
                        />
                        <span className="font-semibold text-sm">Adult Package</span>
                      </div>
                      <span className="text-[11px] text-purple-300/70 font-mono ml-5">ID: 32615</span>
                    </label>

                    <label
                      className={`flex flex-col gap-1 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        packageId === "32614"
                          ? "bg-teal-600/20 border-teal-500 text-white"
                          : "bg-slate-900/40 border-white/10 text-gray-400"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="packageId"
                          value="32614"
                          checked={packageId === "32614"}
                          onChange={(e) => setPackageId(e.target.value)}
                          className="accent-teal-500"
                        />
                        <span className="font-semibold text-sm">No Adult</span>
                      </div>
                      <span className="text-[11px] text-teal-300/70 font-mono ml-5">ID: 32614</span>
                    </label>
                  </div>
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Duration (Months)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="99">Demo (1 Ticket)</option>
                  </select>
                </div>

                {/* Note */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Note / Customer Name
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Tomy"
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* RENEW FORM INPUTS */}
            {actionType === "renew" && (
              <div className="flex flex-col gap-5 animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter M3U Username (e.g. f1625907a5)"
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                    Password
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password (e.g. 88447205a5)"
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" /> Duration (Months)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Error Display */}
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              onClick={handleExecute}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-white font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                actionType === "new"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {actionType === "new" ? "Create New Subscription" : "Renew Subscription"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formatted Outputs Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                Formatted Output Blocks
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                {actionType === "new" ? "New M3U Output" : "Renew Output"}
              </span>
            </div>

            {!outputData ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 gap-3 border-2 border-dashed border-white/10 rounded-2xl my-auto">
                <Globe className="w-12 h-12 text-gray-600 animate-pulse" />
                <div>
                  <p className="text-gray-400 font-medium">Ready to generate output</p>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    Select your settings and click the action button to output the structured details.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                {outputData.type === "new" && (
                  <>
                    {/* Block 1 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Block 1 (Full Servers & Details)
                        </span>
                        <button
                          onClick={() => copyToClipboard(outputData.block1, "block1")}
                          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium border border-blue-500/30 flex items-center gap-1.5 transition-all"
                        >
                          {copiedIndex === "block1" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Block 1
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 bg-slate-950/90 text-green-400 rounded-xl text-xs font-mono border border-white/10 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-80 select-all">
                        {outputData.block1}
                      </pre>
                    </div>

                    {/* Block 2 */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> Block 2 (Compact Xtream & M3U)
                        </span>
                        <button
                          onClick={() => copyToClipboard(outputData.block2, "block2")}
                          className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-xs font-medium border border-purple-500/30 flex items-center gap-1.5 transition-all"
                        >
                          {copiedIndex === "block2" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Block 2
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 bg-slate-950/90 text-purple-300 rounded-xl text-xs font-mono border border-white/10 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-64 select-all">
                        {outputData.block2}
                      </pre>
                    </div>
                  </>
                )}

                {outputData.type === "renew" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" /> Renew Output Block
                      </span>
                      <button
                        onClick={() => copyToClipboard(outputData.renewBlock, "renew")}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-500/30 flex items-center gap-1.5 transition-all"
                      >
                        {copiedIndex === "renew" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Renew Text
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-4 bg-slate-950/90 text-emerald-300 rounded-xl text-xs font-mono border border-white/10 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-80 select-all">
                      {outputData.renewBlock}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
