import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  User as UserIcon, 
  FileText, 
  BookOpen, 
  MessageSquare, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Download, 
  Upload,
  Check,
  X,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { User, Question, Lesson, Post, Attempt } from '../types';
import { Card, Badge, Button, Input, Select, Textarea, Modal, EmptyState, Avatar, MedalDot, userTotalPoints, computeLeaderboard, orderedLessons, VisibilityToolbar } from './UI';
import { SUBJECTS, GRADES, SUBJECT_COLOR, SUB_LEVELS, SUB_LEVEL_NAME, nid, norm, todayStr } from '../data/seedData';

// --- OVERVIEW PANEL ---
interface AdminOverviewProps {
  users: User[];
  questions: Question[];
  posts: Post[];
  attempts: Attempt[];
  lessons: Lesson[];
  setPage: (page: string) => void;
}

export function AdminOverview({ users, questions, posts, attempts, lessons, setPage }: AdminOverviewProps) {
  const students = users.filter(u => u.role === 'student');
  const teachers = users.filter(u => u.role === 'teacher');
  const pending = posts.filter(p => p.status === 'pending');

  const stats = [
    { label: "Học sinh", value: students.length, icon: <Users size={19} />, tone: "bg-emerald-50 text-emerald-600", go: "students" },
    { label: "Giáo viên", value: teachers.length, icon: <UserIcon size={19} />, tone: "bg-sky-50 text-sky-600", go: "students" },
    { label: "Câu hỏi trong ngân hàng", value: questions.length, icon: <FileText size={19} />, tone: "bg-indigo-50 text-indigo-600", go: "questions" },
    { label: "Bài học / tài liệu", value: lessons.length, icon: <BookOpen size={19} />, tone: "bg-cyan-50 text-cyan-600", go: "lessons" },
    { label: "Bài viết chờ duyệt", value: pending.length, icon: <MessageSquare size={19} />, tone: "bg-amber-50 text-amber-600", go: "posts" },
    { label: "Lượt kiểm tra đã thực hiện", value: attempts.length, icon: <TrendingUp size={19} />, tone: "bg-emerald-50 text-emerald-600", go: "ranking" },
  ];

  const board = computeLeaderboard(users, attempts, lessons).slice(0, 5);

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Tổng quan hệ thống</h1>
        <p className="text-sm text-slate-500 mt-1">Theo dõi nhanh tình trạng hoạt động và học tập của AN TÂM.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stats.map(s => (
          <Card 
            key={s.label} 
            className="p-5 cursor-pointer hover:-translate-y-0.5 transition-all duration-150" 
            onClick={() => setPage(s.go)}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.tone}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 text-lg">TOP 5 học sinh xuất sắc</h3>
          <Button size="sm" variant="secondary" onClick={() => setPage("ranking")}>
            Xem đầy đủ
          </Button>
        </div>
        <div className="space-y-2">
          {board.map((b, i) => (
            <div key={b.user.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50">
              <span className="w-6 text-center font-bold text-slate-400">#{i + 1}</span>
              <Avatar name={b.user.name} size={30} />
              <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{b.user.name}</span>
              <span className="text-xs text-slate-400">Khối {b.user.grade}</span>
              <span className="font-bold text-emerald-600 text-sm shrink-0">{b.points.toFixed(1)} đ</span>
            </div>
          ))}
          {board.length === 0 && <EmptyState text="Chưa có dữ liệu học tập nào." />}
        </div>
      </Card>
    </div>
  );
}

// --- STUDENT MANAGER PANEL ---
interface StudentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editing: User | null;
}

