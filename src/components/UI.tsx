import React, { useState } from 'react';
import {
  Award,
  Lock,
  FileText,
  X,
  Check,
  Shield,
  EyeOff,
  Eye,
  Clock3,
  Calculator,
  Languages,
  FlaskConical,
  MessageSquare,
  Bot,
  Users,
  HelpCircle,
  BookOpen,
  Calendar,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { Attempt, User, Lesson } from '../types';
import { LEVELS, SUBJECTS, MAX_SUB_LEVEL } from '../data/seedData';
import logoUrl from '../assets/logo.png';

// Official AN TÂM EDUCATION brand mark (icon + wordmark baked into one image).
export function AnTamLogo({ className = "", size = 48 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="AN TÂM EDUCATION"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: "auto" }}
    />
  );
}

// Brand colors lifted from the physical storefront sign (deep pine green + gold),
// used only by RoleBanner — the rest of the app keeps its lighter emerald palette.
const BRAND_GREEN_DEEP = "#0E3B2A";
const BRAND_GREEN_MID = "#145C3F";
const BRAND_GREEN_DARK = "#0A2E20";
const BRAND_GOLD = "#F0B429";
const BRAND_GOLD_INK = "#9A6B0C";

const STUDENT_CHIPS = [
  { icon: <Calculator size={14} />, label: "Toán", tone: "bg-sky-50 text-sky-700" },
  { icon: <BookOpen size={14} />, label: "Văn", tone: "bg-amber-50 text-amber-700" },
  { icon: <Languages size={14} />, label: "Tiếng Anh", tone: "bg-blue-50 text-blue-700" },
  { icon: <FlaskConical size={14} />, label: "KHTN", tone: "bg-emerald-50 text-emerald-700" },
];
const TEACHER_CHIPS = [
  { icon: <MessageSquare size={14} />, label: "Bài viết", tone: "bg-sky-50 text-sky-700" },
  { icon: <FileText size={14} />, label: "Tài liệu", tone: "bg-indigo-50 text-indigo-700" },
  { icon: <Bot size={14} />, label: "Chatbot", tone: "bg-emerald-50 text-emerald-700" },
];
const ADMIN_CHIPS = [
  { icon: <Users size={14} />, label: "Học sinh", tone: "bg-emerald-50 text-emerald-700" },
  { icon: <HelpCircle size={14} />, label: "Câu hỏi", tone: "bg-indigo-50 text-indigo-700" },
  { icon: <BookOpen size={14} />, label: "Bài học", tone: "bg-cyan-50 text-cyan-700" },
  { icon: <MessageSquare size={14} />, label: "Bài viết", tone: "bg-amber-50 text-amber-700" },
];

interface RoleBannerProps {
  role: 'student' | 'teacher' | 'admin';
  name: string;
  grade?: number;
}

