import React, { useState, useMemo } from 'react';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, Award, Clock, HelpCircle } from 'lucide-react';
import { User, Lesson, Attempt, Question } from '../types';
import {
  Card, Badge, LevelLadder, highestPassedLessonOrder, isLessonUnlocked, bestAttemptsByLesson,
  orderedLessons, isLessonContentVisible, isLessonQuizVisible, tierForOrder,
  MedalDot, Button, EmptyState, Input, Textarea, Modal
} from './UI';
import { SUBJECTS, SUBJECT_COLOR, norm } from '../data/seedData';

interface StudentHomeProps {
  user: User;
  lessons: Lesson[];
  attempts: Attempt[];
  setPage: (page: string) => void;
  setActiveSubject: (subject: string) => void;
}

export function StudentHome({ user, lessons, attempts, setPage, setActiveSubject }: StudentHomeProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>("Toán");

  const getMySubjectLessons = (subject: string) => {
    return orderedLessons(lessons, subject, user.grade || 6).filter(isLessonContentVisible);
  };

  const activeLessons = getMySubjectLessons(selectedSubject);
  const activeColor = SUBJECT_COLOR[selectedSubject] || { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200", solid: "bg-slate-600" };
  const activePassedMax = highestPassedLessonOrder(attempts, lessons, user.id, selectedSubject, user.grade || 6);

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            Chào {user.name.split(" ").pop()}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hệ thống học tập Khối {user.grade} — Chọn môn học bên dưới để xem bài học và ôn tập.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* BẢNG CHỌN CÁC MÔN RIÊNG BIỆT (Left sidebar, Col span 1) */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Bảng chọn môn học
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {SUBJECTS.map(subject => {
              const c = SUBJECT_COLOR[subject] || { bg: "bg-slate-50", text: "text-slate-700", ring: "ring-slate-200", solid: "bg-slate-600" };
              const ls = getMySubjectLessons(subject);
              const passedMax = highestPassedLessonOrder(attempts, lessons, user.id, subject, user.grade || 6);
              const isSelected = selectedSubject === subject;

              return (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 ${
                    isSelected 
                      ? "border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500/30" 
                      : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${isSelected ? c.solid + " text-white" : "bg-slate-100 text-slate-500"} flex items-center justify-center shrink-0 transition-colors`}>
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${isSelected ? "text-slate-800" : "text-slate-700"}`}>
                        {subject}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {ls.length} tài liệu · Khối {user.grade}
                      </p>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge tone={passedMax > 0 ? 'green' : 'slate'}>
                      {passedMax > 0
                        ? `Đã qua bài ${passedMax}`
                        : "Chưa đạt"
                      }
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CHI TIẾT MÔN HỌC ĐÃ CHỌN (Right section, Col span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl ${activeColor.solid} text-white flex items-center justify-center shrink-0 shadow-xs`}>
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-800">{selectedSubject}</h2>
                    <Badge tone="green">Khối {user.grade}</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Bài học đã qua: <span className="font-bold text-emerald-600">{activePassedMax > 0 ? `Bài ${activePassedMax}` : "Chưa có"}</span>
                  </p>
                </div>
              </div>

              <Button 
                size="md" 
                icon={<HelpCircle size={15} />}
                onClick={() => { 
                  setActiveSubject(selectedSubject); 
                  setPage("quiz"); 
                }}
              >
                Vào ôn tập & kiểm tra
              </Button>
            </div>

            <div className="grid md:grid-cols-5 gap-6 mt-6">
              {/* Left Column: Lesson Resource Documents */}
              <div className="md:col-span-3 space-y-3">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5 mb-2">
                  <span>Bài học & Tài liệu chuẩn</span>
                  <span className="text-xs font-normal text-slate-400">({activeLessons.length} bài)</span>
                </h3>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {activeLessons.map((l, i) => (
                    <div key={l.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50/80 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">
                          {i + 1}. {l.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{l.desc}</p>
                      </div>
                      <a 
                        href={l.driveLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-white ${activeColor.text} shadow-xs border border-slate-150 hover:bg-slate-100 transition-colors`}
                      >
                        <ExternalLink size={12} /> Drive
                      </a>
                    </div>
                  ))}
                  {activeLessons.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-6 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      Chưa có bài học nào được đăng cho môn học này.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Lesson Ladder */}
              <div className="md:col-span-2 flex flex-col justify-between p-4 bg-slate-50/30 rounded-2xl border border-slate-100 h-full">
                <div>
                  <h3 className="font-bold text-slate-700 text-sm mb-1">
                    Chinh phục từng bài học
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    Đạt từ 8.0 điểm trở lên trong bài kiểm tra để mở khoá bài học tiếp theo.
                  </p>
                </div>

                <div className="flex items-center justify-center py-2">
                  <LevelLadder
                    subject={selectedSubject}
                    grade={user.grade || 6}
                    lessons={lessons}
                    attempts={attempts}
                    userId={user.id}
                    compact={false}
                  />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 leading-normal">
                  Chinh phục hết các bài học để đạt danh hiệu <span className="font-semibold text-emerald-600">Chuyên gia</span> môn {selectedSubject}!
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface QuizSelectPageProps {
  user: User;
  attempts: Attempt[];
  lessons: Lesson[];
  activeSubject: string;
  setActiveSubject: (subject: string) => void;
  onStartExam: (subject: string, lessonId: string) => void;
}

export function QuizSelectPage({
  user,
  attempts,
  lessons,
  activeSubject,
  setActiveSubject,
  onStartExam
}: QuizSelectPageProps) {
  const quizLessons = orderedLessons(lessons, activeSubject, user.grade || 6).filter(isLessonQuizVisible);
  const passedMax = highestPassedLessonOrder(attempts, lessons, user.id, activeSubject, user.grade || 6);
  const bestMap = bestAttemptsByLesson(attempts, user.id);

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Kiểm tra theo bài học</h1>
        <p className="text-sm text-slate-500 mt-1">
          Chọn môn học, sau đó chọn bài học để bắt đầu bài kiểm tra (10 câu/bài, đạt ≥8 điểm để mở khoá bài tiếp theo).
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
        {SUBJECTS.map(s => (
          <button
            key={s}
            onClick={() => setActiveSubject(s)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeSubject === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="font-bold text-slate-800 text-lg">
            {activeSubject} · Khối {user.grade}
          </h3>
          <Badge tone="green">
            Bài cao nhất đã qua: {passedMax > 0 ? `Bài ${passedMax}` : "Chưa có"}
          </Badge>
        </div>

        <LevelLadder
          subject={activeSubject}
          grade={user.grade || 6}
          lessons={lessons}
          attempts={attempts}
          userId={user.id}
          onSelect={(lessonId) => onStartExam(activeSubject, lessonId)}
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-8">
          {quizLessons.map(lesson => {
            const tier = tierForOrder(lesson.order);
            const unlocked = isLessonUnlocked(attempts, lessons, user.id, activeSubject, user.grade || 6, lesson.order);
            const best = bestMap[`${activeSubject}|${user.grade}|${lesson.id}`];
            const passed = best?.passed;

            return (
              <div
                key={lesson.id}
                className={`rounded-xl border p-4 flex flex-col justify-between min-h-[160px] ${
                  unlocked ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-bold text-sm text-slate-700">{lesson.title}</span>
                    {tier.medal && <MedalDot medal={tier.medal} />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">10 câu hỏi · Cần ≥8 điểm</p>
                  {best && (
                    <p className="text-[11px] font-semibold text-slate-500 mt-2">
                      Điểm cao nhất: {best.score.toFixed(1)}/10 {passed ? "✅" : ""}
                    </p>
                  )}
                </div>

                <Button
                  size="sm"
                  disabled={!unlocked}
                  className="mt-3 justify-center w-full"
                  onClick={() => onStartExam(activeSubject, lesson.id)}
                >
                  {unlocked ? (best ? "Làm lại" : "Bắt đầu") : "Chưa mở khoá"}
                </Button>
              </div>
            );
          })}
          {quizLessons.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-5">
              <EmptyState text="Chưa có bài kiểm tra nào được mở cho môn học này." />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface ExamPageProps {
  user: User;
  subject: string;
  lessonId: string;
  lessons: Lesson[];
  questions: Question[];
  onSubmit: (result: {
    subject: string;
    grade: number;
    lessonId: string;
    score: number;
    total: number;
    passed: boolean;
    details: any[];
  }) => void;
  onCancel: () => void;
}

export function ExamPage({ user, subject, lessonId, lessons, questions, onSubmit, onCancel }: ExamPageProps) {
  // Extract questions matching the lesson
  const qs = useMemo(() => {
    return questions.filter(q => q.lessonId === lessonId);
  }, [questions, lessonId]);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [idx, setIdx] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const setAnswerValue = (qid: string, val: any) => {
    setAnswers(prev => ({ ...prev, [qid]: val }));
  };

  const answeredCount = Object.keys(answers).filter(k => {
    return answers[k] !== undefined && answers[k] !== "";
  }).length;

  const lesson = lessons.find(l => l.id === lessonId);

  const submitExam = () => {
    let totalScore = 0;
    const details = qs.map(q => {
      let score = 0;
      const given = answers[q.id];

      if (q.type === 'mcq') {
        score = (given === q.correct) ? 1 : 0;
      } else if (q.type === 'short') {
        score = (given && norm(given) === norm(q.sampleAnswer || '')) ? 1 : 0;
      } else if (q.type === 'essay') {
        const text = norm(given || "");
        const matched = (q.keywords || []).filter(k => text.includes(norm(k)));
        score = (q.keywords && q.keywords.length > 0)
          ? +(matched.length / q.keywords.length).toFixed(2)
          : 0;
      }

      totalScore += score;
      return {
        qid: q.id,
        type: q.type,
        content: q.content,
        given,
        score
      };
    });

    totalScore = Math.round(totalScore * 10) / 10;

    onSubmit({
      subject,
      grade: user.grade || 6,
      lessonId,
      score: totalScore,
      total: 10,
      passed: totalScore >= 8,
      details
    });
  };

  if (qs.length === 0) {
    return (
      <Card className="p-8 text-center max-w-lg mx-auto">
        <EmptyState text="Chưa có câu hỏi cho bài học này. Vui lòng liên hệ Admin để bổ sung ngân hàng câu hỏi." />
        <Button onClick={onCancel} variant="secondary" className="mt-4">
          Quay lại
        </Button>
      </Card>
    );
  }

  const q = qs[idx];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-extrabold text-lg text-slate-800">{subject} · {lesson ? lesson.title : ""}</h2>
          <p className="text-xs text-slate-400">
            Khối {user.grade} · Câu {idx + 1}/{qs.length} · Đã trả lời {answeredCount}/{qs.length}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Thoát
        </Button>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300" 
          style={{ width: `${((idx + 1) / qs.length) * 100}%` }}
        ></div>
      </div>

      <Card className="p-6 animate-fadeUp" key={q.id}>
        <div className="flex items-center gap-2 mb-3">
          <Badge tone={q.type === 'mcq' ? 'blue' : q.type === 'short' ? 'sky' : 'amber'}>
            {q.type === 'mcq' ? 'Trắc nghiệm' : q.type === 'short' ? 'Trả lời ngắn' : 'Bài luận ngắn'}
          </Badge>
          <span className="text-xs text-slate-400">1 điểm</span>
        </div>
        
        <p className="font-semibold text-slate-800 text-lg mb-5 leading-relaxed">{q.content}</p>

        {q.type === 'mcq' && (
          <div className="space-y-2.5">
            {(q.options || []).map((opt, i) => (
              <button 
                key={i} 
                onClick={() => setAnswerValue(q.id, i)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                  answers[q.id] === i 
                    ? "border-emerald-500 bg-emerald-50/50" 
                    : "border-slate-200 hover:border-emerald-200 bg-white"
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  answers[q.id] === i ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                }`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-slate-700 font-medium">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {q.type === 'short' && (
          <Input 
            placeholder="Nhập câu trả lời ngắn gọn..." 
            value={answers[q.id] || ""} 
            onChange={e => setAnswerValue(q.id, e.target.value)} 
          />
        )}

        {q.type === 'essay' && (
          <Textarea 
            rows={5} 
            placeholder="Viết bài luận ngắn của bạn tại đây..." 
            value={answers[q.id] || ""} 
            onChange={e => setAnswerValue(q.id, e.target.value)} 
          />
        )}
      </Card>

      <div className="flex items-center justify-between mt-5">
        <Button variant="secondary" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>
          Câu trước
        </Button>
        
        <div className="flex gap-1.5">
          {qs.map((qq, i) => (
            <button 
              key={qq.id} 
              onClick={() => setIdx(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                i === idx 
                  ? "bg-emerald-600 w-6" 
                  : answers[qq.id] !== undefined && answers[qq.id] !== ""
                    ? "bg-emerald-400" 
                    : "bg-slate-200"
              }`}
            ></button>
          ))}
        </div>

        {idx < qs.length - 1 ? (
          <Button onClick={() => setIdx(i => i + 1)}>
            Câu tiếp
          </Button>
        ) : (
          <Button variant="success" onClick={() => setConfirmSubmit(true)}>
            Nộp bài
          </Button>
        )}
      </div>

      <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Xác nhận nộp bài">
        <p className="text-sm text-slate-600 mb-1">
          Bạn đã trả lời {answeredCount}/{qs.length} câu.
        </p>
        <p className="text-sm text-slate-500 mb-5">
          Sau khi nộp, bạn sẽ không thể chỉnh sửa câu trả lời. Tiếp tục nộp bài?
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmSubmit(false)}>
            Kiểm tra lại
          </Button>
          <Button variant="success" className="flex-1 justify-center" onClick={submitExam}>
            Nộp bài ngay
          </Button>
        </div>
      </Modal>
    </div>
  );
}

interface ResultPageProps {
  result: Attempt;
  lessons: Lesson[];
  onContinue: () => void;
  onRetry: () => void;
}

export function ResultPage({ result, lessons, onContinue, onRetry }: ResultPageProps) {
  const lesson = lessons.find(l => l.id === result.lessonId);
  const tier = tierForOrder(lesson?.order || 1);
  const passed = result.passed;

  return (
    <div className="max-w-lg mx-auto text-center py-6">
      <Card className="p-8 animate-popIn">
        <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-4 ${
          passed ? "bg-emerald-100" : "bg-amber-100"
        }`}>
          <Award size={36} className={passed ? "text-emerald-600" : "text-amber-600"} />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 mb-1">
          {passed ? "Chúc mừng bạn đã hoàn thành bài học! 🎉" : "Chưa đạt yêu cầu"}
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          {result.subject} · {lesson ? lesson.title : ""} · Khối {result.grade}
        </p>

        <div className="text-5xl font-extrabold text-emerald-600 mb-2">
          {result.score.toFixed(1)}
          <span className="text-xl text-slate-300">/10</span>
        </div>

        <p className="text-sm text-slate-500 mb-6 px-4">
          {passed
            ? `Bạn đã đạt điều kiện (≥8 điểm) để mở khoá bài học tiếp theo.`
            : `Cần đạt tối thiểu 8/10 điểm để qua bài. Hãy ôn tập và thử lại nhé!`
          }
        </p>

        {passed && tier.medal && (
          <div className="flex justify-center mb-6">
            <MedalDot medal={tier.medal} />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 justify-center" onClick={onRetry}>
            Làm lại bài này
          </Button>
          <Button className="flex-1 justify-center" onClick={onContinue}>
            Về danh sách bài học
          </Button>
        </div>
      </Card>
    </div>
  );
}