export function StudentFormModal({ open, onClose, onSave, editing }: StudentFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('hs123456');
  const [role, setRole] = useState<'admin' | 'teacher' | 'student'>('student');
  const [grade, setGrade] = useState(6);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setEmail(editing.email);
      setPassword(editing.password || 'hs123456');
      setRole(editing.role);
      setGrade(editing.grade || 6);
    } else {
      setName('');
      setEmail('');
      setPassword('hs123456');
      setRole('student');
      setGrade(6);
    }
  }, [editing, open]);

  const save = () => {
    onSave({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      grade: role === 'student' ? Number(grade) : undefined
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Sửa tài khoản" : "Thêm tài khoản mới"}>
      <div className="space-y-4">
        <Input label="Họ và tên" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" />
        <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} placeholder="a@antam.vn" />
        <Input label="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} placeholder="hs123456" />
        
        <div className="grid grid-cols-2 gap-3">
          <Select label="Vai trò" value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="student">Học sinh</option>
            <option value="teacher">Giáo viên</option>
            <option value="admin">Admin</option>
          </Select>
          
          {role === 'student' && (
            <Select label="Khối lớp" value={grade} onChange={e => setGrade(Number(e.target.value))}>
              {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
            </Select>
          )}
        </div>
        
        <Button className="w-full justify-center" onClick={save} disabled={!name.trim() || !email.trim()}>
          Lưu tài khoản
        </Button>
      </div>
    </Modal>
  );
}

interface AdminStudentsProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  attempts: Attempt[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminStudents({ users, setUsers, attempts, showToast }: AdminStudentsProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (query && !norm(u.name).includes(norm(query)) && !norm(u.email).includes(norm(query))) return false;
    return true;
  });

  const saveUser = (data: any) => {
    if (editing) {
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...data } : u));
      showToast("Đã cập nhật tài khoản.");
    } else {
      if (users.some(u => norm(u.email) === norm(data.email))) {
        showToast("Email đã tồn tại!", "error");
        return;
      }
      setUsers(prev => [...prev, { ...data, id: nid("u") }]);
      showToast("Đã thêm tài khoản mới.");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const removeUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast("Đã xoá tài khoản.");
  };

  const importExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);
        
        let added = 0;
        const newUsers: User[] = [];
        
        rows.forEach(r => {
          const name = r["HoTen"] || r["Họ tên"] || r["Ho ten"] || r["name"];
          const email = r["Email"] || r["email"];
          const password = String(r["MatKhau"] || r["Mật khẩu"] || r["password"] || "hs123456");
          const grade = Number(r["Khoi"] || r["Khối"] || r["grade"] || 6);
          
          if (!name || !email) return;
          if (users.some(u => norm(u.email) === norm(email)) || newUsers.some(u => norm(u.email) === norm(email))) return;
          
          newUsers.push({
            id: nid("u"),
            name: String(name),
            email: String(email),
            password,
            role: 'student',
            grade
          });
          added++;
        });
        
        setUsers(prev => [...prev, ...newUsers]);
        showToast(`Đã nhập thành công ${added} học sinh từ Excel!`);
      } catch (err) {
        showToast("Lỗi đọc file Excel. Vui lòng kiểm tra định dạng mẫu.", "error");
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const exportCSV = () => {
    const header = "Họ tên,Email,Mật khẩu,Vai trò,Khối\n";
    const rows = users.map(u => `"${u.name}","${u.email}","${u.password || ''}","${u.role}","${u.grade || ''}"`).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "danh-sach-tai-khoan-antam.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const header = "HoTen,Email,MatKhau,Khoi\n";
    const rows = "Nguyen Van A,a@example.com,123456,6\nLe Thi B,b@example.com,hs123456,7\n";
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau-import-hoc-sinh.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Quản lý học sinh</h1>
          <p className="text-sm text-slate-500 mt-1">
            Thêm tài khoản thủ công hoặc nhập hàng loạt từ Excel, tải file mẫu đúng cấu trúc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Download size={14} />} size="sm" onClick={downloadTemplate}>
            Tải mẫu Excel
          </Button>
          <label className="inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 active:scale-[.98] text-sm px-4 py-2.5 gap-2 cursor-pointer">
            <Upload size={14} />
            <span>Nhập Excel</span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importExcel} />
          </label>
          <Button icon={<Download size={14} />} size="sm" variant="secondary" onClick={exportCSV}>
            Xuất CSV
          </Button>
          <Button icon={<Plus size={14} />} size="sm" onClick={() => { setEditing(null); setModalOpen(true); }}>
            Thêm tài khoản
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            placeholder="Tìm theo tên hoặc email..." 
            className="pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm w-64 focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-all" 
          />
        </div>
        
        <Select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-44 !py-2.5">
          <option value="all">Tất cả vai trò</option>
          <option value="student">Học sinh</option>
          <option value="teacher">Giáo viên</option>
          <option value="admin">Admin</option>
        </Select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Họ tên</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Vai trò</th>
              <th className="text-left px-4 py-3">Khối</th>
              <th className="text-left px-4 py-3">Điểm</th>
              <th className="text-right px-4 py-3">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-700">{u.name}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === 'admin' ? 'red' : u.role === 'teacher' ? 'blue' : 'green'}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500">{u.grade ? `Khối ${u.grade}` : "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {u.role === 'student' ? userTotalPoints(attempts, u.id).toFixed(1) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button 
                      onClick={() => { setEditing(u); setModalOpen(true); }} 
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                      title="Sửa"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={() => removeUser(u.id)} 
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <EmptyState text="Không tìm thấy tài khoản nào." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <StudentFormModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null); }} 
        onSave={saveUser} 
        editing={editing} 
      />
    </div>
  );
}

