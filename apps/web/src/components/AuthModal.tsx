import React, { useState } from 'react';
import { useWorkspaceStore, UserAccount } from '../stores/useWorkspaceStore';
import {
  User,
  Shield,
  Key,
  Cloud,
  HardDrive,
  Cpu,
  LogOut,
  X,
  Check,
  LogIn,
  Zap,
  Laptop,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [tab, setTab] = useState<'profile' | 'tokens' | 'quota' | 'login' | 'register'>('profile');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<UserAccount['plan']>('Developer Pro');
  const [tokenCopied, setTokenCopied] = useState(false);

  if (!state.isAuthModalOpen) return null;

  const isLoggedIn = state.isLoggedIn;
  const user = state.user;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    actions.loginUser(emailInput.trim(), nameInput.trim() || undefined, selectedPlan);
  };

  const handleQuickDemoLogin = (plan: UserAccount['plan'] = 'Developer Pro') => {
    actions.loginUser('developer@esp-studio.io', 'Embedded Systems Lead', plan);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText('espat_98a7f10b2c34d56e78f901a23b45c67d');
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-xs animate-fadeIn">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
          <div className="flex items-center space-x-2.5">
            <User className="w-4 h-4 text-[#58a6ff]" />
            <span className="font-bold text-white text-sm">
              {isLoggedIn ? 'ESP Studio Cloud Account' : 'Sign In or Continue as Guest'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isLoggedIn
                  ? 'bg-blue-950 text-[#58a6ff] border-blue-800'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800'
              }`}
            >
              {isLoggedIn ? user.plan : 'Guest Mode (Offline/Local)'}
            </span>
          </div>

          <button
            onClick={() => actions.setAuthModalOpen(false)}
            className="text-[#8b949e] hover:text-white p-1 rounded hover:bg-[#21262d]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#30363d] bg-[#0d1117] px-4">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => setTab('profile')}
                className={`py-2 px-3 font-semibold border-b-2 text-xs transition-colors ${
                  tab === 'profile' ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-white'
                }`}
              >
                Profile & Fleet
              </button>
              <button
                onClick={() => setTab('quota')}
                className={`py-2 px-3 font-semibold border-b-2 text-xs transition-colors ${
                  tab === 'quota' ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-white'
                }`}
              >
                Cloud Quotas
              </button>
              <button
                onClick={() => setTab('tokens')}
                className={`py-2 px-3 font-semibold border-b-2 text-xs transition-colors ${
                  tab === 'tokens' ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-white'
                }`}
              >
                API Tokens
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setTab('login')}
                className={`py-2 px-3 font-semibold border-b-2 text-xs transition-colors ${
                  tab === 'login' || tab === 'profile' ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`py-2 px-3 font-semibold border-b-2 text-xs transition-colors ${
                  tab === 'register' ? 'border-[#58a6ff] text-[#58a6ff]' : 'border-transparent text-[#8b949e] hover:text-white'
                }`}
              >
                Create Account
              </button>
            </>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {!isLoggedIn ? (
            // Guest / Not Logged In View
            <div className="space-y-4">
              {/* Guest Banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-start space-x-3">
                <Laptop className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-white text-xs">No account needed for local development!</div>
                  <p className="text-[#8b949e] text-[11px] leading-relaxed">
                    You can use ESP Studio completely free as a <strong>Guest Developer</strong>. Edit code in Monaco, compile offline via PlatformIO, upload via Web Serial, and export projects without creating an account.
                  </p>
                </div>
              </div>

              {/* Fast Demo Sign-In */}
              <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="text-[10px] text-[#8b949e] uppercase font-bold tracking-wider">
                  Test Cloud Features with One-Click:
                </div>
                <button
                  onClick={() => handleQuickDemoLogin('Developer Pro')}
                  className="w-full py-2 rounded-lg bg-[#1f6feb] hover:bg-[#388bfd] text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <Zap className="w-4 h-4 fill-current text-amber-300" />
                  <span>One-Click Sign In as Developer Pro (Demo)</span>
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSignIn} className="space-y-3">
                {tab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8b949e]">Full Name:</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-white text-xs outline-none focus:border-[#58a6ff]"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] text-[#8b949e]">Developer Email:</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-white text-xs outline-none focus:border-[#58a6ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-[#8b949e]">Password:</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-white text-xs outline-none focus:border-[#58a6ff]"
                  />
                </div>

                {tab === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#8b949e]">Select Plan:</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as any)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2 text-white text-xs outline-none"
                    >
                      <option value="Hobbyist Free">Hobbyist Free (Local Only)</option>
                      <option value="Developer Pro">Developer Pro (600 Cloud Min/mo)</option>
                      <option value="Enterprise Fleet">Enterprise Fleet (Unlimited)</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="submit"
                    disabled={!emailInput.trim()}
                    className="flex-1 py-2 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold text-xs flex items-center justify-center space-x-1.5 disabled:opacity-40 transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{tab === 'register' ? 'Create Account & Sign In' : 'Sign In'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => actions.setAuthModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] text-xs font-semibold"
                  >
                    Stay in Guest Mode
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // Logged In Views
            <>
              {tab === 'profile' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#0d1117] border border-[#21262d]">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                      ES
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{user.name}</div>
                      <div className="text-[#8b949e] text-xs mt-0.5">{user.email}</div>
                      <div className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>2FA Hardware Authentication Verified</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[#8b949e] font-semibold">Active Cloud Workspaces:</span>
                    <div className="p-3 rounded-lg bg-[#0d1117] border border-[#21262d] flex justify-between items-center">
                      <div>
                        <div className="text-white font-bold">AgriTech Fleet Operations</div>
                        <div className="text-[#8b949e] text-[10px]">Production Workspace • 14 Projects</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'quota' && (
                <div className="space-y-3">
                  {/* Build Minutes Meter */}
                  <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-semibold flex items-center space-x-1.5">
                        <Cloud className="w-4 h-4 text-[#58a6ff]" />
                        <span>Cloud Docker Compilation Workers</span>
                      </span>
                      <span className="text-[#58a6ff] font-bold">
                        {user.cloudBuildMinutesUsed} / {user.cloudBuildMinutesLimit} min
                      </span>
                    </div>
                    <div className="w-full bg-[#161b22] h-2 rounded-full overflow-hidden border border-[#30363d]">
                      <div
                        className="bg-[#1f6feb] h-full rounded-full transition-all"
                        style={{
                          width: `${(user.cloudBuildMinutesUsed / user.cloudBuildMinutesLimit) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-[#8b949e]">
                      Resets in 18 days • Xtensa gcc12_2_0 isolated runner queue
                    </div>
                  </div>

                  {/* S3 Storage Quota */}
                  <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-semibold flex items-center space-x-1.5">
                        <HardDrive className="w-4 h-4 text-purple-400" />
                        <span>Artifact & Firmware S3 Storage</span>
                      </span>
                      <span className="text-purple-400 font-bold">
                        {user.storageMbUsed} MB / {(user.storageMbLimit / 1024).toFixed(0)} GB
                      </span>
                    </div>
                    <div className="w-full bg-[#161b22] h-2 rounded-full overflow-hidden border border-[#30363d]">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(user.storageMbUsed / user.storageMbLimit) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-[#8b949e]">
                      Stores merged-firmware.bin, bootloader, and partitions
                    </div>
                  </div>

                  {/* Registered Devices */}
                  <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-semibold flex items-center space-x-1.5">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span>Registered Fleet Devices</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {user.registeredDevices} / {user.maxDevices} Devices
                      </span>
                    </div>
                    <div className="w-full bg-[#161b22] h-2 rounded-full overflow-hidden border border-[#30363d]">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(user.registeredDevices / user.maxDevices) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'tokens' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#21262d] space-y-2">
                    <div className="text-white font-bold text-xs flex items-center space-x-1.5">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Personal Access Token (CLI & Desktop Sync)</span>
                    </div>
                    <p className="text-[#8b949e] text-[11px]">
                      Use this token to authenticate Tauri desktop builds or CI/CD pipelines.
                    </p>

                    <div className="flex items-center space-x-2 pt-2">
                      <input
                        type="password"
                        readOnly
                        value="espat_98a7f10b2c34d56e78f901a23b45c67d"
                        className="bg-[#161b22] border border-[#30363d] px-3 py-1.5 rounded-lg text-white font-mono text-xs flex-1 outline-none"
                      />
                      <button
                        onClick={handleCopyToken}
                        className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white border border-[#30363d] flex items-center space-x-1 text-xs"
                      >
                        {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5" />}
                        <span>{tokenCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#30363d] flex items-center justify-between bg-[#0d1117]/60">
          {isLoggedIn ? (
            <>
              <button
                onClick={actions.logoutUser}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out (Switch to Guest Mode)</span>
              </button>

              <button
                onClick={() => actions.setAuthModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold"
              >
                Close
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#8b949e]">
                No credit card required. Free forever for embedded hackers.
              </span>
              <button
                onClick={() => actions.setAuthModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
