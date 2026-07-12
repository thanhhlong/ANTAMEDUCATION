import React, { useState } from 'react';
import { 
  Shield, 
  Home, 
  HelpCircle, 
  Trophy, 
  User as UserIcon, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle2, 
  Award 
} from 'lucide-react';
import { User, Question, Lesson, Post, Document, Attempt, Certificate, ToastData } from './types';
import { 
  generateUsers, 
  generateAllQuestions, 
  generateLessons, 
  generatePosts, 
  generateDocuments,
  nid,
  todayStr 
} from './data/seedData';
import { AuthShell, LoginPage, RegisterPage } from './components/Auth';
import { Toast, Badge, Avatar, highestPassedLessonOrder, tierForOrder, AnTamLogo } from './components/UI';
import { StudentHome, QuizSelectPage, ExamPage, ResultPage } from './components/Student';
import { TeacherDocuments } from './components/Teacher';
import { 
  AdminOverview, 
  AdminStudents, 
  AdminQuestions, 
  AdminLessons, 
  AdminPosts 
} from './components/Admin';
import { RankingPage } from './components/Ranking';
import { ProfilePage } from './components/Profile';
import { PostsPage } from './components/Posts';
import { ChatbotPage } from './components/Chatbot';

const NAV_ITEMS = {
  student: [
    { key: "home", label: "Chương trình học", icon: <Home size={17} /> },
    { key: "quiz", label: "Kiểm tra & Xếp cấp", icon: <HelpCircle size={17} /> },
    { key: "ranking", label: "Bảng xếp hạng", icon: <Trophy size={17} /> },
    { key: "profile", label: "Hồ sơ của tôi", icon: <UserIcon size={17} /> },
    { key: "posts", label: "Bài viết chia sẻ", icon: <MessageSquare size={17} /> },
    { key: "chatbot", label: "Chatbot tài liệu", icon: <FileText size={17} /> },
  ],
  teacher: [
    { key: "posts", label: "Bài viết của tôi", icon: <MessageSquare size={17} /> },
    { key: "documents", label: "Tài liệu Chatbot", icon: <FileText size={17} /> },
    { key: "chatbot", label: "Dùng thử Chatbot", icon: <MessageSquare size={17} /> },
  ],
  admin: [
    { key: "overview", label: "Tổng quan", icon: <Home size={17} /> },
    { key: "students", label: "Quản lý học sinh", icon: <UsersIcon size={17} /> },
    { key: "questions", label: "Ngân hàng câu hỏi", icon: <HelpCircle size={17} /> },
    { key: "lessons", label: "Chương trình học", icon: <BookOpen size={17} /> },
    { key: "posts", label: "Duyệt bài viết", icon: <MessageSquare size={17} /> },
    { key: "ranking", label: "Xếp hạng & điểm", icon: <Trophy size={17} /> },
  ],
};

function UsersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const ROLE_LABEL: Record<string, string> = { admin: "Quản trị viên", teacher: "Giáo viên", student: "Học sinh" };
const ROLE_TONE: Record<string, string> = { admin: "red", teacher: "indigo", student: "green" };