// --- QUESTIONS MANAGER PANEL ---
const QTYPE_LABEL: Record<string, string> = { 
  mcq: "Trắc nghiệm (A-D)", 
  short: "Trả lời ngắn", 
  essay: "Bài luận ngắn" 
};
const QTYPE_TONE: Record<string, string> = { mcq: "blue", short: "sky", essay: "amber" };

interface QuestionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: any) => void;
  editing: Question | null;
  lessons: Lesson[];
  defaultSubject: string;
  defaultGrade: number;
  defaultLessonId: string;
  defaultLevel: number;
}

export function QuestionFormModal({
  open,
  onClose,
  onSave,
  editing,
  lessons,
  defaultSubject,
  defaultGrade,
  defaultLessonId,
  defaultLevel
}: QuestionFormModalProps) {
  const [type, setType] = useState<'mcq' | 'short' | 'essay'>('mcq');
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [lessonId, setLessonId] = useState(defaultLessonId);
  const [level, setLevel] = useState(defaultLevel);
  const [content, setContent] = useState('');
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [sampleAnswer, setSampleAnswer] = useState('');
  const [keywords, setKeywords] = useState('');
  const [explanation, setExplanation] = useState('');

  const lessonOptions = orderedLessons(lessons, subject, grade);

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setSubject(editing.subject);
      setGrade(editing.grade);
      setLessonId(editing.lessonId);
      setLevel(editing.level);
      setContent(editing.content);
      setOptions(editing.type === 'mcq' && editing.options ? editing.options : ["", "", "", ""]);
      setCorrect(editing.type === 'mcq' && editing.correct !== undefined ? editing.correct : 0);
      setSampleAnswer(editing.type === 'short' && editing.sampleAnswer ? editing.sampleAnswer : '');
      setKeywords(editing.type === 'essay' && editing.keywords ? editing.keywords.join(", ") : '');
      setExplanation(editing.explanation || '');
    } else {
      setType('mcq');
      setSubject(defaultSubject);
      setGrade(defaultGrade);
      setLessonId(defaultLessonId);
      setLevel(defaultLevel);
      setContent('');
      setOptions(["", "", "", ""]);
      setCorrect(0);
      setSampleAnswer('');
      setKeywords('');
      setExplanation('');
    }
  }, [editing, open, defaultSubject, defaultGrade, defaultLessonId, defaultLevel]);

  // Keep lessonId valid whenever subject/grade changes away from the editing lesson's scope
  useEffect(() => {
    if (!lessonOptions.some(l => l.id === lessonId)) {
      setLessonId(lessonOptions[0]?.id || '');
    }
  }, [subject, grade]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOptionIndexValue = (idx: number, val: string) => {
    setOptions(prev => prev.map((o, i) => i === idx ? val : o));
  };

  const save = () => {
    if (!content.trim() || !lessonId) return;
    let payload: any = {
      subject,
      grade: Number(grade),
      lessonId,
      level: Number(level),
      type,
      content: content.trim()
    };
    if (type === 'mcq') payload = { ...payload, options, correct: Number(correct) };
    if (type === 'short') payload = { ...payload, sampleAnswer: sampleAnswer.trim() };
    if (type === 'essay') payload = { ...payload, keywords: keywords.split(",").map(s => s.trim()).filter(Boolean) };
    payload.explanation = explanation.trim();
    onSave(payload);
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi mới"} wide>
      <div className="space-y-4">
        <div>
          <span className="block text-sm font-medium text-slate-600 mb-1.5">Loại câu hỏi *</span>
          <div className="grid grid-cols-3 gap-2">
            {(['mcq', 'short', 'essay'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                  type === t
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-700"
                    : "border-slate-200 text-slate-500 bg-white"
                }`}
              >
                {QTYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Môn học" value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Khối lớp" value={grade} onChange={e => setGrade(Number(e.target.value))}>
            {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Bài học" value={lessonId} onChange={e => setLessonId(e.target.value)}>
            {lessonOptions.length === 0 && <option value="">Chưa có bài học</option>}
            {lessonOptions.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </Select>
          <Select label="Cấp độ trong bài" value={level} onChange={e => setLevel(Number(e.target.value))}>
            {SUB_LEVELS.map(l => <option key={l} value={l}>{SUB_LEVEL_NAME[l]}</option>)}
          </Select>
        </div>

        <Textarea 
          label="Nội dung câu hỏi *" 
          rows={3} 
          value={content} 
          onChange={e => setContent(e.target.value)} 
          placeholder="Nhập nội dung đề bài..." 
        />

        {type === 'mcq' && (
          <div className="space-y-2.5">
            <span className="block text-sm font-medium text-slate-600">4 đáp án (chọn nút tròn cho đáp án đúng) *</span>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <button 
                  onClick={() => setCorrect(i)} 
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    Number(correct) === i 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-300 text-slate-400 bg-white hover:border-slate-400"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </button>
                <input 
                  value={opt} 
                  onChange={e => setOptionIndexValue(i, e.target.value)} 
                  placeholder={`Đáp án ${String.fromCharCode(65 + i)}`} 
                  className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-all" 
                />
              </div>
            ))}
          </div>
        )}

        {type === 'short' && (
          <Input 
            label="Đáp án mẫu *" 
            value={sampleAnswer} 
            onChange={e => setSampleAnswer(e.target.value)} 
            placeholder="Nhập đáp án chuẩn để máy so khớp (không phân biệt chữ hoa thường)" 
          />
        )}

        {type === 'essay' && (
          <Textarea
            label="Bộ từ khoá chấm điểm (cách nhau bởi dấu phẩy) *"
            rows={2}
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="ví dụ: quê hương, tình yêu, kỷ niệm, tự hào"
          />
        )}

        <Textarea
          label="Giải thích đáp án (hiện cho học sinh sau khi làm bài)"
          rows={2}
          value={explanation}
          onChange={e => setExplanation(e.target.value)}
          placeholder="Vì sao đáp án này đúng / các đáp án khác sai..."
        />

        <Button className="w-full justify-center" onClick={save} disabled={!content.trim() || !lessonId}>
          Lưu câu hỏi
        </Button>
      </div>
    </Modal>
  );
}

interface AdminQuestionsProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminQuestions({ questions, setQuestions, lessons, setLessons, showToast }: AdminQuestionsProps) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [level, setLevel] = useState<number>(SUB_LEVELS[0]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  const subjectGradeLessons = orderedLessons(lessons, subject, grade);
  const [lessonId, setLessonId] = useState<string>('');

  useEffect(() => {
    if (!subjectGradeLessons.some(l => l.id === lessonId)) {
      setLessonId(subjectGradeLessons[0]?.id || '');
    }
  }, [subject, grade, lessons]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLesson = lessons.find(l => l.id === lessonId) || null;

  const list = questions.filter(q => {
    return q.lessonId === lessonId &&
           q.level === level &&
           (typeFilter === 'all' || q.type === typeFilter);
  });

  const setLessonQuizVisibility = (patch: Partial<Lesson>) => {
    if (!currentLesson) return;
    setLessons(prev => prev.map(l => l.id === currentLesson.id ? { ...l, ...patch } : l));
  };

  const saveQ = (payload: any) => {
    if (editing) {
      setQuestions(prev => prev.map(q => q.id === editing.id ? { ...q, ...payload } : q));
      showToast("Đã cập nhật câu hỏi.");
    } else {
      setQuestions(prev => [...prev, { ...payload, id: nid("q") }]);
      showToast("Đã thêm câu hỏi mới vào ngân hàng.");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const removeQ = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    showToast("Đã xoá câu hỏi.");
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Ngân hàng câu hỏi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý ngân hàng câu hỏi phân theo môn học, khối lớp, bài học, cấp độ trong bài (Cấp 1/2/3) và dạng câu hỏi.
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Thêm câu hỏi
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <Select value={subject} onChange={e => setSubject(e.target.value)} className="w-40 !py-2.5">
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select value={grade} onChange={e => setGrade(Number(e.target.value))} className="w-32 !py-2.5">
          {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
        </Select>
        <Select value={lessonId} onChange={e => setLessonId(e.target.value)} className="w-64 !py-2.5">
          {subjectGradeLessons.length === 0 && <option value="">Chưa có bài học</option>}
          {subjectGradeLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </Select>
        <Select value={level} onChange={e => setLevel(Number(e.target.value))} className="w-32 !py-2.5">
          {SUB_LEVELS.map(l => <option key={l} value={l}>{SUB_LEVEL_NAME[l]}</option>)}
        </Select>
        <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="w-48 !py-2.5">
          <option value="all">Tất cả loại câu hỏi</option>
          {Object.keys(QTYPE_LABEL).map(t => <option key={t} value={t}>{QTYPE_LABEL[t]}</option>)}
        </Select>
        <Badge tone="slate">{list.length} câu hỏi</Badge>
      </div>

      {currentLesson && (
        <Card className="p-4 mb-5">
          <VisibilityToolbar
            label="Bài kiểm tra"
            hidden={currentLesson.quizHidden}
            visibleAt={currentLesson.quizVisibleAt}
            onHide={() => setLessonQuizVisibility({ quizHidden: true, quizVisibleAt: undefined })}
            onShow={() => setLessonQuizVisibility({ quizHidden: false, quizVisibleAt: undefined })}
            onSchedule={(iso) => setLessonQuizVisibility({ quizHidden: true, quizVisibleAt: iso })}
          />
        </Card>
      )}

      <div className="space-y-3">
        {list.map((q, i) => (
          <Card key={q.id} className="p-4 bg-white hover:border-slate-200 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-400">Câu {i + 1}</span>
                  <Badge tone={QTYPE_TONE[q.type]}>{QTYPE_LABEL[q.type]}</Badge>
                </div>
                
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.content}</p>
                
                {q.type === 'mcq' && q.options && (
                  <div className="grid sm:grid-cols-2 gap-1.5 mt-3">
                    {q.options.map((o, idx) => (
                      <div 
                        key={idx} 
                        className={`text-xs px-3 py-2 rounded-xl border ${
                          idx === q.correct 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 font-semibold" 
                            : "bg-slate-50 text-slate-500 border-transparent"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {o} {idx === q.correct && "✓"}
                      </div>
                    ))}
                  </div>
                )}
                
                {q.type === 'short' && (
                  <p className="text-xs text-slate-500 mt-2">
                    Đáp án mẫu: <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{q.sampleAnswer}</span>
                  </p>
                )}
                
                {q.type === 'essay' && q.keywords && (
                  <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-1.5">
                    <span>Từ khoá chấm điểm:</span>
                    {q.keywords.map(k => (
                      <span key={k} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        {k}
                      </span>
                    ))}
                  </div>
                )}

                {q.explanation && (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    Giải thích: {q.explanation}
                  </p>
                )}
              </div>

              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={() => { setEditing(q); setModalOpen(true); }} 
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Sửa"
                >
                  <Edit size={15} />
                </button>
                <button 
                  onClick={() => removeQ(q.id)} 
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Xoá"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <EmptyState text="Chưa có câu hỏi nào được thêm cho các tiêu chí đã chọn." />
        )}
      </div>

      <QuestionFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={saveQ}
        editing={editing}
        lessons={lessons}
        defaultSubject={subject}
        defaultGrade={grade}
        defaultLessonId={lessonId}
        defaultLevel={level}
      />
    </div>
  );
}

