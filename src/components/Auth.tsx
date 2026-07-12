import React, { useState } from 'react';
import { Shield, BookOpen, Trophy, Award } from 'lucide-react';
import { User } from '../types';
import { Input, Select, Button, AnTamLogo } from './UI';
import { GRADES, norm } from '../data/seedData';

interface AuthShellProps {
  children: React.ReactNode;
  subtitle?: string;
}

export function AuthShell({ children, subtitle }: AuthShellProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 rounded-3xl overflow-hidden shadow-xl bg-white animate-fadeUp">
        {/* Left decoration panel */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 text-white p-10 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10"></div>
          <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-white/10"></div>
          
          <div className="relative z-10 flex items-center">
            <div className="p-2 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0">
              <AnTamLogo size={132} />
            </div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold leading-tight mb-3">
              Học vững tâm,<br />thi an tâm.
            </h2>
            <p className="text-white/85 text-sm leading-relaxed max-w-sm">
              {subtitle || "Nền tảng học tập & kiểm tra trực tuyến cho học sinh khối 6–9, học và làm bài kiểm tra lần lượt theo từng bài học."}
            </p>

            <div className="mt-6 flex gap-4 text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <BookOpen size={15} /> 4 môn học
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy size={15} /> Kiểm tra từng bài
              </div>
              <div className="flex items-center gap-1.5">
                <Award size={15} /> 4 huy chương
              </div>
            </div>
          </div>
          
          <div className="relative z-10 text-xs text-white/60">
            © {new Date().getFullYear()} AN TÂM EDUCATION · Nền tảng học tập trực tuyến
          </div>
        </div>
        
        {/* Right form panel */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

interface LoginProps {
  onLogin: (user: User) => void;
  goRegister: () => void;
  users: User[];
}

export function LoginPage({ onLogin, goRegister, users }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = users.find(x => norm(x.email) === norm(email) && x.password === password);
    if (!u) {
      setError("Email hoặc mật khẩu không đúng.");
      return;
    }
    setError('');
    onLogin(u);
  };

  const quickFill = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
  };

  return (
    <div className="animate-fadeUp">
      <div className="lg:hidden flex flex-col items-center mb-6 text-center">
        <AnTamLogo size={120} />
      </div>
      
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Đăng nhập</h1>
      <p className="text-sm text-slate-500 mb-6">Chào mừng quay lại! Hãy đăng nhập để tiếp tục học tập.</p>
      
      <form onSubmit={submit} className="space-y-4">
        <Input 
          label="Email" 
          type="email" 
          placeholder="ban@antam.vn" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <Input 
          label="Mật khẩu" 
          type="password" 
          placeholder="••••••••" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        
        <Button type="submit" className="w-full justify-center" size="lg">
          Đăng nhập
        </Button>
      </form>
      
      <p className="text-sm text-slate-500 mt-5 text-center">
        Chưa có tài khoản?{" "}
        <button onClick={goRegister} className="text-emerald-600 font-semibold hover:underline">
          Đăng ký ngay
        </button>
      </p>
      
      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 mb-2 font-medium">Tài khoản demo (bấm để điền nhanh):</p>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => quickFill("admin@antam.vn", "admin123")} 
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
          >
            Admin
          </button>
          <button 
            onClick={() => quickFill("gv.lan@antam.vn", "gv123456")} 
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
          >
            Giáo viên
          </button>
          <button 
            onClick={() => quickFill("hs1@antam.vn", "hs123456")} 
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
          >
            Học sinh (Khối 6)
          </button>
        </div>
      </div>
    </div>
  );
}

interface RegisterProps {
  onRegister: (user: User) => void;
  goLogin: () => void;
  users: User[];
}

export function RegisterPage({ onRegister, goLogin, users }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [grade, setGrade] = useState(6);
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError("Vui lòng nhập đầy đủ thông tin, mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (users.some(u => norm(u.email) === norm(email))) {
      setError("Email này đã được đăng ký.");
      return;
    }
    setError('');
    onRegister({
      id: `u_${Math.random().toString(36).substring(2, 9)}`,
      name: name.trim(),
      email: email.trim(),
      password,
      role: 'student',
      grade: Number(grade)
    });
  };

  return (
    <div className="animate-fadeUp">
      <div className="lg:hidden flex flex-col items-center mb-6 text-center">
        <AnTamLogo size={120} />
      </div>
      
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Đăng ký học sinh</h1>
      <p className="text-sm text-slate-500 mb-6">Tạo tài khoản để bắt đầu học và làm bài kiểm tra theo từng bài học.</p>
      
      <form onSubmit={submit} className="space-y-4">
        <Input 
          label="Họ và tên" 
          placeholder="Nguyễn Văn A" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
        />
        <Input 
          label="Email" 
          type="email" 
          placeholder="ban@email.com" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <Input 
          label="Mật khẩu" 
          type="password" 
          placeholder="Tối thiểu 6 ký tự" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
        
        <div className="grid grid-cols-2 gap-3">
          <Select 
            label="Khối lớp" 
            value={grade} 
            onChange={e => setGrade(Number(e.target.value))}
          >
            {GRADES.map(g => (
              <option key={g} value={g}>
                Khối {g}
              </option>
            ))}
          </Select>
          <Input 
            label="Vai trò" 
            value="Học sinh" 
            disabled 
            className="bg-slate-50 text-slate-400" 
          />
        </div>
        
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        
        <Button type="submit" className="w-full justify-center" size="lg">
          Tạo tài khoản
        </Button>
      </form>
      
      <p className="text-sm text-slate-500 mt-5 text-center">
        Đã có tài khoản?{" "}
        <button onClick={goLogin} className="text-emerald-600 font-semibold hover:underline">
          Đăng nhập
        </button>
      </p>
    </div>
  );
}
