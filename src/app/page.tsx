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
  Search,
  UserPlus,
  User,
  Settings,
  Package,
  Plus,
  Save
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

interface CustomPackage {
  id: string;
  name: string;
}

const DEFAULT_PACKAGES: CustomPackage[] = [
  { id: "32615", name: "Adult Package" },
  { id: "32614", name: "No Adult Package" },
];

export default function ActivationPanelApp() {
  // Auth & Multi-User State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUid, setCurrentUid] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [adminPassInput, setAdminPassInput] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);

  // Core App State
  const [apiKey, setApiKey] = useState<string>("");
  const [brandDomain, setBrandDomain] = useState<string>("yourhost.tld");
  const [packages, setPackages] = useState<CustomPackage[]>(DEFAULT_PACKAGES);
  const [actionType, setActionType] = useState<"new" | "renew">("new");

  // Form State
  const [duration, setDuration] = useState<string>("99");
  const [packageId, setPackageId] = useState<string>("32615");
  const [note, setNote] = useState<string>("Tomy");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // History & Storage
  const [savedLines, setSavedLines] = useState<SavedLine[]>([]);
  const [activeTab, setActiveTab] = useState<"create" | "history" | "settings">("create");
  const [historySearch, setHistorySearch] = useState<string>("");

  // Settings Management State
  const [newPkgName, setNewPkgName] = useState<string>("");
  const [newPkgId, setNewPkgId] = useState<string>("");
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  // UI Execution State
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Check existing session login
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("trix_auth");
    const sessionUid = sessionStorage.getItem("trix_uid");
    const sessionPass = sessionStorage.getItem("trix_pass");

    if (sessionAuth === "true" && sessionUid && sessionPass) {
      setIsAuthenticated(true);
      setCurrentUid(sessionUid);
      setCurrentPassword(sessionPass);
      fetchCloudUserData(sessionUid);
    }
  }, []);

  const fetchCloudUserData = async (uid: string) => {
    try {
      const res = await fetch(`/api/activation?action=cloud_get&user_id=${uid}`);
      if (res.ok) {
        const data = await res.json();
        if (data.lines && Array.isArray(data.lines)) {
          setSavedLines(data.lines);
        } else {
          setSavedLines([]);
        }
        if (data.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setApiKey("");
        }
        if (data.brandDomain) {
          setBrandDomain(data.brandDomain);
        } else {
          setBrandDomain("yourhost.tld");
        }
        if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
          setPackageId(data.packages[0].id);
        } else {
          setPackages(DEFAULT_PACKAGES);
          setPackageId("32615");
        }
      }
    } catch (e) {
      console.error("Cloud fetch error for user", uid, e);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassInput.trim()) {
      setAuthError("Please enter a password.");
      return;
    }

    setAuthError(null);
    setLoading(true);

    try {
      const pass = adminPassInput.trim();
      const res = await fetch(`/api/activation?action=auth_login&password=${encodeURIComponent(pass)}`);
      const data = await res.json();

      if (res.ok && data.status === "true") {
        setIsAuthenticated(true);
        setCurrentUid(data.uid);
        setCurrentPassword(data.password);
        setApiKey(data.apiKey || "");
        setBrandDomain(data.brandDomain || "yourhost.tld");
        setSavedLines(Array.isArray(data.lines) ? data.lines : []);
        if (data.packages && Array.isArray(data.packages) && data.packages.length > 0) {
          setPackages(data.packages);
          setPackageId(data.packages[0].id);
        } else {
          setPackages(DEFAULT_PACKAGES);
          setPackageId("32615");
        }

        sessionStorage.setItem("trix_auth", "true");
        sessionStorage.setItem("trix_uid", data.uid);
        sessionStorage.setItem("trix_pass", data.password);
      } else {
        setAuthError(data.message || "Login failed.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUid("");
    setCurrentPassword("");
    setApiKey("");
    setSavedLines([]);
    setPackages(DEFAULT_PACKAGES);
    sessionStorage.removeItem("trix_auth");
    sessionStorage.removeItem("trix_uid");
    sessionStorage.removeItem("trix_pass");
  };

  const saveSettings = async (updatedApiKey: string, updatedPackages: CustomPackage[], updatedBrandDomain?: string) => {
    try {
      const activeBrandDomain = updatedBrandDomain !== undefined ? updatedBrandDomain : brandDomain;
      await fetch("/api/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cloud_save_settings",
          apiKey: updatedApiKey,
          packages: updatedPackages,
          brandDomain: activeBrandDomain,
          userId: currentUid,
        }),
      });
      setSettingsSuccess("Settings saved successfully!");
      setTimeout(() => setSettingsSuccess(null), 3000);
    } catch (e) {
      console.error("Failed to save settings to cloud", e);
    }
  };

  const handleApiKeySave = (val: string) => {
    setApiKey(val);
    saveSettings(val, packages, brandDomain);
  };

  const handleBrandDomainSave = (val: string) => {
    setBrandDomain(val);
    saveSettings(apiKey, packages, val);
  };

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPkgName.trim() || !newPkgId.trim()) return;

    const newPkg: CustomPackage = { id: newPkgId.trim(), name: newPkgName.trim() };
    const updated = [...packages, newPkg];
    setPackages(updated);
    if (!packageId) setPackageId(newPkg.id);

    setNewPkgName("");
    setNewPkgId("");
    saveSettings(apiKey, updated, brandDomain);
  };

  const handleDeletePackage = (id: string) => {
    if (packages.length <= 1) {
      alert("You must keep at least one package configuration!");
      return;
    }
    const updated = packages.filter((pkg) => pkg.id !== id);
    setPackages(updated);
    if (packageId === id) setPackageId(updated[0].id);
    saveSettings(apiKey, updated, brandDomain);
  };

  const deleteSavedLine = async (id: string) => {
    const updated = savedLines.filter((line) => line.id !== id);
    setSavedLines(updated);

    try {
      await fetch("/api/activation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cloud_delete", id, userId: currentUid }),
      });
    } catch (e) {
      console.error("Cloud delete error", e);
    }
  };

  const clearAllHistory = async () => {
    if (confirm("Are you sure you want to clear all your cloud saved history lines?")) {
      setSavedLines([]);

      try {
        await fetch("/api/activation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cloud_clear", userId: currentUid }),
        });
      } catch (e) {
        console.error("Cloud clear error", e);
      }
    }
  };

  const extractCredentials = (urlStr?: string) => {
    if (!urlStr) return { username: "", password: "", host: `http://line.${brandDomain}` };
    try {
      const parsed = new URL(urlStr);
      const u = parsed.searchParams.get("username") || "";
      const p = parsed.searchParams.get("password") || "";
      const h = `${parsed.protocol}//${parsed.host}`;
      return { username: u, password: p, host: h };
    } catch {
      return { username: "", password: "", host: `http://line.${brandDomain}` };
    }
  };

  const handleExecute = async () => {
    if (!apiKey.trim()) {
      setErrorMsg("Please configure your Reseller API Key in the Settings page.");
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

        // Save generated line automatically into current user's isolated history
        const resObj = Array.isArray(data) ? data[0] : data;
        const creds = extractCredentials(resObj?.url);
        const uName = resObj?.username || creds.username || username;
        const pWord = resObj?.password || creds.password || password;
        
        // Update state parameters so UI inputs populate with created line details
        if (uName) setUsername(uName);
        if (pWord) setPassword(pWord);

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

        // Post line to current user's Cloud Storage
        try {
          await fetch("/api/activation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "cloud_save", line: newRecord, userId: currentUid }),
          });
        } catch (e) {
          console.error("Failed to post line to cloud", e);
        }
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
    uNameParam?: string,
    pWordParam?: string,
    uIdParam?: string,
    expireDateParam?: string
  ) => {
    const resObj = Array.isArray(data) ? data[0] : data;
    const isSuccess = resObj?.status === "true" || resObj?.status === true;

    const creds = extractCredentials(resObj?.url);
    const uName = resObj?.username || creds.username || uNameParam || username || "";
    const pWord = resObj?.password || creds.password || pWordParam || password || "";
    const uId = resObj?.user_id || uIdParam || `ID-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const expireDateStr = resObj?.expire || expireDateParam || new Date().toISOString().split("T")[0];

    if (act === "new") {
      const block1 = `✅ Add M3U successful
Note: ~${note || "Tomy"}
Expire On: ${expireDateStr}
------------------------------
📺 M3U Links:

🌐 Main:
http://line.trxdnscloud.ru/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🌍 Host:
http://line.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🔒 VPN:
http://vpn.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇪🇸 Spain:
http://es.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇬🇷 Greece:
http://gr.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

🇮🇹 Italy:
http://it.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

---------
---------

🧩 Xtream API:
🌐 Host: http://line.${brandDomain}
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

http://line.${brandDomain}/get.php?username=${uName}&password=${pWord}&type=m3u_plus&output=ts

---------
---------

🧩 Xtream:
🌐 Host: http://line.${brandDomain}
👤 Username: ${uName}
🔑 Password: ${pWord}`;

      return { block1, block2, renewBlock: "" };
    } else {
      const renewBlock = `Statu: ${isSuccess ? "true" : "false"}
♻️ Line M3U renew successful
User Id: ${uId}
Expire On: ${expireDateStr}
------------------------------
👤 Username: ${uName}
🔑 Password: ${pWord}`;

      return { block1: "", block2: "", renewBlock };
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredHistory = savedLines.filter(
    (item) =>
      item.username.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.note.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.userId.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Multi-User Login & Registration Lock Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Multi-User Activation Panel</h1>
            <p className="text-xs text-gray-400">
              Enter any password to sign in or create a brand new isolated user account!
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                <span>Account Password</span>
                <span className="text-[10px] text-blue-400 font-normal">Creates account automatically</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  placeholder="Enter or create password..."
                  className="w-full px-4 py-3 bg-slate-900/90 text-white rounded-xl border border-white/10 focus:outline-none focus:border-blue-500 text-sm font-mono"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                💡 Entering a new password creates a separate isolated UID with your own API Key & settings.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              <span>Sign In / Create Account</span>
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
              <span className="px-2.5 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-mono">
                UID: {currentUid}
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Account: <strong className="text-white">{currentPassword}</strong> (Isolated Cloud Database)
            </p>
          </div>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              activeTab === "settings"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/10"
                : "bg-slate-900/60 text-gray-300 border-white/10 hover:border-white/20"
            }`}
          >
            <Settings className="w-4 h-4 text-amber-400" /> Settings & API
          </button>

          <button
            onClick={handleLogout}
            title="Logout User Account"
            className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all font-medium text-xs flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Switch Account
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
          My Saved Lines
          <span className="ml-1 px-2 py-0.5 text-xs bg-white/20 rounded-full font-mono">
            {savedLines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === "settings"
              ? "bg-amber-600 text-white shadow-lg shadow-amber-500/20"
              : "bg-slate-900/40 text-gray-400 hover:text-white border border-white/5"
          }`}
        >
          <Settings className="w-4 h-4 text-amber-300" />
          Settings
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
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                      <span>Package Selection</span>
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" /> Manage Packages
                      </button>
                    </label>

                    {/* Packages Dropdown / Selector from Settings */}
                    <select
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white font-medium focus:outline-none focus:border-blue-500"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (ID: {pkg.id})
                        </option>
                      ))}
                    </select>
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
                      <option value="99">Demo (1 Ticket) - Default</option>
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
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
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Username
                      </label>
                      {savedLines.length > 0 && (
                        <span className="text-[11px] text-emerald-400 font-mono">
                          {savedLines.length} Saved User{savedLines.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Saved Users Quick Selector */}
                    {savedLines.length > 0 && (
                      <select
                        onChange={(e) => {
                          const selected = savedLines.find((s) => s.id === e.target.value);
                          if (selected) {
                            setUsername(selected.username);
                            setPassword(selected.password || "");
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono mb-1 focus:outline-none"
                      >
                        <option value="">-- Quick Auto-fill from My History --</option>
                        {savedLines.map((item) => (
                          <option key={item.id} value={item.id}>
                            👤 {item.username} ({item.note || "No Note"}) - Exp: {item.expireDate}
                          </option>
                        ))}
                      </select>
                    )}

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
                <span className="text-xs text-gray-400 font-mono">Saved to UID: {currentUid}</span>
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
                My Saved Lines History
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Isolated database for user UID: <strong className="text-purple-300 font-mono">{currentUid}</strong>
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
              <p className="text-sm font-medium">No saved lines found for your user account</p>
              <p className="text-xs text-gray-500">
                Subscriptions you generate will be saved specifically under your isolated UID.
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

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setActionType("renew");
                          setUsername(line.username);
                          setPassword(line.password || "");
                          setActiveTab("create");
                        }}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 font-semibold rounded border border-emerald-500/40 flex items-center gap-1 transition-all"
                        title="Renew this user"
                      >
                        <RefreshCw className="w-3 h-3" /> Quick Renew
                      </button>

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

      {/* TAB 3: SETTINGS PAGE */}
      {activeTab === "settings" && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col gap-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                Account Settings & API Configuration
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Manage your Reseller API key and IPTV package list for account UID: <strong className="text-amber-300 font-mono">{currentUid}</strong>
              </p>
            </div>

            {settingsSuccess && (
              <div className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> {settingsSuccess}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section 1: Reseller API Key & Brand Domain */}
            <div className="flex flex-col gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> API & Brand Settings
              </h3>
              <p className="text-xs text-gray-400">
                Configure your Reseller API key and customized brand domain name.
              </p>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-semibold text-gray-300">API Key String</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => handleApiKeySave(e.target.value)}
                  placeholder="Paste your Reseller API key here..."
                  className="w-full px-4 py-3 bg-slate-950/90 text-amber-300 text-sm font-mono rounded-xl border-2 border-amber-500/80 focus:outline-none api-key-highlight"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-semibold text-gray-300">Brand Domain (for generated M3U links)</label>
                <input
                  type="text"
                  value={brandDomain}
                  onChange={(e) => handleBrandDomainSave(e.target.value)}
                  placeholder="e.g. yourhost.tld"
                  className="w-full px-4 py-3 bg-slate-950/90 text-amber-300 text-sm font-mono rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Section 2: Manage Packages & IDs */}
            <div className="flex flex-col gap-4 bg-slate-900/60 p-6 rounded-2xl border border-white/10">
              <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-400" /> IPTV Packages & Bouquet IDs
              </h3>
              <p className="text-xs text-gray-400">
                Add, edit or delete your IPTV package names and bouquet IDs (e.g. Adult: 32615, No Adult: 32614).
              </p>

              {/* Package List */}
              <div className="flex flex-col gap-2 my-2">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3 bg-slate-950/80 rounded-xl border border-white/5 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{pkg.name}</span>
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30">
                        ID: {pkg.id}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove package"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Package Form */}
              <form onSubmit={handleAddPackage} className="flex flex-col gap-3 pt-3 border-t border-white/10">
                <span className="text-xs font-semibold text-gray-300">Add New Custom Package</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="Package Name (e.g. Sports)"
                    className="px-3 py-2 bg-slate-950/90 text-xs text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    value={newPkgId}
                    onChange={(e) => setNewPkgId(e.target.value)}
                    placeholder="Bouquet ID (e.g. 32616)"
                    className="px-3 py-2 bg-slate-950/90 text-xs text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Package
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
