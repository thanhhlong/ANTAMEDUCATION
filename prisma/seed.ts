// Seeds the same demo content the frontend used to generate in-browser
// (src/data/seedData.ts), now persisted once into the real database.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SUBJECTS = ['Toán', 'Tiếng Anh', 'Văn', 'KHTN'];
const GRADES = [6, 7, 8, 9];
const SUB_LEVELS = [1, 2, 3];

const LEVELS = [
  { id: 1, name: 'Nhập môn', medal: null as string | null, color: '#94a3b8', grad: 'from-slate-400 to-slate-500' },
  { id: 2, name: 'Sơ cấp', medal: 'Đồng', color: '#b45309', grad: 'from-amber-600 to-amber-700' },
  { id: 3, name: 'Trung cấp', medal: 'Bạc', color: '#64748b', grad: 'from-slate-400 to-slate-600' },
  { id: 4, name: 'Siêu cấp', medal: 'Vàng', color: '#ca8a04', grad: 'from-yellow-400 to-yellow-600' },
  { id: 5, name: 'Chuyên gia', medal: 'Kim cương', color: '#0ea5e9', grad: 'from-sky-400 to-blue-600' },
];

function norm(s = ''): string {
  return s.toString().trim().toLowerCase().replace(/\s+/g, ' ')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mcqMath(grade: number, level: number, seedIdx: number) {
  const scale = grade * 2 + level;
  const a = 5 + seedIdx * 3 + scale;
  const b = 2 + (seedIdx % 6) + level;
  const ops = ['+', '-', 'x'];
  const op = ops[seedIdx % ops.length];
  let correct: number;
  if (op === '+') correct = a + b;
  else if (op === '-') correct = Math.max(a, b) - Math.min(a, b);
  else correct = (2 + (seedIdx % 4)) * (1 + level);

  const A = op === 'x' ? 2 + (seedIdx % 4) : a;
  const B = op === 'x' ? 1 + level : b;
  const distract = new Set<number>([correct]);
  while (distract.size < 4) {
    distract.add(Math.max(0, correct + (Math.floor(Math.random() * 9) - 4)));
  }
  const options = shuffle([...distract]).slice(0, 4);
  if (!options.includes(correct)) options[0] = correct;
  return { content: `Tính giá trị biểu thức: ${A} ${op} ${B} = ?`, options: options.map(String), correct: options.indexOf(correct) };
}

function mcqEnglish(grade: number, level: number, seedIdx: number) {
  const bank = [
    ['book', 'Quyển sách'], ['teacher', 'Giáo viên'], ['friend', 'Bạn bè'], ['school', 'Trường học'],
    ['family', 'Gia đình'], ['happy', 'Vui vẻ'], ['weather', 'Thời tiết'], ['travel', 'Du lịch'],
    ['healthy', 'Khỏe mạnh'], ['future', 'Tương lai'], ['important', 'Quan trọng'], ['environment', 'Môi trường'],
  ];
  const [word, meaning] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = shuffle(bank.filter(x => x[1] !== meaning)).slice(0, 3).map(x => x[1]);
  const options = shuffle([meaning, ...wrongs]);
  return { content: `Từ "${word}" có nghĩa là gì?`, options, correct: options.indexOf(meaning) };
}

function mcqLit(grade: number, level: number, seedIdx: number) {
  const bank: [string, string][] = [
    ['Thể loại của truyện cổ tích thường mang yếu tố gì?', 'Kỳ ảo, hoang đường'],
    ['Biện pháp tu từ so sánh dùng để làm gì?', 'Làm nổi bật đặc điểm sự vật'],
    ['Ngôi kể thứ nhất được nhận biết qua đại từ nào?', 'Tôi / Chúng tôi'],
    ['Thể thơ lục bát có đặc điểm số câu chữ như thế nào?', 'Câu 6 chữ xen câu 8 chữ'],
    ['Văn bản nghị luận chủ yếu dùng để làm gì?', 'Trình bày quan điểm, lập luận'],
    ['Nhân vật phản diện trong truyện thường có vai trò gì?', 'Tạo xung đột với nhân vật chính'],
  ];
  const [content, correctAns] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ['Miêu tả cảnh thiên nhiên', 'Kể lại số liệu thống kê', 'Chỉ dùng trong văn bản hành chính'];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return { content, options, correct: options.indexOf(correctAns) };
}

function mcqScience(grade: number, level: number, seedIdx: number) {
  const bank: [string, string][] = [
    ['Nước sôi ở nhiệt độ bao nhiêu độ C (áp suất thường)?', '100°C'],
    ['Cơ quan nào của cơ thể có chức năng bơm máu?', 'Tim'],
    ['Quá trình cây xanh tạo ra oxy gọi là gì?', 'Quang hợp'],
    ['Đơn vị đo lực trong hệ SI là gì?', 'Newton (N)'],
    ['Chất nào cần thiết cho sự cháy?', 'Oxy'],
    ['Hiện tượng Trái Đất quay quanh Mặt Trời gọi là gì?', 'Chuyển động quỹ đạo'],
  ];
  const [content, correctAns] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ['Nitơ', '0°C', 'Hô hấp tế bào', 'Watt (W)'];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return { content, options, correct: options.indexOf(correctAns) };
}

function shortQ(subject: string, grade: number, level: number, seedIdx: number) {
  const bank: Record<string, [string, string][]> = {
    'Toán': [['Số nguyên tố nhỏ nhất là số nào?', '2'], ["1/2 viết dưới dạng số thập phân là?", '0.5'], ['Chu vi hình vuông cạnh 5cm là?', '20']],
    'Tiếng Anh': [["Số nhiều của 'child' là gì?", 'children'], ["Đối lập của 'big' là gì?", 'small'], ["Thì hiện tại đơn của 'go' ở ngôi thứ 3 số ít?", 'goes']],
    'Văn': [["Tác giả của 'Truyện Kiều' là ai?", 'Nguyễn Du'], ["'Lão Hạc' là tác phẩm của ai?", 'Nam Cao'], ["Thể loại của 'Tắt đèn' là gì?", 'Tiểu thuyết']],
    'KHTN': [['Ký hiệu hóa học của nước là gì?', 'H2O'], ['Đơn vị đo khối lượng cơ bản là gì?', 'kg'], ['Hành tinh gần Mặt Trời nhất là?', 'Sao Thủy']],
  };
  const arr = bank[subject] || bank['Toán'];
  const [content, sampleAnswer] = arr[(seedIdx + grade + level) % arr.length];
  return { content, sampleAnswer };
}

function essayQ(subject: string, seedIdx: number) {
  const bank: Record<string, [string, string[]][]> = {
    'Toán': [['Nêu ngắn gọn cách tính diện tích hình chữ nhật.', ['chiều dài', 'chiều rộng', 'nhân', 'diện tích']]],
    'Tiếng Anh': [['Viết 2-3 câu giới thiệu ngắn về bản thân bằng tiếng Anh.', ['name', 'age', 'school', 'like', 'from']]],
    'Văn': [['Nêu cảm nhận ngắn gọn về tình yêu quê hương trong văn học.', ['quê hương', 'tình yêu', 'kỷ niệm', 'gắn bó', 'tự hào']]],
    'KHTN': [['Trình bày ngắn gọn vai trò của nước đối với sự sống.', ['nước', 'sự sống', 'cơ thể', 'cần thiết', 'trao đổi chất']]],
  };
  const arr = bank[subject] || bank['Toán'];
  const [content, keywords] = arr[seedIdx % arr.length];
  return { content, keywords };
}

const LESSON_TITLES: Record<string, string[]> = {
  'Toán': ['Số tự nhiên & phép tính', 'Phân số cơ bản', 'Hình học phẳng', 'Tỉ lệ & phần trăm', 'Ôn tập tổng hợp'],
  'Tiếng Anh': ['Từ vựng chủ đề gia đình', 'Ngữ pháp thì hiện tại', 'Kỹ năng đọc hiểu', 'Giao tiếp cơ bản', 'Ôn tập từ vựng'],
  'Văn': ['Văn bản tự sự', 'Thơ lục bát', 'Văn nghị luận xã hội', 'Truyện ngắn hiện đại', 'Ôn tập tác phẩm'],
  'KHTN': ['Vật chất & năng lượng', 'Cơ thể người', 'Sinh vật & môi trường', 'Lực & chuyển động', 'Ôn tập KHTN'],
};

const GENS: Record<string, (g: number, l: number, s: number) => { content: string; options: string[]; correct: number }> = {
  'Toán': mcqMath, 'Tiếng Anh': mcqEnglish, 'Văn': mcqLit, 'KHTN': mcqScience,
};

async function main() {
  console.log('Seeding medals & levels...');
  const medalNames = ['Đồng', 'Bạc', 'Vàng', 'Kim cương'];
  const medalByName = new Map<string, number>();
  for (const name of medalNames) {
    const medal = await prisma.medal.upsert({ where: { name }, update: {}, create: { name } });
    medalByName.set(name, medal.id);
  }
  for (const lv of LEVELS) {
    await prisma.level.upsert({
      where: { id: lv.id },
      update: { name: lv.name, color: lv.color, grad: lv.grad, medalId: lv.medal ? medalByName.get(lv.medal) : null },
      create: { id: lv.id, name: lv.name, color: lv.color, grad: lv.grad, medalId: lv.medal ? medalByName.get(lv.medal) : null },
    });
  }

  console.log('Seeding users...');
  const passwordHashes = {
    admin: await bcrypt.hash('admin123', 10),
    teacher: await bcrypt.hash('gv123456', 10),
    student: await bcrypt.hash('hs123456', 10),
  };

  const admin = await prisma.user.upsert({
    where: { email: 'admin@antam.vn' },
    update: {},
    create: { name: 'Admin Hệ thống', email: 'admin@antam.vn', passwordHash: passwordHashes.admin, role: 'admin' },
  });
  const teacher1 = await prisma.user.upsert({
    where: { email: 'gv.lan@antam.vn' },
    update: {},
    create: { name: 'Nguyễn Thị Lan', email: 'gv.lan@antam.vn', passwordHash: passwordHashes.teacher, role: 'teacher' },
  });
  await prisma.user.upsert({
    where: { email: 'gv.minh@antam.vn' },
    update: {},
    create: { name: 'Trần Văn Minh', email: 'gv.minh@antam.vn', passwordHash: passwordHashes.teacher, role: 'teacher' },
  });

  const studentNames = ['Lê Gia Bảo', 'Phạm Thu Hà', 'Đỗ Minh Khang', 'Vũ Ngọc Anh', 'Hoàng Bảo Châu', 'Bùi Đức Huy', 'Ngô Thanh Trúc', 'Đinh Quốc Việt'];
  const students = [];
  for (let i = 0; i < studentNames.length; i++) {
    const student = await prisma.user.upsert({
      where: { email: `hs${i + 1}@antam.vn` },
      update: {},
      create: {
        name: studentNames[i],
        email: `hs${i + 1}@antam.vn`,
        passwordHash: passwordHashes.student,
        role: 'student',
        grade: GRADES[i % GRADES.length],
      },
    });
    students.push(student);
  }

  console.log('Seeding lessons & questions...');
  for (const subject of SUBJECTS) {
    for (const grade of GRADES) {
      const titles = LESSON_TITLES[subject] || [];
      for (let i = 0; i < titles.length; i++) {
        const order = i + 1;
        const lesson = await prisma.lesson.upsert({
          where: { subject_grade_order: { subject, grade, order } },
          update: {},
          create: {
            subject, grade, order,
            title: `Bài ${order}: ${titles[i]} (Khối ${grade})`,
            desc: `Tài liệu học tập môn ${subject} dành cho khối ${grade}.`,
            driveLink: 'https://drive.google.com/drive/folders/an-tam-demo',
          },
        });

        const existingQuestions = await prisma.question.count({ where: { lessonId: lesson.id } });
        if (existingQuestions > 0) continue; // already seeded

        const mk = GENS[subject] || mcqMath;
        const rows = [];
        for (const level of SUB_LEVELS) {
          const seedBase = order * 10;
          for (let i = 0; i < 6; i++) {
            const m = mk(grade, level, seedBase + i);
            rows.push({ id: `${lesson.id}_L${level}_mcq${i}`, subject, grade, lessonId: lesson.id, level, type: 'mcq' as const, content: m.content, options: m.options, correct: m.correct, keywords: [] });
          }
          for (let i = 0; i < 2; i++) {
            const s = shortQ(subject, grade, level, seedBase + i);
            rows.push({ id: `${lesson.id}_L${level}_short${i}`, subject, grade, lessonId: lesson.id, level, type: 'short' as const, content: s.content, options: [], sampleAnswer: s.sampleAnswer, keywords: [] });
          }
          for (let i = 0; i < 2; i++) {
            const e = essayQ(subject, seedBase + i);
            rows.push({ id: `${lesson.id}_L${level}_essay${i}`, subject, grade, lessonId: lesson.id, level, type: 'essay' as const, content: e.content, options: [], keywords: e.keywords });
          }
        }
        await prisma.question.createMany({ data: rows, skipDuplicates: true });
      }
    }
  }

  console.log('Seeding posts & documents...');
  const today = new Date();
  await prisma.post.createMany({
    data: [
      { authorId: admin.id, title: 'Chào mừng đến với AN TÂM', content: 'AN TÂM là nền tảng học tập và kiểm tra trực tuyến dành cho học sinh khối 6-9. Cùng học và làm bài kiểm tra lần lượt theo từng bài học để chinh phục toàn bộ chương trình!', status: 'approved', kind: 'official', createdAt: today },
      { authorId: teacher1.id, title: 'Bí quyết ôn tập môn Toán hiệu quả', content: 'Học sinh nên luyện tập đều đặn mỗi ngày 30 phút, ưu tiên nắm chắc lý thuyết trước khi làm bài tập nâng cao. Ôn theo từng chuyên đề nhỏ sẽ dễ nhớ hơn.', status: 'approved', kind: 'official', createdAt: today },
      { authorId: students[0].id, title: 'Chia sẻ cách học từ vựng tiếng Anh', content: 'Mình hay dùng flashcard và học 10 từ mới mỗi ngày, ôn lại vào cuối tuần. Cách này giúp mình nhớ lâu hơn rất nhiều!', status: 'approved', kind: 'community', createdAt: today },
      { authorId: students[0].id, title: 'Kinh nghiệm làm bài luận Văn', content: 'Trước khi viết, mình luôn lập dàn ý ngắn gọn để bài viết mạch lạc và không bị thiếu ý.', status: 'pending', kind: 'community', createdAt: today },
    ],
    skipDuplicates: true,
  });

  await prisma.document.createMany({
    data: [
      {
        teacherId: teacher1.id, subject: 'Toán', grade: 6, title: 'Tài liệu ôn tập Số tự nhiên - Khối 6',
        content: `Số tự nhiên là các số 0, 1, 2, 3, ... dùng để đếm và ghi số lượng đồ vật.
Phép cộng hai số tự nhiên luôn cho ra một số tự nhiên khác.
Phép trừ chỉ thực hiện được khi số bị trừ lớn hơn hoặc bằng số trừ.
Phép nhân là phép cộng lặp lại nhiều lần của cùng một số.
Phép chia hết là phép chia mà số dư bằng 0.
Số nguyên tố là số tự nhiên lớn hơn 1 chỉ chia hết cho 1 và chính nó, ví dụ 2, 3, 5, 7, 11.
Ước chung lớn nhất (ƯCLN) của hai số là số lớn nhất chia hết cả hai số đó.
Bội chung nhỏ nhất (BCNN) của hai số là số nhỏ nhất chia hết cho cả hai số đó.`,
      },
      {
        teacherId: teacher1.id, subject: 'KHTN', grade: 7, title: 'Tài liệu Cơ thể người - Khối 7',
        content: `Hệ tuần hoàn gồm tim và mạch máu, có nhiệm vụ vận chuyển máu đi khắp cơ thể.
Tim là cơ quan bơm máu, có 4 ngăn gồm 2 tâm nhĩ và 2 tâm thất.
Hệ hô hấp gồm mũi, khí quản, phổi, giúp trao đổi khí oxy và khí cacbonic.
Hệ tiêu hóa gồm miệng, thực quản, dạ dày, ruột non, ruột già, có nhiệm vụ tiêu hóa thức ăn.
Hệ thần kinh gồm não, tủy sống và các dây thần kinh, điều khiển mọi hoạt động của cơ thể.
Xương và cơ tạo nên hệ vận động, giúp cơ thể di chuyển và giữ tư thế.`,
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