export default function App() {
  // State initialization
  const [users, setUsers] = useState<User[]>(() => generateUsers());
  const [initialLessons] = useState<Lesson[]>(() => generateLessons());
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [questions, setQuestions] = useState<Question[]>(() => generateAllQuestions(initialLessons));
  const [posts, setPosts] = useState<Post[]>(() => generatePosts(users));
  const [documents, setDocuments] = useState<Document[]>(() => generateDocuments(users));
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  // Navigation states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState<string>('home');
  const [activeSubject, setActiveSubject] = useState<string>("Toán");
  const [examState, setExamState] = useState<{ subject: string; lessonId: string } | null>(null);
  const [result, setResult] = useState<Attempt | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [mobileNav, setMobileNav] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setPage('overview');
    } else if (user.role === 'teacher') {
      setPage('posts');
    } else {
      setPage('home');
    }
    showToast(`Xin chào, ${user.name}!`);
  };

  const handleRegister = (user: User) => {
    setUsers(prev => [...prev, user]);
    setCurrentUser(user);
    setPage('home');
    showToast("Đăng ký thành công! Chào mừng bạn đến với AN TÂM.");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthView('login');
    setExamState(null);
    setResult(null);
    setMobileNav(false);
  };

  const handleAddPost = (title: string, content: string) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: nid("p"),
      authorId: currentUser.id,
      title,
      content,
      status: 'pending',
      kind: 'community',
      createdAt: todayStr()
    };
    setPosts(prev => [...prev, newPost]);
    showToast("Đã gửi bài viết, vui lòng chờ Admin duyệt.");
  };

  const handleStartExam = (subject: string, lessonId: string) => {
    setExamState({ subject, lessonId });
    setResult(null);
  };

  const handleSubmitExam = (examResult: {
    subject: string;
    grade: number;
    lessonId: string;
    score: number;
    total: number;
    passed: boolean;
    details: any[];
  }) => {
    if (!currentUser) return;

    const lesson = lessons.find(l => l.id === examResult.lessonId);
    const alreadyPassed = lesson
      ? highestPassedLessonOrder(attempts, lessons, currentUser.id, examResult.subject, examResult.grade) >= lesson.order
      : false;
    const newAttempt: Attempt = {
      id: nid("att"),
      userId: currentUser.id,
      ...examResult,
      date: new Date().toISOString()
    };

    setAttempts(prev => [...prev, newAttempt]);

    if (examResult.passed && !alreadyPassed && lesson) {
      const tier = tierForOrder(lesson.order);
      const newCert: Certificate = {
        id: nid("cert"),
        userId: currentUser.id,
        subject: examResult.subject,
        grade: examResult.grade,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        medal: tier.medal,
        date: todayStr()
      };
      setCertificates(prev => [...prev, newCert]);
      showToast(`Chúc mừng! Bạn đã hoàn thành "${lesson.title}"${tier.medal ? ` và nhận huy chương ${tier.medal}!` : "!"}`);
    }

    setExamState(null);
    setResult(newAttempt);
  };

  // Logged-out layout rendering
  if (!currentUser) {
    return (
      <div className="font-sans min-h-screen bg-slate-50">
        <AuthShell>
          {authView === 'login' ? (
            <LoginPage 
              onLogin={handleLogin} 
              goRegister={() => setAuthView('register')} 
              users={users} 
            />
          ) : (
            <RegisterPage 
              onRegister={handleRegister} 
              goLogin={() => setAuthView('login')} 
              users={users} 
            />
          )}
        </AuthShell>
        <Toast toast={toast} />
      </div>
    );
  }

  // Active page selection
  const navItems = NAV_ITEMS[currentUser.role] || [];
  
  let content;
  if (currentUser.role === 'student') {
    if (examState) {
      content = (
        <ExamPage
          user={currentUser}
          subject={examState.subject}
          lessonId={examState.lessonId}
          lessons={lessons}
          questions={questions}
          onSubmit={handleSubmitExam}
          onCancel={() => setExamState(null)}
        />
      );
    } else if (result) {
      content = (
        <ResultPage
          result={result}
          lessons={lessons}
          onContinue={() => { setResult(null); setPage("quiz"); }}
          onRetry={() => { setExamState({ subject: result.subject, lessonId: result.lessonId }); setResult(null); }}
        />
      );
    } else if (page === 'home') {
      content = (
        <StudentHome
          user={currentUser}
          lessons={lessons}
          attempts={attempts}
          setPage={setPage}
          setActiveSubject={setActiveSubject}
        />
      );
    } else if (page === 'quiz') {
      content = (
        <QuizSelectPage
          user={currentUser}
          attempts={attempts}
          lessons={lessons}
          activeSubject={activeSubject}
          setActiveSubject={setActiveSubject}
          onStartExam={handleStartExam}
        />
      );
    } else if (page === 'ranking') {
      content = <RankingPage users={users} attempts={attempts} lessons={lessons} currentUser={currentUser} />;
    } else if (page === 'profile') {
      content = <ProfilePage user={currentUser} attempts={attempts} certificates={certificates} lessons={lessons} />;
    } else if (page === 'posts') {
      content = <PostsPage user={currentUser} posts={posts} users={users} onAddPost={handleAddPost} />;
    } else if (page === 'chatbot') {
      content = <ChatbotPage user={currentUser} documents={documents} />;
    }
  } else if (currentUser.role === 'teacher') {
    if (page === 'posts') {
      content = <PostsPage user={currentUser} posts={posts} users={users} onAddPost={handleAddPost} />;
    } else if (page === 'documents') {
      content = (
        <TeacherDocuments 
          user={currentUser} 
          documents={documents} 
          setDocuments={setDocuments} 
          showToast={showToast} 
        />
      );
    } else if (page === 'chatbot') {
      content = <ChatbotPage user={currentUser} documents={documents} />;
    }
  } else if (currentUser.role === 'admin') {
    if (page === 'overview') {
      content = (
        <AdminOverview 
          users={users} 
          questions={questions} 
          posts={posts} 
          attempts={attempts} 
          lessons={lessons} 
          setPage={setPage} 
        />
      );
    } else if (page === 'students') {
      content = (
        <AdminStudents 
          users={users} 
          setUsers={setUsers} 
          attempts={attempts} 
          showToast={showToast} 
        />
      );
    } else if (page === 'questions') {
      content = (
        <AdminQuestions
          questions={questions}
          setQuestions={setQuestions}
          lessons={lessons}
          setLessons={setLessons}
          showToast={showToast}
        />
      );
    } else if (page === 'lessons') {
      content = <AdminLessons lessons={lessons} setLessons={setLessons} showToast={showToast} />;
    } else if (page === 'posts') {
      content = <AdminPosts posts={posts} setPosts={setPosts} users={users} showToast={showToast} />;
    } else if (page === 'ranking') {
      content = <RankingPage users={users} attempts={attempts} lessons={lessons} currentUser={currentUser} />;
    }
  }

  const navigateToPage = (target: string) => {
    setPage(target);
    setExamState(null);
    setResult(null);
    setMobileNav(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 bg-white sticky top-0 h-screen shadow-xs">
        <div className="px-4 py-5 flex flex-col items-center gap-2 border-b border-slate-100 text-center">
          <AnTamLogo size={75} />
          <div className="mt-1">
            <div className="font-extrabold text-base text-emerald-800 tracking-tight leading-none">AN TÂM</div>
            <div className="font-bold text-[8px] text-amber-600 tracking-[0.25em] mt-1.5 leading-none uppercase">EDUCATION</div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(it => (
            <button 
              key={it.key} 
              onClick={() => navigateToPage(it.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 ${
                page === it.key && !examState && !result
                  ? "bg-emerald-50 text-emerald-700" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {it.icon}
              <span>{it.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar name={currentUser.name} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">{currentUser.name}</p>
              <Badge tone={ROLE_TONE[currentUser.role]}>{ROLE_LABEL[currentUser.role]}</Badge>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full justify-center inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 py-2.5 mt-2 transition-colors"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Top bar for Mobile */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AnTamLogo size={36} />
          <div>
            <div className="font-extrabold text-xs text-emerald-800 leading-none">AN TÂM</div>
            <div className="font-bold text-[7px] text-amber-600 tracking-widest mt-0.5 leading-none uppercase">EDUCATION</div>
          </div>
        </div>
        <button 
          onClick={() => setMobileNav(v => !v)} 
          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 active:scale-95 transition-all"
        >
          {mobileNav ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileNav && (
        <div className="lg:hidden fixed top-[53px] inset-x-0 z-30 bg-white border-b border-slate-200 shadow-md p-3 space-y-1 animate-fadeUp">
          {navItems.map(it => (
            <button 
              key={it.key} 
              onClick={() => navigateToPage(it.key)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                page === it.key && !examState && !result
                  ? "bg-emerald-50 text-emerald-700" 
                  : "text-slate-500 bg-slate-50"
              }`}
            >
              {it.icon}
              <span>{it.label}</span>
            </button>
          ))}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100/75 transition-colors"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 pb-16 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {content}
        </div>
      </main>

      {/* Mobile Bottom Tab bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 flex items-stretch px-1 py-1 scrollbar-none overflow-x-auto gap-0.5 shadow-lg">
        {navItems.map(it => (
          <button 
            key={it.key} 
            onClick={() => navigateToPage(it.key)}
            className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-bold ${
              page === it.key && !examState && !result ? "text-emerald-600 bg-emerald-50/50" : "text-slate-400"
            }`}
          >
            {it.icon}
            <span className="truncate max-w-[56px]">{it.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
      
      {/* Toast Alert */}
      <Toast toast={toast} />
    </div>
  );
}
