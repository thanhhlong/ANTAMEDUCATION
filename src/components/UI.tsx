import React from 'react';
import { 
  Award, 
  Lock, 
  Unlock, 
  FileText, 
  X, 
  Check, 
  Shield 
} from 'lucide-react';
import { Attempt, User } from '../types';
import { LEVELS } from '../data/seedData';

export function AnTamLogo({ className = "", size = 48, withText = false }: { className?: string; size?: number; withText?: boolean }) {
  return (
    <svg 
      viewBox="0 0 200 200" 
      width={size} 
      height={size} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 3 Gold Stars at the top */}
      {/* Middle star (large) */}
      <path d="M100 12 L105 24 L118 24 L108 32 L112 44 L100 36 L88 44 L92 32 L82 24 L95 24 Z" fill="#e29c00" />
      {/* Left star (small) */}
      <path d="M72 23 L75 30 L83 30 L76 35 L79 42 L72 38 L65 42 L68 35 L61 30 L69 30 Z" fill="#e29c00" />
      {/* Right star (small) */}
      <path d="M128 23 L131 30 L139 30 L132 35 L135 42 L128 38 L121 42 L124 35 L117 30 L125 30 Z" fill="#e29c00" />

      {/* Human/Center Book Spine (Dark Green) */}
      {/* Head */}
      <circle cx="100" cy="54" r="10" fill="#004D25" />
      
      {/* Arms/Body (raising up) */}
      <path 
        d="M100 68 
           C112 68, 128 59, 142 54 
           C134 66, 118 84, 104 105 
           C102 108, 98 108, 96 105 
           C82 84, 66 66, 58 54 
           C72 59, 88 68, 100 68 Z" 
        fill="#004D25" 
      />

      {/* Inner pages (Gold) */}
      {/* Left gold wing */}
      <path 
        d="M58 45 
           L64 45 
           C64 45, 56 77, 92 93 
           C96 95, 96 98, 92 99 
           C66 99, 44 85, 44 85 
           C44 85, 53 59, 58 45 Z" 
        fill="#e29c00" 
      />
      {/* Right gold wing */}
      <path 
        d="M142 45 
           L136 45 
           C136 45, 144 77, 108 93 
           C104 95, 104 98, 108 99 
           C134 99, 156 85, 156 85 
           C156 85, 147 59, 142 45 Z" 
        fill="#e29c00" 
      />

      {/* Outer book lines (Dark Green) */}
      {/* Left green wing */}
      <path 
        d="M40 52 
           L47 52 
           C47 52, 40 79, 83 97 
           L83 103 
           C37 98, 40 52, 40 52 Z" 
        fill="#004D25" 
      />
      {/* Right green wing */}
      <path 
        d="M160 52 
           L153 52 
           C153 52, 160 79, 117 97 
           L117 103 
           C163 98, 160 52, 160 52 Z" 
        fill="#004D25" 
      />

      {/* Text labels if requested */}
      {withText && (
        <>
          <text 
            x="100" 
            y="136" 
            textAnchor="middle" 
            fill="#004D25" 
            fontWeight="900" 
            fontSize="26" 
            fontFamily="inherit" 
            letterSpacing="0.05em"
          >
            AN TÂM
          </text>
          <text 
            x="100" 
            y="163" 
            textAnchor="middle" 
            fill="#e29c00" 
            fontWeight="800" 
            fontSize="18" 
            fontFamily="inherit" 
            letterSpacing="0.18em"
          >
            EDUCATION
          </text>
          {/* Underline bar */}
          <line x1="75" y1="178" x2="125" y2="178" stroke="#004D25" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outlineDanger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon, 
  ...props 
}: ButtonProps) {
  const sizes = { 
    sm: "text-xs px-3 py-1.5 gap-1.5", 
    md: "text-sm px-4 py-2.5 gap-2", 
    lg: "text-base px-6 py-3 gap-2" 
  };
  
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100 active:scale-[.98]",
    secondary: "bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 active:scale-[.98]",
    ghost: "text-slate-600 hover:bg-slate-100 active:scale-[.98]",
    danger: "bg-red-600 text-white hover:bg-red-700 active:scale-[.98]",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[.98]",
    outlineDanger: "bg-white text-red-600 border border-red-200 hover:bg-red-50",
  };

  return (
    <button 
      {...props} 
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

export function Card({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      {...props} 
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'slate' }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    sky: "bg-sky-100 text-sky-700",
    bronze: "bg-amber-100 text-amber-800",
    silver: "bg-slate-200 text-slate-700",
    gold: "bg-yellow-100 text-yellow-800",
    diamond: "bg-sky-100 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-600 mb-1.5">{label}</span>}
      <input 
        {...props} 
        className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-shadow ${className}`} 
      />
    </label>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-600 mb-1.5">{label}</span>}
      <textarea 
        {...props} 
        className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-shadow ${className}`} 
      />
    </label>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="block text-sm font-medium text-slate-600 mb-1.5">{label}</span>}
      <select 
        {...props} 
        className={`w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-shadow ${className}`}
      >
        {children}
      </select>
    </label>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose}></div>
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88vh] overflow-y-auto animate-popIn`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ toast }: { toast: { msg: string; type: 'success' | 'error' | 'info' } | null }) {
  if (!toast) return null;
  const tones = { 
    success: "bg-emerald-600", 
    error: "bg-red-600", 
    info: "bg-emerald-500" 
  };
  return (
    <div className="fixed bottom-5 right-5 z-[100] animate-fadeUp">
      <div className={`${tones[toast.type] || tones.info} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium max-w-xs`}>
        {toast.type === 'error' ? <X size={16} /> : <Check size={16} />}
        {toast.msg}
      </div>
    </div>
  );
}

export function EmptyState({ icon = 'file', text }: { icon?: 'file' | 'test' | 'cert' | 'post' | 'chat'; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400">
      <FileText size={40} className="mb-3 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = (name || "?").split(" ").slice(-2).map(w => w[0]).join("").toUpperCase();
  return (
    <div 
      style={{ width: size, height: size }} 
      className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-xs shrink-0"
    >
      {initials}
    </div>
  );
}

export function MedalDot({ medal }: { medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương' | null }) {
  if (!medal) return null;
  const map: Record<string, string> = { "Đồng": "bronze", "Bạc": "silver", "Vàng": "gold", "Kim cương": "diamond" };
  const tone = map[medal] || "slate";
  const colors: Record<string, string> = { bronze: "#b45309", silver: "#94a3b8", gold: "#ca8a04", diamond: "#0ea5e9" };
  return (
    <span 
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" 
      style={{ background: colors[tone] + "20", color: colors[tone] }}
    >
      <Award size={13} /> {medal}
    </span>
  );
}

// Helper scoring structures
export function bestAttemptsByLevel(attempts: Attempt[], userId: string): Record<string, Attempt> {
  const map: Record<string, Attempt> = {};
  attempts.filter(a => a.userId === userId).forEach(a => {
    const key = `${a.subject}|${a.grade}|${a.level}`;
    if (!map[key] || a.score > map[key].score) {
      map[key] = a;
    }
  });
  return map;
}

export function highestPassedLevel(attempts: Attempt[], userId: string, subject: string, grade: number): number {
  let max = 0;
  attempts.filter(a => a.userId === userId && a.subject === subject && a.grade === grade && a.passed)
    .forEach(a => { 
      if (a.level > max) max = a.level; 
    });
  return max;
}

export function isLevelUnlocked(attempts: Attempt[], userId: string, subject: string, grade: number, level: number): boolean {
  if (level === 1) return true;
  return highestPassedLevel(attempts, userId, subject, grade) >= level - 1;
}

export function userTotalPoints(attempts: Attempt[], userId: string): number {
  const map = bestAttemptsByLevel(attempts, userId);
  return Object.values(map).reduce((sum, a) => sum + a.score, 0);
}

export function userMedals(attempts: Attempt[], userId: string, grade: number): Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; level: number }> {
  const medals: Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; level: number }> = [];
  ["Toán", "Tiếng Anh", "Văn", "KHTN"].forEach(subject => {
    const lvl = highestPassedLevel(attempts, userId, subject, grade);
    const info = LEVELS.find(l => l.id === lvl);
    if (info && info.medal) {
      medals.push({ subject, medal: info.medal, level: lvl });
    }
  });
  return medals;
}

export function computeLeaderboard(users: User[], attempts: Attempt[]): Array<{ user: User; points: number; activity: number; medals: Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; level: number }> }> {
  return users
    .filter(u => u.role === 'student')
    .map(u => {
      const points = userTotalPoints(attempts, u.id);
      const activity = attempts.filter(a => a.userId === u.id).length;
      const medals = userMedals(attempts, u.id, u.grade || 6);
      return { user: u, points, activity, medals };
    })
    .sort((a, b) => b.points - a.points || b.activity - a.activity);
}

interface LevelLadderProps {
  subject: string;
  grade: number;
  attempts: Attempt[];
  userId: string;
  onSelect?: (level: number) => void;
  compact?: boolean;
}

export function LevelLadder({ 
  subject, 
  grade, 
  attempts, 
  userId, 
  onSelect, 
  compact = false 
}: LevelLadderProps) {
  const passedMax = highestPassedLevel(attempts, userId, subject, grade);
  const bestMap = bestAttemptsByLevel(attempts, userId);
  
  return (
    <div className="relative w-full">
      <div className={`flex ${compact ? "gap-2" : "gap-3"} items-end w-full`}>
        {LEVELS.map((lv, idx) => {
          const unlocked = isLevelUnlocked(attempts, userId, subject, grade, lv.id);
          const passed = passedMax >= lv.id;
          const best = bestMap[`${subject}|${grade}|${lv.id}`];
          const h = compact ? 46 + idx * 14 : 60 + idx * 18;
          
          return (
            <button 
              key={lv.id} 
              disabled={!unlocked} 
              onClick={() => onSelect && onSelect(lv.id)}
              className={`group relative flex-1 flex flex-col items-center justify-end rounded-t-xl transition-all ${unlocked ? "cursor-pointer hover:-translate-y-1" : "cursor-not-allowed"}`}
              style={{ height: h }}
            >
              <div 
                className={`w-full h-full rounded-t-xl bg-gradient-to-t ${lv.grad} ${unlocked ? "opacity-100" : "opacity-30"} flex flex-col items-center justify-start pt-2 shadow-inner`}
              >
                {passed ? (
                  <Award size={compact ? 14 : 18} className="text-white animate-pulse" />
                ) : unlocked ? (
                  <Unlock size={compact ? 12 : 16} className="text-white/90" />
                ) : (
                  <Lock size={compact ? 12 : 16} className="text-white/80" />
                )}
              </div>
              <span className="mt-1.5 text-[10px] sm:text-xs font-semibold text-slate-600 text-center leading-tight">
                {lv.name}
              </span>
              {best && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {best.score}/10
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