// --- LESSON MANAGER PANEL (Google Drive link mapping) ---
interface LessonFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editing: Lesson | null;
  defaultSubject: string;
  defaultGrade: number;
}

export function LessonFormModal({ open, onClose, onSave, editing, defaultSubject, defaultGrade }: LessonFormModalProps) {
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [content, setContent] = useState('');
  const [driveLink, setDriveLink] = useState('');
  const [order, setOrder] = useState(1);

  useEffect(() => {
    if (editing) {
      setSubject(editing.subject);
      setGrade(editing.grade);
      setTitle(editing.title);
      setDesc(editing.desc);
      setContent(editing.content || '');
      setDriveLink(editing.driveLink);
      setOrder(editing.order);
    } else {
      setSubject(defaultSubject);
      setGrade(defaultGrade);
      setTitle('');
      setDesc('');
      setContent('');
      setDriveLink('');
      setOrder(1);
    }
  }, [editing, open, defaultSubject, defaultGrade]);

  const save = () => {
    onSave({
      subject,
      grade: Number(grade),
      title: title.trim(),
      desc: desc.trim(),
      content: content.trim(),
      driveLink: driveLink.trim(),
      order: Number(order)
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Sửa bài học" : "Thêm bài học mới"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Môn học" value={subject} onChange={e => setSubject(e.target.value)}>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </Select>
          <Select label="Khối lớp" value={grade} onChange={e => setGrade(Number(e.target.value))}>
            {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
          </Select>
        </div>
        
        <Input label="Tên bài học" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Bài 1: Số tự nhiên" />
        <Textarea label="Mô tả ngắn" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Mô tả nội dung học tập..." />
        <Textarea label="Nội dung bài học (hiện cho học sinh xem trong app)" rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Lý thuyết đầy đủ của bài học..." />
        <Input label="Link chia sẻ Google Drive *" value={driveLink} onChange={e => setDriveLink(e.target.value)} placeholder="https://drive.google.com/..." />
        <Input label="Thứ tự bài" type="number" value={order} onChange={e => setOrder(Number(e.target.value))} />
        
        <Button className="w-full justify-center" onClick={save} disabled={!title.trim() || !driveLink.trim()}>
          Lưu bài học
        </Button>
      </div>
    </Modal>
  );
}

interface AdminLessonsProps {
  lessons: Lesson[];
  setLessons: React.Dispatch<React.SetStateAction<Lesson[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminLessons({ lessons, setLessons, showToast }: AdminLessonsProps) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);

  const list = lessons.filter(l => l.subject === subject && l.grade === grade).sort((a, b) => a.order - b.order);

  const saveLesson = (data: any) => {
    if (editing) {
      setLessons(prev => prev.map(l => l.id === editing.id ? { ...l, ...data } : l));
      showToast("Đã cập nhật bài học.");
    } else {
      setLessons(prev => [...prev, { ...data, id: nid("les") }]);
      showToast("Đã thêm bài học mới.");
    }
    setModalOpen(false);
    setEditing(null);
  };

  const removeLesson = (id: string) => {
    setLessons(prev => prev.filter(l => l.id !== id));
    showToast("Đã xoá bài học.");
  };

  const setContentVisibility = (id: string, patch: Partial<Lesson>) => {
    setLessons(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Quản lý chương trình học</h1>
          <p className="text-sm text-slate-500 mt-1">
            Gắn liên kết tài liệu từ Google Drive của bạn cho từng bài học theo môn và khối.
          </p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Thêm bài học
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <Select value={subject} onChange={e => setSubject(e.target.value)} className="w-40 !py-2.5">
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </Select>
        <Select value={grade} onChange={e => setGrade(Number(e.target.value))} className="w-36 !py-2.5">
          {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
        </Select>
        <Badge tone="slate">{list.length} bài học</Badge>
      </div>

      <Card className="divide-y divide-slate-100 bg-white">
        {list.map(l => (
          <div key={l.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/30 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{l.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{l.desc}</p>
                <a
                  href={l.driveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-600 flex items-center gap-1 mt-1.5 hover:underline font-medium"
                >
                  Link Drive: {l.driveLink}
                </a>
              </div>

              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => { setEditing(l); setModalOpen(true); }}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Sửa"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => removeLesson(l.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Xoá"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <VisibilityToolbar
              label="Nội dung bài học"
              hidden={l.contentHidden}
              visibleAt={l.contentVisibleAt}
              onHide={() => setContentVisibility(l.id, { contentHidden: true, contentVisibleAt: undefined })}
              onShow={() => setContentVisibility(l.id, { contentHidden: false, contentVisibleAt: undefined })}
              onSchedule={(iso) => setContentVisibility(l.id, { contentHidden: true, contentVisibleAt: iso })}
            />
          </div>
        ))}
        {list.length === 0 && (
          <EmptyState text="Chưa có bài học nào cho môn và khối đã chọn." />
        )}
      </Card>

      <LessonFormModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditing(null); }} 
        onSave={saveLesson} 
        editing={editing} 
        defaultSubject={subject} 
        defaultGrade={grade} 
      />
    </div>
  );
}

// --- ARTICLE APPROVAL PANEL ---
interface AdminPostsProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  users: User[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AdminPosts({ posts, setPosts, users, showToast }: AdminPostsProps) {
  const [tab, setTab] = useState<'pending' | 'approved'>('pending');
  const nameOf = (id: string) => users.find(u => u.id === id)?.name || "Ẩn danh";
  const list = posts.filter(p => tab === 'pending' ? p.status === 'pending' : p.status === 'approved');

  const approve = (id: string, kind?: 'official' | 'community') => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', kind: kind || p.kind } : p));
    showToast("Đã duyệt bài viết.");
  };

  const reject = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    showToast("Đã từ chối/xoá bài viết.");
  };

  const toggleKind = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, kind: p.kind === 'official' ? 'community' : 'official' } : p));
    showToast("Đã thay đổi loại bài viết.");
  };

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Duyệt bài viết</h1>
        <p className="text-sm text-slate-500 mt-1">
          Duyệt các bài viết chia sẻ từ cộng đồng học sinh hoặc chuyển thể thành bài viết chính thức.
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button 
          onClick={() => setTab('pending')} 
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'pending' 
              ? "bg-emerald-600 text-white shadow-sm" 
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Chờ duyệt ({posts.filter(p => p.status === 'pending').length})
        </button>
        <button 
          onClick={() => setTab('approved')} 
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === 'approved' 
              ? "bg-emerald-600 text-white shadow-sm" 
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
          }`}
        >
          Đã duyệt ({posts.filter(p => p.status === 'approved').length})
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {list.map(p => (
          <Card key={p.id} className="p-5 flex flex-col justify-between bg-white hover:border-slate-200 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge tone={p.kind === 'official' ? 'blue' : 'sky'}>
                  {p.kind === 'official' ? 'Bài viết chính thức' : 'Bài viết cộng đồng'}
                </Badge>
                <span className="text-xs text-slate-400 font-medium">{p.createdAt}</span>
              </div>
              
              <h3 className="font-bold text-slate-800 text-base mb-1.5 leading-snug">{p.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 whitespace-pre-line">{p.content}</p>
              
              <div className="text-xs text-slate-400 mt-3 font-medium">Tác giả: {nameOf(p.authorId)}</div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-50">
              {tab === 'pending' ? (
                <>
                  <Button size="sm" variant="success" onClick={() => approve(p.id)}>Duyệt bài</Button>
                  <Button size="sm" variant="outlineDanger" onClick={() => reject(p.id)}>Từ chối</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={() => toggleKind(p.id)}>
                    Chuyển thành {p.kind === 'official' ? "Cộng đồng" : "Chính thức"}
                  </Button>
                  <Button size="sm" variant="outlineDanger" onClick={() => reject(p.id)}>Xoá</Button>
                </>
              )}
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState text="Không có bài viết nào ở danh mục này." />
          </div>
        )}
      </div>
    </div>
  );
}
