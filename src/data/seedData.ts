import { User, Question, Lesson, Post, Document } from '../types';

export const SUBJECTS = ["Toán", "Tiếng Anh", "Văn", "KHTN"];
export const GRADES = [6, 7, 8, 9];

export interface LevelInfo {
  id: number;
  name: string;
  medal: 'Đồng' | 'Bạc' | 'Vàng' | 'Kim cương' | null;
  color: string;
  grad: string;
}

export const LEVELS: LevelInfo[] = [
  { id: 1, name: "Nhập môn",   medal: null,        color: "#94a3b8", grad: "from-slate-400 to-slate-500" },
  { id: 2, name: "Sơ cấp",     medal: "Đồng",      color: "#b45309", grad: "from-amber-600 to-amber-700" },
  { id: 3, name: "Trung cấp",  medal: "Bạc",       color: "#64748b", grad: "from-slate-400 to-slate-600" },
  { id: 4, name: "Siêu cấp",   medal: "Vàng",      color: "#ca8a04", grad: "from-yellow-400 to-yellow-600" },
  { id: 5, name: "Chuyên gia", medal: "Kim cương", color: "#0ea5e9", grad: "from-sky-400 to-blue-600" },
];

// Each lesson's quiz is split into 3 sequential sub-levels (Cấp 1 -> Cấp 2 -> Cấp 3).
// Passing Cấp 3 is what marks the lesson itself as complete.
export const SUB_LEVELS = [1, 2, 3];
export const SUB_LEVEL_NAME: Record<number, string> = { 1: "Cấp 1", 2: "Cấp 2", 3: "Cấp 3" };
export const MAX_SUB_LEVEL = 3;

