import React, { useState, useEffect } from 'react';
import { Send, FileText, MessageCircle } from 'lucide-react';
import { User, Document } from '../types';
import { Card, Button, EmptyState } from './UI';
import { norm } from '../data/seedData';

export function answerFromDocument(doc: Document | undefined, question: string): string {
  if (!doc) return "Vui lòng chọn một tài liệu trước khi đặt câu hỏi.";
  
  const paras = doc.content.split(/\n+/).map(s => s.trim()).filter(Boolean);
  const qTokens = norm(question).split(" ").filter(w => w.length > 2);
  
  if (qTokens.length === 0) return "Bạn hãy đặt câu hỏi chi tiết hơn nhé.";
  
  let bestPara: string | null = null;
  let bestScore = 0;
  
  paras.forEach(p => {
    const pn = norm(p);
    let score = 0;
    qTokens.forEach(t => { 
      if (pn.includes(t)) score++; 
    });
    if (score > bestScore) {
      bestScore = score;
      bestPara = p;
    }
  });
  
  if (!bestPara || bestScore === 0) {
    return "Nội dung này không có trong tài liệu được cung cấp. Bạn hãy thử hỏi theo đúng nội dung tài liệu, hoặc chọn tài liệu khác.";
  }
  
  return bestPara;
}

interface ChatbotPageProps {
  user: User;
  documents: Document[];
}

export function ChatbotPage({ user, documents }: ChatbotPageProps) {
  // Students only see documents in their grade. Teachers and admins see all documents.
  const myDocs = documents.filter(d => user.role !== 'student' || d.grade === user.grade);
  const [docId, setDocId] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'bot'; text: string }>>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (myDocs.length > 0 && !docId) {
      setDocId(myDocs[0].id);
    }
  }, [myDocs, docId]);

  const doc = documents.find(d => d.id === docId);

  const sendMessage = () => {
    if (!input.trim()) return;
    const q = input.trim();
    const answer = answerFromDocument(doc, q);
    
    setMessages(prev => [
      ...prev, 
      { role: 'user', text: q }, 
      { role: 'bot', text: answer }
    ]);
    setInput('');
  };

  const handleDocumentChange = (id: string) => {
    setDocId(id);
    setMessages([]);
  };

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Chatbot tài liệu</h1>
        <p className="text-sm text-slate-500 mt-1">
          Hỏi đáp thông minh. Chatbot tự động trả lời bằng thuật toán so khớp chính xác dựa trên tài liệu lớp học của bạn.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Document Selection Rails */}
        <Card className="p-5 lg:col-span-1 h-fit bg-white">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <FileText size={17} className="text-emerald-600" />
            <span>Tài liệu của khối {user.role === 'student' ? user.grade : ""}</span>
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {myDocs.map(d => (
              <button 
                key={d.id} 
                onClick={() => handleDocumentChange(d.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  docId === d.id 
                    ? "border-emerald-500 bg-emerald-50/40 shadow-xs" 
                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/20"
                }`}
              >
                <p className="text-sm font-semibold text-slate-700 truncate">{d.title}</p>
                <p className="text-xs text-slate-400 mt-1 font-medium">{d.subject} · Khối {d.grade}</p>
              </button>
            ))}
            {myDocs.length === 0 && (
              <EmptyState text="Chưa có tài liệu ôn tập nào được tải lên." />
            )}
          </div>
        </Card>

        {/* Chat Console Panel */}
        <Card className="p-0 lg:col-span-2 flex flex-col h-[520px] bg-white border border-slate-100">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <p className="font-bold text-slate-800">{doc?.title || "Chưa chọn tài liệu"}</p>
            <p className="text-xs text-slate-400 mt-0.5">Chatbot chỉ trả lời và trích dẫn trong phạm vi tài liệu này</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
            {messages.length === 0 && (
              <EmptyState text="Hãy bắt đầu bằng việc đặt câu hỏi liên quan đến nội dung tài liệu học tập." />
            )}
            
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' 
                    ? "bg-emerald-600 text-white rounded-br-none" 
                    : "bg-slate-100 text-slate-700 rounded-bl-none"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-slate-100 flex gap-2.5 bg-slate-50/30">
            <input 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              disabled={!doc} 
              placeholder={doc ? "Hỏi đáp về nội dung tài liệu này..." : "Vui lòng chọn tài liệu"}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
            <Button 
              icon={<Send size={15} />} 
              disabled={!doc || !input.trim()} 
              onClick={sendMessage}
            >
              Gửi
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
