import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, FileText, ClipboardList } from 'lucide-react';
import { User, Document, Assignment, Attempt, Lesson } from '../types';
import { Card, Input, Select, Textarea, Button, EmptyState, Badge, orderedLessons, isAssignmentCompleted } from './UI';
import { SUBJECTS, GRADES, SUB_LEVELS, SUB_LEVEL_NAME, todayStr, nid } from '../data/seedData';

interface TeacherDocumentsProps {
  user: User;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TeacherDocuments({ user, documents, setDocuments, showToast }: TeacherDocumentsProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [content, setContent] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const myDocs = documents.filter(d => d.teacherId === user.id);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'txt') {
      showToast("Chỉ hỗ trợ đọc trực tiếp file .txt. Với PDF/DOCX, vui lòng mở file, sao chép nội dung và dán vào ô bên dưới.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        setContent(text);
        showToast("Đã tải nội dung từ file thành công!");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  const addDoc = () => {
    if (!title.trim() || !content.trim()) {
      showToast("Vui lòng nhập tiêu đề và nội dung tài liệu.", "error");
      return;
    }
    const newDoc: Document = {
      id: nid("doc"),
      teacherId: user.id,
      subject,
      grade: Number(grade),
      title: title.trim(),
      content: content.trim(),
      uploadedAt: todayStr()
    };
    setDocuments(prev => [...prev, newDoc]);
    setTitle('');
    setContent('');
    if (fileRef.current) fileRef.current.value = "";
    showToast("Đã tải tài liệu lên thành công!");
  };

  const removeDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast("Đã xoá tài liệu.");
  };

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 font-sans">Tài liệu Chatbot</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tải tài liệu (.txt dạng văn bản hoặc dán trực tiếp) để Chatbot trả lời câu hỏi học sinh đúng phạm vi bài học.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Document Creation Panel */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Tải lên tài liệu mới</h3>
          
          <div className="space-y-4">
            <Input 
              label="Tiêu đề tài liệu" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Ví dụ: Tài liệu ôn tập Số tự nhiên" 
            />
            
            <div className="grid grid-cols-2 gap-3">
              <Select 
                label="Môn học" 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
              >
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </Select>
              
              <Select 
                label="Khối lớp" 
                value={grade} 
                onChange={e => setGrade(Number(e.target.value))}
              >
                {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
              </Select>
            </div>
            
            <label className="block">
              <span className="block text-sm font-medium text-slate-600 mb-1.5">
                Tải file (.txt) — hoặc dán nội dung bên dưới
              </span>
              <input 
                ref={fileRef} 
                type="file" 
                accept=".txt" 
                onChange={handleFile}
                className="w-full text-sm rounded-xl border border-dashed border-slate-300 px-3.5 py-2.5 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold cursor-pointer"
              />
              <span className="text-xs text-slate-400 mt-1.5 block">
                Với PDF/DOCX: mở file → sao chép nội dung → dán vào ô nội dung bên dưới.
              </span>
            </label>
            
            <Textarea 
              label="Nội dung tài liệu (mỗi ý nên xuống dòng riêng để chatbot chia câu tốt hơn)" 
              rows={7} 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="Dán hoặc nhập nội dung tài liệu tại đây..." 
            />
            
            <Button 
              className="w-full justify-center" 
              icon={<Upload size={16} />} 
              onClick={addDoc}
            >
              Tải lên tài liệu
            </Button>
          </div>
        </Card>

        {/* Existing Documents List */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            Tài liệu đã tải lên ({myDocs.length})
          </h3>
          
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {myDocs.map(d => (
              <div 
                key={d.id} 
                className="p-3.5 rounded-xl border border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{d.title}</p>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {d.subject} · Khối {d.grade} · {new Date(d.uploadedAt).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {d.content.slice(0, 150)}...
                  </p>
                </div>
                <button 
                  onClick={() => removeDoc(d.id)} 
                  className="shrink-0 p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Xoá tài liệu"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            {myDocs.length === 0 && (
              <EmptyState text="Bạn chưa tải tài liệu nào." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

interface TeacherAssignmentsProps {
  user: User;
  lessons: Lesson[];
  students: User[];
  attempts: Attempt[];
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TeacherAssignments({ user, lessons, students, attempts, assignments, setAssignments, showToast }: TeacherAssignmentsProps) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [level, setLevel] = useState<number>(SUB_LEVELS[0]);
  const [targetType, setTargetType] = useState<'grade' | 'students'>('grade');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [dueAt, setDueAt] = useState('');
  const [note, setNote] = useState('');

  const subjectGradeLessons = orderedLessons(lessons, subject, grade);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => {
    if (!subjectGradeLessons.some(l => l.id === lessonId)) {
      setLessonId(subjectGradeLessons[0]?.id || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, grade, lessons]);

  const gradeStudents = students.filter(s => s.grade === grade);

  const toggleStudent = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const assign = () => {
    if (!lessonId) {
      showToast("Chưa có bài học nào cho môn/khối này để giao.", "error");
      return;
    }
    if (!dueAt) {
      showToast("Vui lòng chọn hạn hoàn thành.", "error");
      return;
    }
    if (targetType === 'students' && selectedStudentIds.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 học sinh.", "error");
      return;
    }
    const newAssignment: Assignment = {
      id: nid("asg"),
      teacherId: user.id,
      subject,
      grade,
      lessonId,
      level,
      targetType,
      studentIds: targetType === 'students' ? selectedStudentIds : undefined,
      note: note.trim() || undefined,
      dueAt: new Date(dueAt).toISOString(),
      createdAt: new Date().toISOString()
    };
    setAssignments(prev => [...prev, newAssignment]);
    showToast("Đã giao bài tập cho học sinh.");
    setSelectedStudentIds([]);
    setNote('');
    setDueAt('');
  };

  const removeAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    showToast("Đã huỷ bài tập.");
  };

  const myAssignments = assignments
    .filter(a => a.teacherId === user.id)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Giao bài tập</h1>
        <p className="text-sm text-slate-500 mt-1">
          Giao bài kiểm tra có sẵn kèm hạn hoàn thành — học sinh sẽ thấy thông báo cho tới khi làm đạt hoặc quá hạn.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Giao bài mới</h3>

          <div className="space-y-4">
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
                {subjectGradeLessons.length === 0 && <option value="">Chưa có bài học</option>}
                {subjectGradeLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </Select>
              <Select label="Cấp độ cần đạt" value={level} onChange={e => setLevel(Number(e.target.value))}>
                {SUB_LEVELS.map(l => <option key={l} value={l}>{SUB_LEVEL_NAME[l]}</option>)}
              </Select>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-600 mb-1.5">Giao cho</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetType('grade')}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    targetType === 'grade' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  Cả khối {grade}
                </button>
                <button
                  onClick={() => setTargetType('students')}
                  className={`flex-1 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    targetType === 'students' ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  Học sinh cụ thể
                </button>
              </div>
            </div>

            {targetType === 'students' && (
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1">
                {gradeStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    <span className="text-sm text-slate-700">{s.name}</span>
                  </label>
                ))}
                {gradeStudents.length === 0 && (
                  <p className="text-xs text-slate-400 italic p-2">Chưa có học sinh nào ở khối {grade}.</p>
                )}
              </div>
            )}

            <Input
              label="Hạn hoàn thành"
              type="datetime-local"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
            />

            <Textarea
              label="Ghi chú (không bắt buộc)"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ví dụ: Ôn lại phần lũy thừa trước khi làm bài"
            />

            <Button className="w-full justify-center" icon={<ClipboardList size={16} />} onClick={assign}>
              Giao bài tập
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Bài đã giao ({myAssignments.length})</h3>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {myAssignments.map(a => {
              const lesson = lessons.find(l => l.id === a.lessonId);
              const targetStudents = a.targetType === 'grade'
                ? students.filter(s => s.grade === a.grade)
                : students.filter(s => (a.studentIds || []).includes(s.id));
              const completedCount = targetStudents.filter(s => isAssignmentCompleted(a, attempts, s.id)).length;
              const overdue = new Date(a.dueAt).getTime() < Date.now();

              return (
                <div key={a.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">
                        {a.subject} · {lesson?.title || "Bài học đã xoá"} · {SUB_LEVEL_NAME[a.level]}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {a.targetType === 'grade' ? `Cả khối ${a.grade}` : `${targetStudents.length} học sinh cụ thể`}
                        {" · Hạn: "}
                        {new Date(a.dueAt).toLocaleString('vi-VN')}
                      </p>
                      {a.note && <p className="text-xs text-slate-500 mt-1.5 italic">{a.note}</p>}
                    </div>
                    <button
                      onClick={() => removeAssignment(a.id)}
                      className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                      title="Huỷ bài tập"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <Badge tone={completedCount === targetStudents.length && targetStudents.length > 0 ? 'green' : overdue ? 'red' : 'amber'}>
                      {completedCount}/{targetStudents.length} đã hoàn thành
                    </Badge>
                    {overdue && completedCount < targetStudents.length && <Badge tone="red">Quá hạn</Badge>}
                  </div>
                </div>
              );
            })}
            {myAssignments.length === 0 && (
              <EmptyState text="Bạn chưa giao bài tập nào." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