// Landing-page banner echoing the real AN TÂM EDUCATION storefront sign:
// a white panel (logo, headline, subject/tool chips) framed by the deep
// green + gold brand palette, with a bottom info strip standing in for the
// sign's phone/address/website row.
export function RoleBanner({ role, name, grade }: RoleBannerProps) {
  const today = new Date().toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const meta = role === 'student'
    ? {
        eyebrow: "Không gian học tập",
        heading: `Chào mừng trở lại, ${name}!`,
        tagline: "Học vững tâm, thi an tâm — chinh phục từng bài học mỗi ngày.",
        chips: STUDENT_CHIPS,
      }
    : role === 'teacher'
      ? {
          eyebrow: "Không gian giảng dạy",
          heading: `Chào mừng trở lại, ${name}!`,
          tagline: "Đồng hành cùng học sinh trên hành trình vững tâm mỗi ngày.",
          chips: TEACHER_CHIPS,
        }
      : {
          eyebrow: "Trung tâm quản trị",
          heading: `Xin chào, ${name}!`,
          tagline: "Toàn quyền quản lý chương trình học, tài khoản và nội dung của AN TÂM EDUCATION.",
          chips: ADMIN_CHIPS,
        };

  return (
    <div
      className="relative rounded-3xl p-2 sm:p-2.5 shadow-lg mb-6 overflow-hidden animate-fadeUp"
      style={{ background: `linear-gradient(135deg, ${BRAND_GREEN_MID} 0%, ${BRAND_GREEN_DEEP} 55%, ${BRAND_GREEN_DARK} 100%)` }}
    >
      <div
        className="pointer-events-none absolute -top-16 left-10 w-56 h-56 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${BRAND_GOLD} 0%, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute -top-20 right-24 w-40 h-40 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
      />

      <div className="relative bg-white rounded-2xl px-5 py-5 sm:px-7 sm:py-6 flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-center shrink-0 lg:pr-6 lg:border-r lg:border-slate-100">
          <AnTamLogo size={68} />
        </div>

        <div className="flex-1 min-w-0 lg:pr-6 lg:border-r lg:border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: BRAND_GOLD_INK }}>
            {meta.eyebrow}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold mt-1 text-balance" style={{ color: BRAND_GREEN_DEEP }}>
            {meta.heading}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md">{meta.tagline}</p>

          {role === 'student' && grade ? (
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mt-3" style={{ background: BRAND_GREEN_DEEP }}>
              {[6, 7, 8, 9].map((g, i) => (
                <React.Fragment key={g}>
                  {i > 0 && <span className="text-xs" style={{ color: BRAND_GOLD }}>•</span>}
                  <span
                    className="text-sm font-extrabold"
                    style={{ color: g === grade ? BRAND_GOLD : "rgba(255,255,255,0.35)" }}
                  >
                    {g}
                  </span>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mt-3 text-xs font-bold uppercase tracking-wide border"
              style={{ borderColor: BRAND_GOLD, color: BRAND_GREEN_DEEP }}
            >
              {role === 'teacher' ? 'Giáo viên' : 'Quản trị viên'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-[230px]">
          {meta.chips.map(chip => (
            <span key={chip.label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl ${chip.tone}`}>
              {chip.icon}
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 sm:px-7 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
          <Calendar size={13} style={{ color: BRAND_GOLD }} />
          <span className="capitalize">{today}</span>
        </span>
        {role === 'student' && grade && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
            <GraduationCap size={13} style={{ color: BRAND_GOLD }} />
            Khối {grade}
          </span>
        )}
        {role === 'teacher' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
            <MessageSquare size={13} style={{ color: BRAND_GOLD }} />
            Chia sẻ kiến thức mỗi tuần
          </span>
        )}
        {role === 'admin' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
            <ShieldCheck size={13} style={{ color: BRAND_GOLD }} />
            Toàn quyền hệ thống
          </span>
        )}
      </div>
    </div>
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

// --- Content / quiz visibility helpers ---
export function isContentVisible(item: { hidden?: boolean; visibleAt?: string }): boolean {
  if (item.visibleAt) return new Date(item.visibleAt).getTime() <= Date.now();
  return !item.hidden;
}

export function isLessonContentVisible(lesson: Lesson): boolean {
  return isContentVisible({ hidden: lesson.contentHidden, visibleAt: lesson.contentVisibleAt });
}

export function isLessonQuizVisible(lesson: Lesson): boolean {
  return isContentVisible({ hidden: lesson.quizHidden, visibleAt: lesson.quizVisibleAt });
}

// Helper scoring structures (progression is now driven by ordered Lessons per subject/grade)
export function orderedLessons(lessons: Lesson[], subject: string, grade: number): Lesson[] {
  return lessons.filter(l => l.subject === subject && l.grade === grade).sort((a, b) => a.order - b.order);
}

// Best attempt per (subject, grade, lesson) — regardless of sub-level, used for lesson-wide "best score" displays.
export function bestAttemptsByLesson(attempts: Attempt[], userId: string): Record<string, Attempt> {
  const map: Record<string, Attempt> = {};
  attempts.filter(a => a.userId === userId).forEach(a => {
    const key = `${a.subject}|${a.grade}|${a.lessonId}`;
    if (!map[key] || a.score > map[key].score) {
      map[key] = a;
    }
  });
  return map;
}

// Best attempt per (subject, grade, lesson, sub-level) — drives the Cấp 1/2/3 unlock chain inside a lesson.
export function bestAttemptsByLessonLevel(attempts: Attempt[], userId: string): Record<string, Attempt> {
  const map: Record<string, Attempt> = {};
  attempts.filter(a => a.userId === userId).forEach(a => {
    const key = `${a.subject}|${a.grade}|${a.lessonId}|${a.level}`;
    if (!map[key] || a.score > map[key].score) {
      map[key] = a;
    }
  });
  return map;
}

// A lesson only counts as fully passed once its final sub-level (Cấp 3) has been passed.
export function isLessonFullyPassed(attempts: Attempt[], userId: string, subject: string, grade: number, lessonId: string): boolean {
  return attempts.some(a => a.userId === userId && a.subject === subject && a.grade === grade && a.lessonId === lessonId && a.level === MAX_SUB_LEVEL && a.passed);
}

export function highestPassedLessonOrder(attempts: Attempt[], lessons: Lesson[], userId: string, subject: string, grade: number): number {
  const ol = orderedLessons(lessons, subject, grade);
  let max = 0;
  ol.forEach(lesson => {
    if (isLessonFullyPassed(attempts, userId, subject, grade, lesson.id) && lesson.order > max) {
      max = lesson.order;
    }
  });
  return max;
}

export function isLessonUnlocked(attempts: Attempt[], lessons: Lesson[], userId: string, subject: string, grade: number, order: number): boolean {
  if (order <= 1) return true;
  return highestPassedLessonOrder(attempts, lessons, userId, subject, grade) >= order - 1;
}

// Sub-level unlock chain within a lesson: Cấp 1 opens once the lesson itself is unlocked;
// Cấp 2/3 open once the previous sub-level of the SAME lesson has been passed.
export function isSubLevelUnlocked(attempts: Attempt[], userId: string, subject: string, grade: number, lessonId: string, level: number, lessonUnlocked: boolean): boolean {
  if (level <= 1) return lessonUnlocked;
  return lessonUnlocked && attempts.some(a =>
    a.userId === userId && a.subject === subject && a.grade === grade &&
    a.lessonId === lessonId && a.level === level - 1 && a.passed
  );
}

export function userTotalPoints(attempts: Attempt[], userId: string): number {
  const map = bestAttemptsByLessonLevel(attempts, userId);
  return Object.values(map).reduce((sum, a) => sum + a.score, 0);
}

// Ladder rung styling reuses the LEVELS tier definitions, matched by lesson order position.
export function tierForOrder(order: number) {
  const idx = Math.min(Math.max(order - 1, 0), LEVELS.length - 1);
  return LEVELS[idx];
}

export function userMedals(attempts: Attempt[], lessons: Lesson[], userId: string, grade: number): Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; order: number }> {
  const medals: Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; order: number }> = [];
  SUBJECTS.forEach(subject => {
    const order = highestPassedLessonOrder(attempts, lessons, userId, subject, grade);
    if (order > 0) {
      const tier = tierForOrder(order);
      if (tier.medal) medals.push({ subject, medal: tier.medal, order });
    }
  });
  return medals;
}

export function computeLeaderboard(users: User[], attempts: Attempt[], lessons: Lesson[]): Array<{ user: User; points: number; activity: number; medals: Array<{ subject: string; medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương'; order: number }> }> {
  return users
    .filter(u => u.role === 'student')
    .map(u => {
      const points = userTotalPoints(attempts, u.id);
      const activity = attempts.filter(a => a.userId === u.id).length;
      const medals = userMedals(attempts, lessons, u.id, u.grade || 6);
      return { user: u, points, activity, medals };
    })
    .sort((a, b) => b.points - a.points || b.activity - a.activity);
}

// Flat, sequential lesson progress track — deliberately NOT a tiered/leveled ladder.
// Every lesson renders at the same size; status is shown via color/icon only.
interface LessonTrackProps {
  subject: string;
  grade: number;
  lessons: Lesson[];
  attempts: Attempt[];
  userId: string;
  onSelect?: (lessonId: string) => void;
  compact?: boolean;
}

export function LessonTrack({
  subject,
  grade,
  lessons,
  attempts,
  userId,
  onSelect,
  compact = false
}: LessonTrackProps) {
  const ol = orderedLessons(lessons, subject, grade).filter(isLessonQuizVisible);
  const passedMax = highestPassedLessonOrder(attempts, lessons, userId, subject, grade);
  const bestMap = bestAttemptsByLesson(attempts, userId);
  const size = compact ? "w-9 h-9 text-xs" : "w-11 h-11 text-sm";

  return (
    <div className="flex flex-wrap gap-2">
      {ol.map(lesson => {
        const unlocked = isLessonUnlocked(attempts, lessons, userId, subject, grade, lesson.order);
        const passed = passedMax >= lesson.order;
        const best = bestMap[`${subject}|${grade}|${lesson.id}`];

        return (
          <button
            key={lesson.id}
            disabled={!unlocked}
            onClick={() => onSelect && onSelect(lesson.id)}
            title={`${lesson.title}${best ? ` · ${best.score}/${best.total}` : ""}`}
            className={`${size} shrink-0 rounded-xl border-2 flex items-center justify-center font-bold transition-all ${
              passed
                ? "bg-emerald-500 border-emerald-500 text-white"
                : unlocked
                  ? `border-emerald-300 text-emerald-700 bg-white ${onSelect ? "cursor-pointer hover:border-emerald-500" : ""}`
                  : "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
            }`}
          >
            {passed ? <Check size={compact ? 14 : 16} /> : unlocked ? lesson.order : <Lock size={compact ? 12 : 14} />}
          </button>
        );
      })}
      {ol.length === 0 && (
        <p className="text-xs text-slate-400 italic py-2">
          Chưa có bài kiểm tra nào được mở cho môn học này.
        </p>
      )}
    </div>
  );
}

// --- Admin visibility toolbar: Hide / Show / Schedule display time ---
interface VisibilityToolbarProps {
  label: string;
  hidden?: boolean;
  visibleAt?: string;
  onHide: () => void;
  onShow: () => void;
  onSchedule: (isoDateTime: string) => void;
}

export function VisibilityToolbar({ label, hidden, visibleAt, onHide, onShow, onSchedule }: VisibilityToolbarProps) {
  const [scheduling, setScheduling] = useState(false);
  const [dt, setDt] = useState('');
  const scheduledFuture = !!visibleAt && new Date(visibleAt).getTime() > Date.now();
  const effectivelyHidden = scheduledFuture ? true : !!hidden;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-slate-500 mr-0.5">{label}:</span>
      <Badge tone={scheduledFuture ? "amber" : effectivelyHidden ? "slate" : "green"}>
        {scheduledFuture
          ? `Hẹn hiện: ${new Date(visibleAt!).toLocaleString("vi-VN")}`
          : effectivelyHidden ? "Đang ẩn" : "Đang hiện"}
      </Badge>
      <button
        onClick={onHide}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        title="Ẩn nội dung"
      >
        <EyeOff size={12} /> Ẩn nội dung
      </button>
      <button
        onClick={onShow}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
        title="Hiện nội dung"
      >
        <Eye size={12} /> Hiện nội dung
      </button>
      <button
        onClick={() => setScheduling(v => !v)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 transition-colors"
        title="Đặt thời gian hiển thị"
      >
        <Clock3 size={12} /> Đặt thời gian hiển thị
      </button>
      {scheduling && (
        <div className="flex items-center gap-1.5 mt-1 w-full">
          <input
            type="datetime-local"
            value={dt}
            onChange={e => setDt(e.target.value)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            onClick={() => {
              if (!dt) return;
              onSchedule(new Date(dt).toISOString());
              setScheduling(false);
              setDt('');
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Lưu lịch
          </button>
          <button
            onClick={() => setScheduling(false)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Huỷ
          </button>
        </div>
      )}
    </div>
  );
}