export const SUBJECT_COLOR: Record<string, { bg: string; text: string; ring: string; solid: string }> = {
  "Toán": { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-200", solid: "bg-blue-600" },
  "Tiếng Anh": { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200", solid: "bg-sky-600" },
  "Văn": { bg: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-200", solid: "bg-indigo-600" },
  "KHTN": { bg: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-200", solid: "bg-cyan-600" },
};

let __id = 1000;
export const nid = (p = "id") => `${p}_${(__id++).toString(36)}`;

export const norm = (s = ""): string => {
  return s.toString().trim().toLowerCase().replace(/\s+/g, " ")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Math generator
function mcqMath(grade: number, level: number, seedIdx: number) {
  const scale = grade * 2 + level;
  const a = 5 + seedIdx * 3 + scale;
  const b = 2 + (seedIdx % 6) + level;
  const ops = ["+", "-", "x"];
  const op = ops[seedIdx % ops.length];
  let correct: number;
  if (op === "+") correct = a + b;
  else if (op === "-") correct = Math.max(a, b) - Math.min(a, b);
  else correct = (2 + seedIdx % 4) * (1 + level);

  const A = op === "x" ? (2 + seedIdx % 4) : a;
  const B = op === "x" ? (1 + level) : b;
  const distract = new Set<number>([correct]);
  while (distract.size < 4) {
    distract.add(Math.max(0, correct + (Math.floor(Math.random() * 9) - 4)));
  }
  const options = shuffle([...distract]).slice(0, 4);
  if (!options.includes(correct)) options[0] = correct;
  return {
    content: `Tính giá trị biểu thức: ${A} ${op} ${B} = ?`,
    options: options.map(String),
    correct: options.indexOf(correct)
  };
}

function mcqEnglish(grade: number, level: number, seedIdx: number) {
  const bank = [
    ["book", "Quyển sách"], ["teacher", "Giáo viên"], ["friend", "Bạn bè"], ["school", "Trường học"],
    ["family", "Gia đình"], ["happy", "Vui vẻ"], ["weather", "Thời tiết"], ["travel", "Du lịch"],
    ["healthy", "Khỏe mạnh"], ["future", "Tương lai"], ["important", "Quan trọng"], ["environment", "Môi trường"]
  ];
  const [word, meaning] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = shuffle(bank.filter(x => x[1] !== meaning)).slice(0, 3).map(x => x[1]);
  const options = shuffle([meaning, ...wrongs]);
  return {
    content: `Từ "${word}" có nghĩa là gì?`,
    options,
    correct: options.indexOf(meaning)
  };
}

function mcqLit(grade: number, level: number, seedIdx: number) {
  const bank = [
    ["Thể loại của truyện cổ tích thường mang yếu tố gì?", "Kỳ ảo, hoang đường"],
    ["Biện pháp tu từ so sánh dùng để làm gì?", "Làm nổi bật đặc điểm sự vật"],
    ["Ngôi kể thứ nhất được nhận biết qua đại từ nào?", "Tôi / Chúng tôi"],
    ["Thể thơ lục bát có đặc điểm số câu chữ như thế nào?", "Câu 6 chữ xen câu 8 chữ"],
    ["Văn bản nghị luận chủ yếu dùng để làm gì?", "Trình bày quan điểm, lập luận"],
    ["Nhân vật phản diện trong truyện thường có vai trò gì?", "Tạo xung đột với nhân vật chính"],
  ];
  const [content, correctAns] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ["Miêu tả cảnh thiên nhiên", "Kể lại số liệu thống kê", "Chỉ dùng trong văn bản hành chính"];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return {
    content,
    options,
    correct: options.indexOf(correctAns)
  };
}

function mcqScience(grade: number, level: number, seedIdx: number) {
  const bank = [
    ["Nước sôi ở nhiệt độ bao nhiêu độ C (áp suất thường)?", "100°C"],
    ["Cơ quan nào của cơ thể có chức năng bơm máu?", "Tim"],
    ["Quá trình cây xanh tạo ra oxy gọi là gì?", "Quang hợp"],
    ["Đơn vị đo lực trong hệ SI là gì?", "Newton (N)"],
    ["Chất nào cần thiết cho sự cháy?", "Oxy"],
    ["Hiện tượng Trái Đất quay quanh Mặt Trời gọi là gì?", "Chuyển động quỹ đạo"],
  ];
  const [content, correctAns] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ["Nitơ", "0°C", "Hô hấp tế bào", "Watt (W)"];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return {
    content,
    options,
    correct: options.indexOf(correctAns)
  };
}

function shortQ(subject: string, grade: number, level: number, seedIdx: number) {
  const bank: Record<string, [string, string][]> = {
    "Toán": [["Số nguyên tố nhỏ nhất là số nào?", "2"], ["1/2 viết dưới dạng số thập phân là?", "0.5"], ["Chu vi hình vuông cạnh 5cm là?", "20"]],
    "Tiếng Anh": [["Số nhiều của 'child' là gì?", "children"], ["Đối lập của 'big' là gì?", "small"], ["Thì hiện tại đơn của 'go' ở ngôi thứ 3 số ít?", "goes"]],
    "Văn": [["Tác giả của 'Truyện Kiều' là ai?", "Nguyễn Du"], ["'Lão Hạc' là tác phẩm của ai?", "Nam Cao"], ["Thể loại của 'Tắt đèn' là gì?", "Tiểu thuyết"]],
    "KHTN": [["Ký hiệu hóa học của nước là gì?", "H2O"], ["Đơn vị đo khối lượng cơ bản là gì?", "kg"], ["Hành tinh gần Mặt Trời nhất là?", "Sao Thủy"]],
  };
  const arr = bank[subject] || bank["Toán"];
  const [content, sample] = arr[(seedIdx + grade + level) % arr.length];
  return {
    content,
    sampleAnswer: sample
  };
}

function essayQ(subject: string, grade: number, level: number, seedIdx: number) {
  const bank: Record<string, [string, string[]][]> = {
    "Toán": [["Nêu ngắn gọn cách tính diện tích hình chữ nhật.", ["chiều dài", "chiều rộng", "nhân", "diện tích"]]],
    "Tiếng Anh": [["Viết 2-3 câu giới thiệu ngắn về bản thân bằng tiếng Anh.", ["name", "age", "school", "like", "from"]]],
    "Văn": [["Nêu cảm nhận ngắn gọn về tình yêu quê hương trong văn học.", ["quê hương", "tình yêu", "kỷ niệm", "gắn bó", "tự hào"]]],
    "KHTN": [["Trình bày ngắn gọn vai trò của nước đối với sự sống.", ["nước", "sự sống", "cơ thể", "cần thiết", "trao đổi chất"]]],
  };
  const arr = bank[subject] || bank["Toán"];
  const [content, keywords] = arr[seedIdx % arr.length];
  return {
    content,
    keywords
  };
}

export function generateQuestionsFor(subject: string, grade: number, lessonId: string, level: number, varietySeed: number): Question[] {
  const gens: Record<string, (g: number, l: number, s: number) => { content: string; options: string[]; correct: number }> = {
    "Toán": mcqMath, "Tiếng Anh": mcqEnglish, "Văn": mcqLit, "KHTN": mcqScience
  };
  const mk = gens[subject] || mcqMath;
  const qs: Question[] = [];
  const seedBase = varietySeed * 10;

  for (let i = 0; i < 6; i++) {
    const m = mk(grade, level, seedBase + i);
    qs.push({
      id: nid("q"),
      subject,
      grade,
      lessonId,
      level,
      type: "mcq",
      content: m.content,
      options: m.options,
      correct: m.correct
    });
  }

  for (let i = 0; i < 2; i++) {
    const s = shortQ(subject, grade, level, seedBase + i);
    qs.push({
      id: nid("q"),
      subject,
      grade,
      lessonId,
      level,
      type: "short",
      content: s.content,
      sampleAnswer: s.sampleAnswer
    });
  }

  for (let i = 0; i < 2; i++) {
    const e = essayQ(subject, grade, level, seedBase + i);
    qs.push({
      id: nid("q"),
      subject,
      grade,
      lessonId,
      level,
      type: "essay",
      content: e.content,
      keywords: e.keywords
    });
  }

  return qs;
}

export function generateAllQuestions(lessons: Lesson[]): Question[] {
  const out: Question[] = [];
  lessons.forEach(lesson => {
    SUB_LEVELS.forEach(level => {
      out.push(...generateQuestionsFor(lesson.subject, lesson.grade, lesson.id, level, lesson.order));
    });
  });
  return out;
}

const LESSON_TITLES: Record<string, string[]> = {
  "Toán": ["Số tự nhiên & phép tính", "Phân số cơ bản", "Hình học phẳng", "Tỉ lệ & phần trăm", "Ôn tập tổng hợp"],
  "Tiếng Anh": ["Từ vựng chủ đề gia đình", "Ngữ pháp thì hiện tại", "Kỹ năng đọc hiểu", "Giao tiếp cơ bản", "Ôn tập từ vựng"],
  "Văn": ["Văn bản tự sự", "Thơ lục bát", "Văn nghị luận xã hội", "Truyện ngắn hiện đại", "Ôn tập tác phẩm"],
  "KHTN": ["Vật chất & năng lượng", "Cơ thể người", "Sinh vật & môi trường", "Lực & chuyển động", "Ôn tập KHTN"],
};

export function generateLessons(): Lesson[] {
  const out: Lesson[] = [];
  SUBJECTS.forEach(subject => {
    GRADES.forEach(grade => {
      (LESSON_TITLES[subject] || []).forEach((title, i) => {
        out.push({
          id: nid("les"),
          subject,
          grade,
          order: i + 1,
          title: `Bài ${i + 1}: ${title} (Khối ${grade})`,
          desc: `Tài liệu học tập môn ${subject} dành cho khối ${grade}.`,
          driveLink: "https://drive.google.com/drive/folders/an-tam-demo"
        });
      });
    });
  });
  return out;
}

export function generateUsers(): User[] {
  const users: User[] = [
    { id: nid("u"), name: "Admin Hệ thống", email: "admin@antam.vn", password: "admin123", role: "admin" },
    { id: nid("u"), name: "Nguyễn Thị Lan", email: "gv.lan@antam.vn", password: "gv123456", role: "teacher" },
    { id: nid("u"), name: "Trần Văn Minh", email: "gv.minh@antam.vn", password: "gv123456", role: "teacher" },
  ];
  const studentNames = ["Lê Gia Bảo", "Phạm Thu Hà", "Đỗ Minh Khang", "Vũ Ngọc Anh", "Hoàng Bảo Châu", "Bùi Đức Huy", "Ngô Thanh Trúc", "Đinh Quốc Việt"];
  studentNames.forEach((name, i) => {
    users.push({
      id: nid("u"),
      name,
      email: `hs${i + 1}@antam.vn`,
      password: "hs123456",
      role: "student",
      grade: GRADES[i % GRADES.length]
    });
  });
  return users;
}

export function generatePosts(users: User[]): Post[] {
  const admin = users.find(u => u.role === "admin") || { id: "admin" };
  const teacher = users.find(u => u.role === "teacher") || { id: "teacher" };
  const student = users.find(u => u.role === "student") || { id: "student" };
  return [
    { id: nid("p"), authorId: admin.id, title: "Chào mừng đến với AN TÂM", content: "AN TÂM là nền tảng học tập và kiểm tra trực tuyến dành cho học sinh khối 6-9. Cùng học và làm bài kiểm tra lần lượt theo từng bài học để chinh phục toàn bộ chương trình!", status: "approved", kind: "official", createdAt: todayStr() },
    { id: nid("p"), authorId: teacher.id, title: "Bí quyết ôn tập môn Toán hiệu quả", content: "Học sinh nên luyện tập đều đặn mỗi ngày 30 phút, ưu tiên nắm chắc lý thuyết trước khi làm bài tập nâng cao. Ôn theo từng chuyên đề nhỏ sẽ dễ nhớ hơn.", status: "approved", kind: "official", createdAt: todayStr() },
    { id: nid("p"), authorId: student.id, title: "Chia sẻ cách học từ vựng tiếng Anh", content: "Mình hay dùng flashcard và học 10 từ mới mỗi ngày, ôn lại vào cuối tuần. Cách này giúp mình nhớ lâu hơn rất nhiều!", status: "approved", kind: "community", createdAt: todayStr() },
    { id: nid("p"), authorId: student.id, title: "Kinh nghiệm làm bài luận Văn", content: "Trước khi viết, mình luôn lập dàn ý ngắn gọn để bài viết mạch lạc và không bị thiếu ý.", status: "pending", kind: "community", createdAt: todayStr() },
  ];
}

export function generateDocuments(users: User[]): Document[] {
  const teacher = users.find(u => u.role === "teacher") || { id: "teacher" };
  return [
    {
      id: nid("doc"),
      teacherId: teacher.id,
      subject: "Toán",
      grade: 6,
      title: "Tài liệu ôn tập Số tự nhiên - Khối 6",
      content: `Số tự nhiên là các số 0, 1, 2, 3, ... dùng để đếm và ghi số lượng đồ vật.
Phép cộng hai số tự nhiên luôn cho ra một số tự nhiên khác.
Phép trừ chỉ thực hiện được khi số bị trừ lớn hơn hoặc bằng số trừ.
Phép nhân là phép cộng lặp lại nhiều lần của cùng một số.
Phép chia hết là phép chia mà số dư bằng 0.
Số nguyên tố là số tự nhiên lớn hơn 1 chỉ chia hết cho 1 và chính nó, ví dụ 2, 3, 5, 7, 11.
Ước chung lớn nhất (ƯCLN) của hai số là số lớn nhất chia hết cả hai số đó.
Bội chung nhỏ nhất (BCNN) của hai số là số nhỏ nhất chia hết cho cả hai số đó.`,
      uploadedAt: todayStr()
    },
    {
      id: nid("doc"),
      teacherId: teacher.id,
      subject: "KHTN",
      grade: 7,
      title: "Tài liệu Cơ thể người - Khối 7",
      content: `Hệ tuần hoàn gồm tim và mạch máu, có nhiệm vụ vận chuyển máu đi khắp cơ thể.
Tim là cơ quan bơm máu, có 4 ngăn gồm 2 tâm nhĩ và 2 tâm thất.
Hệ hô hấp gồm mũi, khí quản, phổi, giúp trao đổi khí oxy và khí cacbonic.
Hệ tiêu hóa gồm miệng, thực quản, dạ dày, ruột non, ruột già, có nhiệm vụ tiêu hóa thức ăn.
Hệ thần kinh gồm não, tủy sống và các dây thần kinh, điều khiển mọi hoạt động của cơ thể.
Xương và cơ tạo nên hệ vận động, giúp cơ thể di chuyển và giữ tư thế.`,
      uploadedAt: todayStr()
    }
  ];
}
