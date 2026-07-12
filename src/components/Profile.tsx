import React, { useState } from 'react';
import { Award, FileText, Printer, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { User, Attempt, Certificate, Lesson } from '../types';
import { Card, Badge, LessonTrack, MedalDot, Button, EmptyState, Modal, userTotalPoints, userMedals, highestPassedLessonOrder } from './UI';
import { SUBJECTS, SUB_LEVEL_NAME } from '../data/seedData';

interface CertificateViewProps {
  user: User;
  cert: Certificate;
}

export function CertificateView({ user, cert }: CertificateViewProps) {
  return (
    <div 
      id="certificate-print" 
      className="border-8 border-double border-emerald-600 rounded-2xl p-8 text-center bg-gradient-to-br from-white to-emerald-50/50 relative shadow-inner overflow-hidden"
    >
      <div className="absolute top-4 left-4 opacity-10">
        <GraduationCap size={40} className="text-emerald-600" />
      </div>
      <div className="absolute top-4 right-4 opacity-10">
        <GraduationCap size={40} className="text-emerald-600" />
      </div>
      
      <p className="text-[10px] tracking-[0.25em] text-emerald-500 font-bold uppercase mb-2">
        Hệ thống học tập AN TÂM
      </p>
      
      <h2 className="text-3xl font-black text-emerald-800 mb-4 tracking-tight">GIẤY KHEN</h2>
      <p className="text-slate-400 text-xs mb-1 font-medium uppercase tracking-wider">Chứng nhận trao tặng</p>
      <p className="text-2xl font-bold text-slate-800 mb-3">{user.name}</p>
      
      <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed px-4">
        Đã hoàn thành xuất sắc <b>{cert.lessonTitle}</b> môn <b>{cert.subject}</b> (Khối {cert.grade}){cert.medal ? <> và đạt huy chương <b>{cert.medal}</b></> : null}.
      </p>

      <div className="flex justify-center my-6">
        <MedalDot medal={cert.medal} />
      </div>
      
      <p className="text-xs text-slate-400">
        Ngày cấp: {new Date(cert.date).toLocaleDateString("vi-VN")}
      </p>
      
      <div className="mt-8 flex justify-between items-end px-4 border-t border-slate-100 pt-4">
        <div className="text-left">
          <p className="text-[10px] text-slate-400 leading-none">Mã chứng nhận</p>
          <span className="font-mono text-[11px] text-slate-500 font-bold uppercase">{cert.id}</span>
        </div>
        <div className="text-[11px] text-slate-500 italic font-semibold">
          Ban Quản trị AN TÂM
        </div>
      </div>
    </div>
  );
}

interface ProfilePageProps {
  user: User;
  attempts: Attempt[];
  certificates: Certificate[];
  lessons: Lesson[];
}

export function ProfilePage({ user, attempts, certificates, lessons }: ProfilePageProps) {
  const myAttempts = attempts
    .filter(a => a.userId === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const myCerts = certificates.filter(c => c.userId === user.id);
  const totalPoints = userTotalPoints(attempts, user.id);
  const medals = userMedals(attempts, lessons, user.id, user.grade || 6);
  const [certModal, setCertModal] = useState<Certificate | null>(null);

  const printCertificate = () => {
    window.print();
  };

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Hồ sơ của tôi</h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi tiến trình học tập, huy chương tích luỹ và các giấy khen đã đạt được.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-5">
          <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Tổng điểm tích luỹ</p>
          <p className="text-2xl font-extrabold text-emerald-600">{totalPoints.toFixed(1)}</p>
        </Card>
        
        <Card className="p-5">
          <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Khối lớp</p>
          <p className="text-2xl font-extrabold text-slate-700">Khối {user.grade}</p>
        </Card>
        
        <Card className="p-5">
          <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Số lần kiểm tra</p>
          <p className="text-2xl font-extrabold text-slate-700">{myAttempts.length}</p>
        </Card>
        
        <Card className="p-5">
          <p className="text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider">Huy chương đạt được</p>
          <p className="text-2xl font-extrabold text-slate-700">{medals.length}</p>
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Tiến trình theo môn học</h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {SUBJECTS.map(subject => {
            const passedMax = highestPassedLessonOrder(attempts, lessons, user.id, subject, user.grade || 6);

            return (
              <div key={subject} className="flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-slate-700">{subject}</span>
                  <Badge tone={passedMax > 0 ? "blue" : "slate"}>
                    {passedMax > 0
                      ? `Đã qua bài ${passedMax}`
                      : "Chưa bắt đầu"
                    }
                  </Badge>
                </div>

                <LessonTrack
                  subject={subject}
                  grade={user.grade || 6}
                  lessons={lessons}
                  attempts={attempts}
                  userId={user.id}
                  compact
                />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Exam History Logs */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Lịch sử kiểm tra
          </h3>
          
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {myAttempts.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {a.subject} · {lessons.find(l => l.id === a.lessonId)?.title || "—"} · {SUB_LEVEL_NAME[a.level]}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(a.date).toLocaleDateString("vi-VN")} {new Date(a.date).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <Badge tone={a.passed ? "green" : "amber"}>
                  {a.score.toFixed(1)}/10
                </Badge>
              </div>
            ))}
            {myAttempts.length === 0 && (
              <EmptyState text="Bạn chưa thực hiện bài kiểm tra nào." />
            )}
          </div>
        </Card>

        {/* Certificates Section */}
        <Card className="p-6">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
            <Award size={18} className="text-slate-400" />
            Giấy khen đạt được
          </h3>
          
          <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {myCerts.map(c => (
              <button
                key={c.id}
                onClick={() => setCertModal(c)}
                className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-400 text-left transition-all duration-150 hover:shadow-xs group bg-white"
              >
                <Award size={22} className="text-emerald-600 mb-1.5 group-hover:scale-105 transition-transform" />
                <p className="text-xs font-bold text-slate-700 leading-snug">{c.subject} · {c.lessonTitle}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {new Date(c.date).toLocaleDateString("vi-VN")}
                </p>
              </button>
            ))}
            
            {myCerts.length === 0 && (
              <div className="col-span-2">
                <EmptyState text="Hoàn thành các bài kiểm tra với điểm số ≥8 để nhận giấy khen vinh danh." />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal open={!!certModal} onClose={() => setCertModal(null)} title="Giấy khen" wide>
        {certModal && (
          <div className="space-y-4">
            <CertificateView user={user} cert={certModal} />
            <Button 
              className="w-full justify-center" 
              icon={<Printer size={16} />} 
              onClick={printCertificate}
            >
              In / Lưu giấy khen về máy
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
