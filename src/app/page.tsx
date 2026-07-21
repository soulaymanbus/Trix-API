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
  FileText,
  Lock,
  LogOut,
  History,
  Trash2,
  Calendar,
  ShieldCheck,
  Search
} from "lucide-react";
import confetti from "canvas-confetti";

interface SavedLine {
  id: string;
  type: "new" | "renew";
  userId: string;
  username: string;
  password?: string;
  expireDate: string;
  note: string;
  packageId?: string;
  duration: string;
  createdTime: string;
  block1?: string;
  block2?: string;
  renewBlock?: string;
}

export default function ActivationPanelApp() {
  // Auth Password Gate state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPassInput, setAdminPassInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Core App State
  const [apiKey, setApiKey] = useState<string>("");
  const [actionType, setActionType] = useState<"new" | "renew">("new");

  // Form State
  const [duration, setDuration] = useState<string>("12");
  const [packageId, setPackageId] = useState<string>("32615");
  const [note, setNote] = useState<string>("Tomy");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // History & Storage
  const [savedLines, setSavedLines] = useState<SavedLine[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [historySearch, setHistorySearch] = useState<string>("");

  // UI Execution State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Check login & load saved storage
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("trix_auth");
    if (sessionAuth === "true") {
      setIsAuthenticated(true);
    }

    const savedKey = localStorage.getItem("activation_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey("YOUR_API_KEY_HERE");
    }

    const historyData = localStorage.getItem("trix_saved_lines");
    if (historyData) {
      try {
        setSavedLines(JSON.parse(historyData));
      } catch (e) {
        console.error("Failed to parse saved lines", e);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassInput === "admin999") {
      setIsAuthenticated(true);
      sessionStorage.setItem("trix_auth", "true");
      setAuthError(null);
    } else {
      setAuthError("Incorrect password! Access denied.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("trix_auth");
  };

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    localStorage.setItem("activation_api_key", val);
  };

  const deleteSavedLine = (id: string) => {
    const updated = savedLines.filter((line) => line.id !== id);
    setSavedLines(updated);
    localStorage.setItem("trix_saved_lines", JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    if (confirm("Are you sure you want to clear all saved history lines?")) {
      setSavedLines([]);
      localStorage.removeItem("trix_saved_lines");
    }
  };

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
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 }
        });

        // Save generated line automatically into history under admin user session
        const resObj = Array.isArray(data) ? data[0] : data;
        const creds = extractCredentials(resObj?.url);
        const uName = resObj?.username || creds.username || username;
        const pWord = resObj?.password || creds.password || password;
        const uId = resObj?.user_id || `ID-${Math.floor(1000000 + Math.random() * 9000000)}`;

        const defaultExpire = new Date();
        if (parseInt(duration) >= 12) {
          defaultExpire.setFullYear(defaultExpire.getFullYear() + 1);
        } else {
          defaultExpire.setMonth(defaultExpire.getMonth() + parseInt(duration));
        }
        const expireDateStr = resObj?.expire || defaultExpire.toISOString().split("T")[0];

        const formattedOutputs = formatOutputData(data, actionType, uName, pWord, uId, expireDateStr);

        const newRecord: SavedLine = {
          id: `line_${Date.now()}`,
          type: actionType,
          userId: uId,
          username: uName,
          password: pWord,
          expireDate: expireDateStr,
          note: note || "Tomy",
          packageId: packageId,
          duration: duration,
          createdTime: new Date().toLocaleString(),
          block1: formattedOutputs.block1,
          block2: formattedOutputs.block2,
          renewBlock: formattedOutputs.renewBlock,
        };

        const updatedHistory = [newRecord, ...savedLines];
        setSavedLines(updatedHistory);
        localStorage.setItem("trix_saved_lines", JSON.stringify(updatedHistory));
      } else {
        setErrorMsg(data?.message || "Failed to execute request.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const formatOutputData = (
    data: any,
    act: "new" | "renew",
    uName: string,
    pWord: string,
    uId: string,
    expireDateStr: string
  ) => {
    const resObj = Array.isArray(data) ? data[0] : data;
    const isSuccess = resObj?.status === "true" || resObj?.status === true;

    if (act === "new") {
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

      return { block1, block2, renewBlock: "" };
    } else {
      const renewBlock = `Statu: ${isSuccess ? "true" : "false"}
♻️ Line M3U renew successful
User Id: ${uId}
Expire On: ${expireDateStr}
------------------------------
👤 Username: ${uName || username}
🔑 Password: ${pWord || password}`;

      return { block1: "", block2: "", renewBlock };
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter history by search term
  const filteredHistory = savedLines.filter(
    (item) =>
      item.username.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.note.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.userId.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Render Password Lock Screen if not logged in
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Protected Panel Access</h1>
            <p className="text-xs text-gray-400">
              Please enter your administrator password to unlock tools & line history.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-slate-900/90 text-white rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm font-mono"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> Unlock Application
            </button>
          </form>
        </div>
      </main>
    );
  }

  const currentFormattedOutput = rawResponse
    ? formatOutputData(
        rawResponse,
        actionType,
        username,
        password,
        "5497838",
        new Date().toISOString().split("T")[0]
      )
    : null;

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
                Admin Authorized
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Create & Renew IPTV M3U subscriptions. All lines saved to history.
            </p>
          </div>
        </div>

        {/* API Key Input & User Logout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Key className="w-3.5 h-3.5" /> Reseller API Key
            </label>
            <div id="api-key-container" className="relative">
              <input
                type="text"
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Paste API key..."
                className="w-full md:w-72 px-4 py-2.5 bg-slate-900/90 text-amber-300 text-sm font-mono rounded-xl border-2 border-amber-500/80 focus:outline-none api-key-highlight transition-all"
              />
              <span className="absolute right-3 top-2.5 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/40">
                SAVED
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Logout Admin"
            className="self-end sm:self-auto p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === "create"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
          }`}
        >
          <Zap className="w-4 h-4" /> Create & Renew Lines
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === "history"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
              : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
          }`}
        >
          <History className="w-4 h-4" />
          Saved History Lines
          <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full font-mono">
            {savedLines.length}
          </span>
        </button>
      </div>

      {/* TAB 1: CREATE & RENEW LINES */}
      {activeTab === "create" && (
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
                2. Input Parameters
              </h2>

              {/* NEW FORM INPUTS */}
              {actionType === "new" && (
                <div className="flex flex-col gap-5 animate-in fade-in duration-300">
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
                      placeholder="Enter Username (e.g. f1625907a5)"
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

              {errorMsg && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

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
                <span className="text-xs text-gray-400 font-mono">Auto-saved to history</span>
              </div>

              {!currentFormattedOutput ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 gap-3 border-2 border-dashed border-white/10 rounded-2xl my-auto">
                  <Globe className="w-12 h-12 text-gray-600 animate-pulse" />
                  <div>
                    <p className="text-gray-400 font-medium">Ready to generate output</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">
                      Select your parameters and click submit to trigger API & output details.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  {actionType === "new" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Block 1 (Full Servers & Details)
                          </span>
                          <button
                            onClick={() => copyToClipboard(currentFormattedOutput.block1, "block1")}
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
                          {currentFormattedOutput.block1}
                        </pre>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Block 2 (Compact Xtream & M3U)
                          </span>
                          <button
                            onClick={() => copyToClipboard(currentFormattedOutput.block2, "block2")}
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
                          {currentFormattedOutput.block2}
                        </pre>
                      </div>
                    </>
                  )}

                  {actionType === "renew" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" /> Renew Output Block
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentFormattedOutput.renewBlock, "renew")}
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
                        {currentFormattedOutput.renewBlock}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED HISTORY LINES */}
      {activeTab === "history" && (
        <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                Saved Lines History
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                All subscriptions created or renewed by admin are automatically stored here.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search username, note..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {savedLines.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Clear History
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <FileText className="w-10 h-10 text-gray-600" />
              <p className="text-sm font-medium">No saved lines found</p>
              <p className="text-xs text-gray-500">
                Created lines will be listed here automatically with copy shortcuts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHistory.map((line) => (
                <div
                  key={line.id}
                  className="p-5 bg-slate-900/70 rounded-2xl border border-white/10 flex flex-col gap-4 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                          line.type === "new"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {line.type === "new" ? "NEW LINE" : "RENEWED"}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        User ID: <strong className="text-white">{line.userId}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => deleteSavedLine(line.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-white/5 font-mono">
                    <div>
                      <span className="text-gray-500 block text-[10px]">USERNAME</span>
                      <span className="text-amber-300 font-semibold">{line.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">PASSWORD</span>
                      <span className="text-amber-300 font-semibold">{line.password || "N/A"}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-500 block text-[10px]">NOTE</span>
                      <span className="text-gray-300">{line.note}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-500 block text-[10px]">EXPIRES ON</span>
                      <span className="text-emerald-400 font-semibold">{line.expireDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" /> {line.createdTime}
                    </span>

                    <div className="flex items-center gap-2">
                      {line.block1 && (
                        <button
                          onClick={() => copyToClipboard(line.block1!, `hist_b1_${line.id}`)}
                          className="px-2.5 py-1 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded border border-blue-500/30 flex items-center gap-1 transition-all"
                        >
                          {copiedIndex === `hist_b1_${line.id}` ? "Copied B1!" : "Copy B1"}
                        </button>
                      )}

                      {line.block2 && (
                        <button
                          onClick={() => copyToClipboard(line.block2!, `hist_b2_${line.id}`)}
                          className="px-2.5 py-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 rounded border border-purple-500/30 flex items-center gap-1 transition-all"
                        >
                          {copiedIndex === `hist_b2_${line.id}` ? "Copied B2!" : "Copy B2"}
                        </button>
                      )}

                      {line.renewBlock && (
                        <button
                          onClick={() => copyToClipboard(line.renewBlock!, `hist_rn_${line.id}`)}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded border border-emerald-500/30 flex items-center gap-1 transition-all"
                        >
                          {copiedIndex === `hist_rn_${line.id}` ? "Copied Renew!" : "Copy Renew"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
