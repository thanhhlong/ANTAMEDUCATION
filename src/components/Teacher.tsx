import React, { useState, useRef } from 'react';
import { Upload, Trash2, FileText } from 'lucide-react';
import { User, Document } from '../types';
import { Card, Input, Select, Textarea, Button, EmptyState } from './UI';
import { SUBJECTS, GRADES, todayStr, nid } from '../data/seedData';

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
