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
          setSavedLines(getSortedLines(data.lines));
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
        setSavedLines(getSortedLines(Array.isArray(data.lines) ? data.lines : []));
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

  // Helper to deduplicate history entries by username
  const deduplicateLines = (lines: SavedLine[]): SavedLine[] => {
    if (!Array.isArray(lines)) return [];
    const map = new Map<string, SavedLine>();
    lines.forEach((item) => {
      if (!item || !item.username) return;
      const key = item.username.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        const existing = map.get(key)!;
        const timeExisting = existing.expireDate ? new Date(existing.expireDate).getTime() : 0;
        const timeNew = item.expireDate ? new Date(item.expireDate).getTime() : 0;
        if (timeNew >= timeExisting) {
          map.set(key, item);
        }
      }
    });
    return Array.from(map.values());
  };

  // Helper to sort history entries so almost-expired ones are at the VERY TOP
  const getSortedLines = (lines: SavedLine[]): SavedLine[] => {
    const clean = deduplicateLines(lines);
    return clean.sort((a, b) => {
      const dateA = a.expireDate ? new Date(a.expireDate).getTime() : Infinity;
      const dateB = b.expireDate ? new Date(b.expireDate).getTime() : Infinity;
      if (dateA !== dateB) {
        return dateA - dateB; // Ascending: earliest expiration date (or expired) first!
      }
      return (b.id || "").localeCompare(a.id || "");
    });
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

  const parseExpireDate = (rawExpire: any, durationMonths: string, previousExpire?: string): string => {
    if (rawExpire) {
      // 1. Numeric timestamp (seconds vs milliseconds)
      const num = Number(rawExpire);
      if (!isNaN(num) && num > 0) {
        const ms = num < 100000000000 ? num * 1000 : num;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split("T")[0];
        }
      }
      // 2. Date string like "2027-07-22 10:46:00" or "2027-07-22"
      if (typeof rawExpire === "string") {
        const cleaned = rawExpire.trim().split(" ")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          return cleaned;
        }
        const d = new Date(rawExpire);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split("T")[0];
        }
      }
    }

    // 3. Fallback: calculate date by adding durationMonths to previous expire date or today
    let baseDate = new Date();
    if (previousExpire) {
      const cleanedPrev = previousExpire.trim().split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(cleanedPrev)) {
        const prevD = new Date(cleanedPrev);
        if (!isNaN(prevD.getTime()) && prevD.getTime() > Date.now()) {
          baseDate = prevD;
        }
      }
    }

    const months = parseInt(durationMonths) || 1;
    if (months >= 12) {
      baseDate.setFullYear(baseDate.getFullYear() + Math.floor(months / 12));
    } else {
      baseDate.setMonth(baseDate.getMonth() + months);
    }
    return baseDate.toISOString().split("T")[0];
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
        if (!username.trim() || !password.trim()) {
          setErrorMsg("Please enter both Username and Password to execute a line renewal.");
          setLoading(false);
          return;
        }
        if (duration === "99") {
          setErrorMsg("Invalid renewal duration. Demo duration (sub=99) cannot be used for renewing a line. Please select 1, 3, 6, or 12 months.");
          setLoading(false);
          return;
        }
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

        // Find matching line in history if renewing to preserve original userId, note, and expireDate
        const targetSearchUser = username.trim() || resObj?.username || creds.username;
        const matchedLine = savedLines.find(
          (item) => item.username.toLowerCase() === targetSearchUser.toLowerCase()
        );

        const uName = resObj?.username || creds.username || username.trim() || matchedLine?.username || "";
        const pWord = resObj?.password || creds.password || password.trim() || matchedLine?.password || "";
        
        // Update state parameters so UI inputs populate with created line details
        if (uName) setUsername(uName);
        if (pWord) setPassword(pWord);

        const uId = resObj?.user_id || resObj?.id || matchedLine?.userId || `ID-${Math.floor(1000000 + Math.random() * 9000000)}`;

        const rawApiExpire = resObj?.expire || resObj?.exp_date || resObj?.expire_date || resObj?.date_expire;
        const expireDateStr = parseExpireDate(rawApiExpire, duration, matchedLine?.expireDate);
        const itemNote = resObj?.note || matchedLine?.note || note || "Tomy";

        const formattedOutputs = formatOutputData(data, actionType, uName, pWord, uId, expireDateStr);

        const newRecord: SavedLine = {
          id: matchedLine ? matchedLine.id : `line_${Date.now()}`,
          type: actionType,
          userId: uId,
          username: uName,
          password: pWord,
          expireDate: expireDateStr,
          note: itemNote,
          packageId: packageId,
          duration: duration,
          createdTime: new Date().toLocaleString(),
          block1: actionType === "new" ? formattedOutputs.block1 : (matchedLine?.block1 || ""),
          block2: actionType === "new" ? formattedOutputs.block2 : (matchedLine?.block2 || ""),
          renewBlock: actionType === "renew" ? formattedOutputs.renewBlock : (matchedLine?.renewBlock || ""),
        };

        const updatedHistory = getSortedLines([newRecord, ...filteredHistory]);
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

    const targetUser = resObj?.username || creds.username || uNameParam || username || "";
    const matchedLine = savedLines.find(
      (item) => item.username.toLowerCase() === targetUser.toLowerCase()
    );

    const uName = targetUser || matchedLine?.username || "";
    const pWord = resObj?.password || creds.password || pWordParam || password || matchedLine?.password || "";
    const uId = resObj?.user_id || resObj?.id || uIdParam || matchedLine?.userId || `ID-${Math.floor(1000000 + Math.random() * 9000000)}`;

    const rawApiExpire = resObj?.expire || resObj?.exp_date || resObj?.expire_date || resObj?.date_expire;
    const expireDateStr = parseExpireDate(rawApiExpire, duration, expireDateParam || matchedLine?.expireDate);

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
      const msg = resObj?.message || (isSuccess ? "Line M3U renew successful" : "Line renew failed");
      const renewBlock = `Status: ${isSuccess ? "true" : "false"}
♻️ ${msg}
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

  const filteredHistory = getSortedLines(
    savedLines.filter(
      (item) =>
        item.username.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.note.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.userId.toLowerCase().includes(historySearch.toLowerCase())
    )
  );

  // Multi-User Login & Registration Lock Screen
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="panel-card w-full max-w-sm p-7 rounded-2xl border border-slate-800 flex flex-col gap-6 shadow-xl">
          <div className="flex flex-col items-center text-center gap-2.5">
            <div className="w-12 h-12 bg-slate-800/90 text-slate-200 rounded-xl border border-slate-700 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Activation Panel Workspace</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enter your password to access or auto-create your isolated user workspace.
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-3.5 py-2.5 bg-[#05070D] text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs font-mono"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Sign In / Access Workspace</span>
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
    <main className="min-h-screen p-4 sm:p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 panel-card p-5 rounded-2xl border border-slate-800/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20 flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-100 tracking-tight">Activation Panel</h1>
              <span className="px-2 py-0.5 text-[11px] bg-slate-800/80 text-slate-300 rounded-md border border-slate-700 font-mono">
                UID: {currentUid}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Isolated Reseller Account Workspace
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              activeTab === "settings"
                ? "bg-slate-800 text-white border-slate-700"
                : "bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" /> Settings
          </button>

          <button
            onClick={handleLogout}
            title="Logout User Account"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all font-medium text-xs flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-[#0B0F19] p-1 rounded-xl border border-slate-800/80 inline-flex items-center gap-1 self-start">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "create"
              ? "bg-slate-800 text-white border border-slate-700/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-indigo-400" /> Create & Renew Lines
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "history"
              ? "bg-slate-800 text-white border border-slate-700/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          Saved History
          <span className="px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-400 rounded border border-slate-800 font-mono">
            {savedLines.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
            activeTab === "settings"
              ? "bg-slate-800 text-white border border-slate-700/60 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Settings className="w-3.5 h-3.5 text-amber-400" /> Settings
        </button>
      </div>

      {/* TAB 1: CREATE & RENEW LINES */}
      {activeTab === "create" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="panel-card p-6 rounded-2xl flex flex-col gap-5 border border-slate-800/90">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> Subscription Action
                </h2>
              </div>

              {/* Action Segmented Toggle */}
              <div className="bg-[#05070D] p-1 rounded-xl border border-slate-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setActionType("new");
                    if (duration !== "99") setDuration("99");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    actionType === "new"
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" /> New Line
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionType("renew");
                    if (duration === "99") setDuration("12");
                  }}
                  className={`py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                    actionType === "renew"
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Renew Line
                </button>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 pt-1">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" /> Line Parameters
                </h2>
              </div>

              {/* NEW FORM INPUTS */}
              {actionType === "new" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300">
                        Package Bouquet
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveTab("settings")}
                        className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Settings className="w-3 h-3" /> Manage
                      </button>
                    </div>
                    <select
                      value={packageId}
                      onChange={(e) => setPackageId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
                    >
                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} (ID: {pkg.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-indigo-500"
                    >
                      <option value="99">Demo (1 Ticket) - Default</option>
                      <option value="1">1 Month</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                      <option value="12">12 Months (1 Year)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Customer Note
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Tomy"
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* RENEW FORM INPUTS */}
              {actionType === "renew" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Select User / Enter Username
                      </label>
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
                        className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-emerald-400 text-xs font-mono mb-1 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">-- Quick Select (Almost Expired First) --</option>
                        {getSortedLines(savedLines).map((item) => {
                          const expMs = item.expireDate ? new Date(item.expireDate).getTime() : 0;
                          const now = Date.now();
                          const isExpired = expMs < now;
                          const isSoon = !isExpired && expMs - now < 15 * 86400000;
                          const statusTag = isExpired ? "⚠️ EXPIRED" : isSoon ? "⏰ EXPIRING SOON" : "✅ ACTIVE";

                          return (
                            <option key={item.id} value={item.id}>
                              [{statusTag}] 👤 {item.username} ({item.note || "No Note"}) - Exp: {item.expireDate || "N/A"}
                            </option>
                          );
                        })}
                      </select>
                    )}

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username (e.g. f1625907a5)"
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (e.g. 88447205a5)"
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> Renewal Duration
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#05070D] border border-slate-800 rounded-xl text-slate-100 text-xs font-medium focus:outline-none focus:border-emerald-500"
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
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>{errorMsg}</div>
                </div>
              )}

              <button
                onClick={handleExecute}
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition-colors ${
                  actionType === "new"
                    ? "bg-indigo-600 hover:bg-indigo-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {actionType === "new" ? "Create Subscription" : "Execute Renewal"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatted Outputs Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="panel-card p-6 rounded-2xl flex flex-col gap-5 border border-slate-800/90 h-full">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" /> Generated Output Blocks
                </h2>
                <span className="text-xs text-slate-400 font-mono">UID: {currentUid}</span>
              </div>

              {!currentFormattedOutput ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-xl my-auto">
                  <Globe className="w-8 h-8 text-slate-700" />
                  <div>
                    <p className="text-slate-300 font-medium text-xs">Ready for generation</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submit parameters to view output links & credentials.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {actionType === "new" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-indigo-400" /> Block 1 (Full M3U Links & Credentials)
                          </span>
                          <button
                            onClick={() => copyToClipboard(currentFormattedOutput.block1, "block1")}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            {copiedIndex === "block1" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Block 1
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 bg-[#04060A] text-slate-200 rounded-xl text-xs font-mono border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-80 select-all">
                          {currentFormattedOutput.block1}
                        </pre>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Block 2 (Compact Xtream & M3U)
                          </span>
                          <button
                            onClick={() => copyToClipboard(currentFormattedOutput.block2, "block2")}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                          >
                            {copiedIndex === "block2" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Block 2
                              </>
                            )}
                          </button>
                        </div>
                        <pre className="p-4 bg-[#04060A] text-slate-200 rounded-xl text-xs font-mono border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-64 select-all">
                          {currentFormattedOutput.block2}
                        </pre>
                      </div>
                    </>
                  )}

                  {actionType === "renew" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5" /> Renewal Output Summary
                        </span>
                        <button
                          onClick={() => copyToClipboard(currentFormattedOutput.renewBlock, "renew")}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                        >
                          {copiedIndex === "renew" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Summary
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-4 bg-[#04060A] text-emerald-400 rounded-xl text-xs font-mono border border-slate-800/80 overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-80 select-all">
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
        <div className="panel-card p-6 rounded-2xl flex flex-col gap-6 border border-slate-800/90">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Saved Subscriptions History
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Workspace records for UID: <span className="text-slate-200 font-mono">{currentUid}</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search username, note..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#05070D] border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {savedLines.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear History
                </button>
              )}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-slate-700" />
              <p className="text-xs font-medium text-slate-400">No saved lines found</p>
              <p className="text-[11px] text-slate-500">
                Generated lines are saved under your current workspace UID.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHistory.map((line) => (
                <div
                  key={line.id}
                  className="p-4 bg-[#0B0F19] rounded-xl border border-slate-800/90 flex flex-col gap-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                          line.type === "new"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {line.type === "new" ? "NEW LINE" : "RENEWED"}
                      </span>
                      {(() => {
                        const expMs = line.expireDate ? new Date(line.expireDate).getTime() : 0;
                        const now = Date.now();
                        const isExpired = expMs < now;
                        const isSoon = !isExpired && expMs - now < 15 * 86400000;
                        if (isExpired) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              ⚠️ EXPIRED
                            </span>
                          );
                        }
                        if (isSoon) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              ⏰ SOON
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ✅ ACTIVE
                          </span>
                        );
                      })()}
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: <strong className="text-slate-200">{line.userId}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => deleteSavedLine(line.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-[#05070D] p-3 rounded-lg border border-slate-800/80 font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">USERNAME</span>
                      <span className="text-indigo-300 font-medium">{line.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PASSWORD</span>
                      <span className="text-indigo-300 font-medium">{line.password || "N/A"}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-500 block text-[10px]">NOTE</span>
                      <span className="text-slate-300">{line.note}</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-slate-500 block text-[10px]">EXPIRES ON</span>
                      <span
                        className={`font-semibold ${
                          (line.expireDate ? new Date(line.expireDate).getTime() : 0) < Date.now()
                            ? "text-rose-400"
                            : (line.expireDate ? new Date(line.expireDate).getTime() : 0) - Date.now() < 15 * 86400000
                            ? "text-amber-400 font-medium"
                            : "text-emerald-400"
                        }`}
                      >
                        {line.expireDate || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">
                    <span className="flex items-center gap-1 font-mono text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-500" /> {line.createdTime}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={() => {
                          setActionType("renew");
                          setUsername(line.username);
                          setPassword(line.password || "");
                          setActiveTab("create");
                        }}
                        className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-medium rounded border border-emerald-500/30 flex items-center gap-1 transition-colors text-[11px]"
                        title="Renew this user"
                      >
                        <RefreshCw className="w-3 h-3" /> Renew
                      </button>

                      {line.block1 && (
                        <button
                          onClick={() => copyToClipboard(line.block1!, `hist_b1_${line.id}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px]"
                        >
                          {copiedIndex === `hist_b1_${line.id}` ? "Copied" : "Copy B1"}
                        </button>
                      )}

                      {line.block2 && (
                        <button
                          onClick={() => copyToClipboard(line.block2!, `hist_b2_${line.id}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px]"
                        >
                          {copiedIndex === `hist_b2_${line.id}` ? "Copied" : "Copy B2"}
                        </button>
                      )}

                      {line.renewBlock && (
                        <button
                          onClick={() => copyToClipboard(line.renewBlock!, `hist_rn_${line.id}`)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px]"
                        >
                          {copiedIndex === `hist_rn_${line.id}` ? "Copied" : "Copy Summary"}
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
        <div className="panel-card p-6 sm:p-8 rounded-2xl flex flex-col gap-6 border border-slate-800/90">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-400" />
                Settings & Integration API
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuration for user workspace UID: <span className="text-slate-200 font-mono">{currentUid}</span>
              </p>
            </div>

            {settingsSuccess && (
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {settingsSuccess}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Reseller API Key & Brand Domain */}
            <div className="flex flex-col gap-4 bg-[#0B0F19] p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-3.5 h-3.5 text-indigo-400" /> Reseller API & Brand Settings
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configure your unique Reseller API Key string and default M3U brand domain name.
              </p>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-medium text-slate-300">API Key String</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => handleApiKeySave(e.target.value)}
                  placeholder="Paste Reseller API Key..."
                  className="w-full px-3.5 py-2.5 bg-[#05070D] text-indigo-300 text-xs font-mono rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-medium text-slate-300">Brand Domain (for generated M3U links)</label>
                <input
                  type="text"
                  value={brandDomain}
                  onChange={(e) => handleBrandDomainSave(e.target.value)}
                  placeholder="e.g. yourhost.tld"
                  className="w-full px-3.5 py-2.5 bg-[#05070D] text-slate-100 text-xs font-mono rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Section 2: Manage Packages & IDs */}
            <div className="flex flex-col gap-4 bg-[#0B0F19] p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-purple-400" /> IPTV Packages & Bouquet IDs
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customize package names and bouquet IDs (e.g. Adult: 32615, No Adult: 32614).
              </p>

              {/* Package List */}
              <div className="flex flex-col gap-2 my-1">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-2.5 bg-[#05070D] rounded-xl border border-slate-800/80 font-mono text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-200">{pkg.name}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[11px]">
                        ID: {pkg.id}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Package Form */}
              <form onSubmit={handleAddPackage} className="flex flex-col gap-3 pt-3 border-t border-slate-800/80">
                <span className="text-xs font-medium text-slate-300">Add Package Preset</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newPkgName}
                    onChange={(e) => setNewPkgName(e.target.value)}
                    placeholder="Package Name (e.g. Sports)"
                    className="px-3 py-2 bg-[#05070D] text-xs text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={newPkgId}
                    onChange={(e) => setNewPkgId(e.target.value)}
                    placeholder="Bouquet ID (e.g. 32616)"
                    className="px-3 py-2 bg-[#05070D] text-xs text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Custom Package
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
