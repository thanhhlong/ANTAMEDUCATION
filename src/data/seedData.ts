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

// Timestamp prefix keeps IDs unique across page reloads now that accounts/scores persist in localStorage;
// the counter alone would restart at 1000 every reload and collide with previously saved records.
let __id = 1000;
export const nid = (p = "id") => `${p}_${Date.now().toString(36)}${(__id++).toString(36)}`;

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
  const opWord = op === "+" ? "cộng" : op === "-" ? "trừ" : "nhân";
  return {
    content: `Tính giá trị biểu thức: ${A} ${op} ${B} = ?`,
    options: options.map(String),
    correct: options.indexOf(correct),
    explanation: `Thực hiện phép ${opWord}: ${A} ${op} ${B} = ${correct}.`
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
    correct: options.indexOf(meaning),
    explanation: `"${word}" có nghĩa là "${meaning}".`
  };
}

function mcqLit(grade: number, level: number, seedIdx: number) {
  const bank: [string, string, string][] = [
    ["Thể loại của truyện cổ tích thường mang yếu tố gì?", "Kỳ ảo, hoang đường", "Truyện cổ tích thường có phép màu, thần tiên, yếu tố kỳ ảo để gửi gắm ước mơ của nhân dân."],
    ["Biện pháp tu từ so sánh dùng để làm gì?", "Làm nổi bật đặc điểm sự vật", "So sánh đối chiếu hai sự vật có nét tương đồng để làm nổi bật đặc điểm được miêu tả."],
    ["Ngôi kể thứ nhất được nhận biết qua đại từ nào?", "Tôi / Chúng tôi", "Ngôi kể thứ nhất xưng 'tôi' hoặc 'chúng tôi', người kể trực tiếp tham gia câu chuyện."],
    ["Thể thơ lục bát có đặc điểm số câu chữ như thế nào?", "Câu 6 chữ xen câu 8 chữ", "Lục bát gồm các cặp câu: một câu 6 chữ và một câu 8 chữ nối tiếp nhau."],
    ["Văn bản nghị luận chủ yếu dùng để làm gì?", "Trình bày quan điểm, lập luận", "Văn nghị luận dùng lý lẽ, dẫn chứng để thuyết phục người đọc về một quan điểm."],
    ["Nhân vật phản diện trong truyện thường có vai trò gì?", "Tạo xung đột với nhân vật chính", "Nhân vật phản diện tạo ra mâu thuẫn, thử thách để làm nổi bật nhân vật chính."],
  ];
  const [content, correctAns, explanation] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ["Miêu tả cảnh thiên nhiên", "Kể lại số liệu thống kê", "Chỉ dùng trong văn bản hành chính"];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return {
    content,
    options,
    correct: options.indexOf(correctAns),
    explanation
  };
}

function mcqScience(grade: number, level: number, seedIdx: number) {
  const bank: [string, string, string][] = [
    ["Nước sôi ở nhiệt độ bao nhiêu độ C (áp suất thường)?", "100°C", "Ở áp suất khí quyển tiêu chuẩn, nước sôi ở 100°C."],
    ["Cơ quan nào của cơ thể có chức năng bơm máu?", "Tim", "Tim co bóp liên tục để bơm máu đi khắp cơ thể."],
    ["Quá trình cây xanh tạo ra oxy gọi là gì?", "Quang hợp", "Quang hợp là quá trình cây xanh dùng ánh sáng để tạo chất hữu cơ và thải ra oxy."],
    ["Đơn vị đo lực trong hệ SI là gì?", "Newton (N)", "Đơn vị lực trong hệ SI là Newton, ký hiệu N."],
    ["Chất nào cần thiết cho sự cháy?", "Oxy", "Sự cháy cần có oxy để phản ứng cháy xảy ra."],
    ["Hiện tượng Trái Đất quay quanh Mặt Trời gọi là gì?", "Chuyển động quỹ đạo", "Trái Đất chuyển động theo quỹ đạo hình elip quanh Mặt Trời."],
  ];
  const [content, correctAns, explanation] = bank[(seedIdx + grade + level) % bank.length];
  const wrongs = ["Nitơ", "0°C", "Hô hấp tế bào", "Watt (W)"];
  const options = shuffle([correctAns, ...shuffle(wrongs).slice(0, 3)]);
  return {
    content,
    options,
    correct: options.indexOf(correctAns),
    explanation
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
    sampleAnswer: sample,
    explanation: `Đáp án đúng là "${sample}".`
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
    keywords,
    explanation: `Bài viết cần nêu được các ý: ${keywords.join(", ")}.`
  };
}

// ---------------------------------------------------------------------------
// TOÁN 6 — nội dung bài học & ngân hàng câu hỏi biên soạn riêng theo khung
// chương trình GDPT 2018 môn Toán lớp 6 (10 chương, phù hợp cả 3 bộ SGK hiện
// hành: Kết Nối Tri Thức, Chân Trời Sáng Tạo, Cánh Diều). Mỗi bài học có 3 cấp
// độ, mỗi cấp gồm 20 câu trắc nghiệm + 2 câu ngắn + 2 câu tự luận.
// ---------------------------------------------------------------------------

interface Toan6LessonSpec {
  title: string;
  desc: string;
  content: string;
}

const TOAN6_LESSONS: Toan6LessonSpec[] = [
  {
    title: "Tập hợp và số tự nhiên",
    desc: "Tập hợp, cách viết tập hợp, số tự nhiên, số liền trước/liền sau, số La Mã.",
    content: `Tập hợp là một khái niệm cơ bản của Toán học, dùng để chỉ một nhóm các đối tượng có chung tính chất, gọi là các phần tử của tập hợp.
Có hai cách viết một tập hợp: liệt kê các phần tử (ví dụ A = {1; 2; 3; 4}) hoặc chỉ ra tính chất đặc trưng cho các phần tử (ví dụ A = {x ∈ N | x < 5}).
Tập hợp các số tự nhiên được ký hiệu là N = {0; 1; 2; 3; ...}. Tập hợp các số tự nhiên khác 0 ký hiệu là N* = {1; 2; 3; ...}.
Mỗi số tự nhiên (khác 0) đều có một số liền trước và một số liền sau; hai số tự nhiên liên tiếp hơn kém nhau 1 đơn vị.
Trong hệ thập phân, giá trị của mỗi chữ số phụ thuộc vào vị trí của nó: hàng đơn vị, hàng chục, hàng trăm, hàng nghìn, ...
Để so sánh hai số tự nhiên, ta so sánh số chữ số trước (số nào có nhiều chữ số hơn thì lớn hơn); nếu số chữ số bằng nhau thì so sánh từng cặp chữ số cùng hàng từ trái sang phải.
Số La Mã thường gặp: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000. Ví dụ: IV = 4, IX = 9, XIV = 14, XL = 40.`
  },
  {
    title: "Phép tính với số tự nhiên và lũy thừa",
    desc: "Bốn phép tính, thứ tự thực hiện phép tính, lũy thừa với số mũ tự nhiên.",
    content: `Với các số tự nhiên, ta có bốn phép tính cơ bản: cộng, trừ, nhân, chia. Phép trừ a - b chỉ thực hiện được khi a ≥ b. Phép chia a : b (b ≠ 0) có thể là chia hết (số dư bằng 0) hoặc chia có dư (a = b.q + r, với 0 ≤ r < b).
Thứ tự thực hiện phép tính: trong biểu thức không có dấu ngoặc, thực hiện lũy thừa trước, rồi đến nhân và chia (từ trái sang phải), sau đó mới đến cộng và trừ (từ trái sang phải). Nếu có dấu ngoặc, thực hiện trong ngoặc tròn () trước, rồi đến ngoặc vuông [], rồi đến ngoặc nhọn {}.
Lũy thừa của một số tự nhiên: a^n (đọc là "a mũ n") là tích của n thừa số a (a^n = a × a × ... × a, n thừa số), với a gọi là cơ số, n gọi là số mũ.
Nhân hai lũy thừa cùng cơ số: a^m × a^n = a^(m+n). Chia hai lũy thừa cùng cơ số (a ≠ 0, m ≥ n): a^m : a^n = a^(m-n).
Quy ước: a^1 = a, a^0 = 1 (với a ≠ 0).`
  },
  {
    title: "Tính chia hết trong tập hợp số tự nhiên",
    desc: "Dấu hiệu chia hết, số nguyên tố, hợp số, ước chung lớn nhất, bội chung nhỏ nhất.",
    content: `Số tự nhiên a chia hết cho số tự nhiên b (b ≠ 0) nếu có số tự nhiên q sao cho a = b × q. Khi đó b là ước của a, còn a là bội của b.
Dấu hiệu chia hết cho 2: chữ số tận cùng là 0, 2, 4, 6, 8. Dấu hiệu chia hết cho 5: chữ số tận cùng là 0 hoặc 5.
Dấu hiệu chia hết cho 3: tổng các chữ số chia hết cho 3. Dấu hiệu chia hết cho 9: tổng các chữ số chia hết cho 9.
Số nguyên tố là số tự nhiên lớn hơn 1, chỉ có hai ước là 1 và chính nó (ví dụ: 2, 3, 5, 7, 11, 13, ...). Hợp số là số tự nhiên lớn hơn 1 có nhiều hơn hai ước.
Ước chung của hai hay nhiều số là ước chung của tất cả các số đó. Ước chung lớn nhất (ƯCLN) là số lớn nhất trong tập hợp các ước chung.
Bội chung của hai hay nhiều số là bội chung của tất cả các số đó. Bội chung nhỏ nhất (BCNN) là số nhỏ nhất khác 0 trong tập hợp các bội chung.`
  },
  {
    title: "Số nguyên",
    desc: "Số nguyên âm, số đối, giá trị tuyệt đối, so sánh và các phép tính với số nguyên.",
    content: `Số nguyên âm là các số ..., -3, -2, -1 được dùng để biểu diễn các đại lượng có hai hướng ngược nhau (ví dụ: độ cao dưới mực nước biển, nhiệt độ dưới 0°C, số tiền nợ).
Tập hợp số nguyên Z = {...; -3; -2; -1; 0; 1; 2; 3; ...} gồm các số nguyên âm, số 0 và các số nguyên dương (chính là các số tự nhiên khác 0).
Trên trục số, các số nguyên âm nằm bên trái điểm 0, các số nguyên dương nằm bên phải điểm 0. Số đối của số nguyên a là số nằm cách đều điểm 0 và ở phía đối diện, ký hiệu -a. Ví dụ số đối của 5 là -5, số đối của -3 là 3.
Giá trị tuyệt đối của số nguyên a (ký hiệu |a|) là khoảng cách từ điểm a đến điểm 0 trên trục số. |a| luôn không âm; |5| = 5 và |-5| = 5.
So sánh hai số nguyên: số nguyên dương luôn lớn hơn 0 và lớn hơn mọi số nguyên âm; trong hai số nguyên âm, số nào có giá trị tuyệt đối lớn hơn thì nhỏ hơn.
Quy tắc cộng hai số nguyên: cùng dấu thì cộng hai giá trị tuyệt đối rồi giữ nguyên dấu chung; khác dấu thì lấy giá trị tuyệt đối lớn trừ giá trị tuyệt đối nhỏ rồi lấy dấu của số có giá trị tuyệt đối lớn hơn.
Quy tắc trừ: a - b = a + (-b). Quy tắc nhân: cùng dấu cho kết quả dương, khác dấu cho kết quả âm; nhân hai giá trị tuyệt đối rồi đặt dấu tương ứng.`
  },
  {
    title: "Hình phẳng trong thực tiễn",
    desc: "Chu vi, diện tích hình vuông, hình chữ nhật, hình thoi, hình bình hành, hình thang cân, tam giác đều.",
    content: `Một số hình phẳng thường gặp trong thực tiễn: hình tam giác đều, hình vuông, hình lục giác đều, hình chữ nhật, hình thoi, hình bình hành, hình thang cân.
Hình vuông cạnh a: chu vi P = 4a, diện tích S = a².
Hình chữ nhật hai cạnh a, b: chu vi P = 2(a + b), diện tích S = a × b.
Hình thoi có hai đường chéo d1, d2: diện tích S = (d1 × d2) : 2. Chu vi hình thoi cạnh a: P = 4a.
Hình bình hành đáy a, chiều cao h: diện tích S = a × h.
Hình thang cân có hai đáy a, b và chiều cao h: diện tích S = (a + b) × h : 2.
Tam giác đều cạnh a: chu vi P = 3a.`
  },
  {
    title: "Tính đối xứng của hình phẳng",
    desc: "Trục đối xứng, tâm đối xứng và cách nhận biết ở các hình quen thuộc.",
    content: `Hình có trục đối xứng là hình mà khi gấp theo một đường thẳng (trục đối xứng), hai phần của hình trùng khít lên nhau.
Ví dụ hình có trục đối xứng: hình tròn (vô số trục), hình vuông (4 trục), hình chữ nhật (2 trục), tam giác đều (3 trục), hình thoi (2 trục), chữ cái A, H, M, O, T, U, V, W, X, Y.
Hình có tâm đối xứng là hình mà có một điểm (tâm đối xứng) sao cho khi quay hình đó 180° quanh điểm này, hình thu được trùng khít với hình ban đầu.
Ví dụ hình có tâm đối xứng: hình tròn, hình vuông, hình chữ nhật, hình bình hành, hình thoi, lục giác đều; chữ cái H, I, N, O, S, X, Z.
Một số hình vừa có trục đối xứng vừa có tâm đối xứng, ví dụ: hình vuông, hình chữ nhật, hình thoi, hình tròn, lục giác đều.
Tam giác đều có trục đối xứng nhưng KHÔNG có tâm đối xứng.`
  },
  {
    title: "Phân số",
    desc: "Khái niệm phân số, rút gọn, so sánh, quy đồng, cộng trừ nhân chia phân số.",
    content: `Phân số có dạng a/b (b ≠ 0), trong đó a là tử số, b là mẫu số. Phân số a/b biểu diễn thương của phép chia a cho b.
Hai phân số a/b và c/d (b, d ≠ 0) gọi là bằng nhau nếu a × d = b × c.
Rút gọn phân số: chia cả tử và mẫu cho ước chung của chúng (thường là ƯCLN) để được phân số tối giản.
Quy đồng mẫu số nhiều phân số: tìm một bội chung của các mẫu số (thường là BCNN) rồi nhân cả tử và mẫu của mỗi phân số với thừa số phụ tương ứng.
So sánh hai phân số: quy đồng mẫu số dương rồi so sánh tử số; tử số nào lớn hơn thì phân số đó lớn hơn.
Cộng, trừ hai phân số cùng mẫu: giữ nguyên mẫu, cộng (trừ) các tử số. Muốn cộng, trừ hai phân số khác mẫu, ta quy đồng mẫu rồi cộng, trừ tử số.
Nhân hai phân số: nhân tử với tử, mẫu với mẫu (a/b × c/d = (a×c)/(b×d)). Chia phân số a/b cho phân số c/d (c ≠ 0): a/b : c/d = a/b × d/c.`
  },
  {
    title: "Số thập phân",
    desc: "Đọc viết, so sánh, các phép tính, làm tròn số thập phân và tỉ số phần trăm.",
    content: `Số thập phân gồm phần nguyên và phần thập phân, cách nhau bởi dấu phẩy. Ví dụ 3,25 có phần nguyên là 3 và phần thập phân là 25 (đọc là "ba phẩy hai mươi lăm").
Mỗi số thập phân đều viết được dưới dạng phân số thập phân (mẫu số là 10, 100, 1000, ...) và ngược lại.
So sánh hai số thập phân: so sánh phần nguyên trước; nếu phần nguyên bằng nhau thì so sánh lần lượt từng hàng ở phần thập phân từ trái sang phải.
Cộng, trừ số thập phân: đặt tính sao cho các chữ số cùng hàng thẳng cột, dấu phẩy thẳng dấu phẩy, rồi cộng (trừ) như với số tự nhiên.
Nhân số thập phân: nhân như số tự nhiên (bỏ qua dấu phẩy) rồi đếm tổng số chữ số ở phần thập phân của hai thừa số để đặt dấu phẩy vào kết quả.
Làm tròn số thập phân: nhìn vào chữ số ngay sau hàng cần làm tròn; nếu chữ số đó ≥ 5 thì làm tròn lên, nếu < 5 thì giữ nguyên (bỏ các chữ số phía sau).
Tỉ số phần trăm của a và b (b ≠ 0) là (a : b) × 100%.`
  },
  {
    title: "Hình học trực quan: Hình khối trong thực tiễn",
    desc: "Hình hộp chữ nhật, hình lập phương, hình lăng trụ đứng: diện tích và thể tích.",
    content: `Hình hộp chữ nhật có 6 mặt là hình chữ nhật, 8 đỉnh, 12 cạnh. Với ba kích thước chiều dài a, chiều rộng b, chiều cao c: diện tích xung quanh Sxq = 2(a + b) × c; diện tích toàn phần Stp = Sxq + 2ab; thể tích V = a × b × c.
Hình lập phương cạnh a (trường hợp đặc biệt của hình hộp chữ nhật khi a = b = c): diện tích xung quanh Sxq = 4a², diện tích toàn phần Stp = 6a², thể tích V = a³.
Hình lăng trụ đứng tam giác/tứ giác có chiều cao h và đáy là đa giác có chu vi C, diện tích đáy Sđáy: diện tích xung quanh Sxq = C × h; thể tích V = Sđáy × h.`
  },
  {
    title: "Một số yếu tố thống kê và xác suất",
    desc: "Thu thập, biểu diễn số liệu và xác suất thực nghiệm của một sự kiện.",
    content: `Thống kê là quá trình thu thập, phân loại, biểu diễn và phân tích số liệu để rút ra thông tin cần thiết.
Số liệu thống kê thường được trình bày bằng bảng số liệu hoặc biểu đồ (biểu đồ tranh, biểu đồ cột, biểu đồ đoạn thẳng).
Xác suất thực nghiệm của một sự kiện trong một số phép thử là tỉ số giữa số lần sự kiện đó xảy ra và tổng số lần thực hiện phép thử: xác suất thực nghiệm = (số lần xuất hiện của sự kiện) : (tổng số lần thử).
Ví dụ: gieo một con xúc xắc 50 lần thấy mặt 6 chấm xuất hiện 9 lần, thì xác suất thực nghiệm xuất hiện mặt 6 chấm là 9/50 = 0,18.`
  }
];

function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  return b === 0 ? a : gcd(b, a % b);
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

function reduceFrac(num: number, den: number): [number, number] {
  const g = gcd(num, den) || 1;
  return [num / g, den / g];
}

// Generic numeric-answer MCQ builder: keeps the correct VALUE deterministic
// (function of level/seedIdx only) while distractors may use Math.random() —
// safe because review pages re-derive "đáp án đúng" from this same correct
// value, not from the shuffled option order.
function numericMcq(correct: number, spread: number, min = -Infinity, max = Infinity) {
  const distract = new Set<number>([correct]);
  let guard = 0;
  while (distract.size < 4 && guard < 80) {
    guard++;
    let cand = correct + (Math.floor(Math.random() * (Math.max(1, Math.round(spread)) * 2 + 1)) - Math.max(1, Math.round(spread)));
    cand = Math.max(min, Math.min(max, cand));
    if (cand !== correct) distract.add(cand);
  }
  while (distract.size < 4) distract.add(correct + distract.size * 13 + 3);
  const options = shuffle([...distract]).slice(0, 4);
  if (!options.includes(correct)) options[0] = correct;
  return { options: options.map(String), correct: options.indexOf(correct) };
}

function pickMaxMcq(nums: number[]) {
  const correct = Math.max(...nums);
  const options = shuffle([...nums]);
  return { options: options.map(String), correct: options.indexOf(correct) };
}

// Generic text-answer MCQ builder with guaranteed-unique options.
function textOptions(correct: string, wrongs: string[]) {
  const set = new Set<string>([correct]);
  for (const w of wrongs) {
    if (set.size >= 4) break;
    if (w !== correct) set.add(w);
  }
  let guard = 0;
  while (set.size < 4 && guard < 20) {
    guard++;
    set.add(`${correct} (${guard})`);
  }
  const options = shuffle([...set]);
  return { options, correct: options.indexOf(correct) };
}

const ROMANS: [string, number][] = [
  ["IV", 4], ["IX", 9], ["XIV", 14], ["XL", 40], ["XIX", 19],
  ["XXIV", 24], ["XLV", 45], ["LIX", 59], ["XC", 90], ["XLIV", 44]
];

function mcqToan6_setsNat(level: number, i: number) {
  const t = i % 6;
  if (t === 0) {
    const a = 1 + i + level * 3;
    const b = a + 5 + level * 2 + (i % 5);
    const correct = b - a + 1;
    const { options, correct: idx } = numericMcq(correct, 3, 1);
    return {
      content: `Cho tập hợp A = {x ∈ N | ${a} ≤ x ≤ ${b}}. Tập hợp A có bao nhiêu phần tử?`,
      options, correct: idx,
      explanation: `Số phần tử của A là ${b} - ${a} + 1 = ${correct}.`
    };
  }
  if (t === 1) {
    const n = 100 * level + i * 7 + 12;
    const correct = n + 1;
    const { options, correct: idx } = numericMcq(correct, 4, 1);
    return {
      content: `Số tự nhiên liền sau của số ${n} là số nào?`,
      options, correct: idx,
      explanation: `Số liền sau của ${n} là ${n} + 1 = ${correct}.`
    };
  }
  if (t === 2) {
    const n = 100 * level + i * 7 + 25;
    const correct = n - 1;
    const { options, correct: idx } = numericMcq(correct, 4, 1);
    return {
      content: `Số tự nhiên liền trước của số ${n} là số nào?`,
      options, correct: idx,
      explanation: `Số liền trước của ${n} là ${n} - 1 = ${correct}.`
    };
  }
  if (t === 3) {
    const [numeral, value] = ROMANS[i % ROMANS.length];
    const { options, correct: idx } = numericMcq(value, 6, 1, 200);
    return {
      content: `Số La Mã ${numeral} có giá trị bằng số tự nhiên nào?`,
      options, correct: idx,
      explanation: `Số La Mã ${numeral} có giá trị là ${value}.`
    };
  }
  if (t === 4) {
    const base = 10000 + level * 1000 + i * 37;
    const digits = String(base).split("").map(Number);
    const correct = digits[digits.length - 2];
    const { options, correct: idx } = numericMcq(correct, 4, 0, 9);
    return {
      content: `Trong số ${base}, chữ số hàng chục là chữ số nào?`,
      options, correct: idx,
      explanation: `Số ${base} có chữ số hàng chục là ${correct}.`
    };
  }
  const nums = [3, 4, 2, 1].map((k, idx2) => 50 * level + i * 5 + k * 11 + idx2);
  const { options, correct: idx } = pickMaxMcq(nums);
  return {
    content: `Trong các số sau, số nào lớn nhất: ${nums.join(", ")}?`,
    options, correct: idx,
    explanation: `Số lớn nhất trong các số đã cho là ${Math.max(...nums)}.`
  };
}

function mcqToan6_ops(level: number, i: number) {
  const t = i % 6;
  const scale = level * 4;
  if (t === 0) {
    const a = 3 + i + scale, b = 2 + (i % 5), c = 3 + (i % 4) + level;
    const correct = a + b * c;
    const { options, correct: idx } = numericMcq(correct, 6);
    return {
      content: `Tính giá trị biểu thức: ${a} + ${b} × ${c} = ?`,
      options, correct: idx,
      explanation: `Thực hiện nhân trước: ${b} × ${c} = ${b * c}, sau đó cộng: ${a} + ${b * c} = ${correct}.`
    };
  }
  if (t === 1) {
    const a = 2 + i + scale, b = 3 + (i % 4), c = 2 + (i % 3) + level;
    const correct = (a + b) * c;
    const { options, correct: idx } = numericMcq(correct, 8);
    return {
      content: `Tính giá trị biểu thức: (${a} + ${b}) × ${c} = ?`,
      options, correct: idx,
      explanation: `Thực hiện trong ngoặc trước: ${a} + ${b} = ${a + b}, sau đó nhân: ${a + b} × ${c} = ${correct}.`
    };
  }
  if (t === 2) {
    const a = 2 + (i % 5);
    const nn = Math.min(2 + (level >= 2 ? 1 : 0) + (i % 2 === 0 ? 0 : 1), 4);
    let correct = 1;
    for (let k = 0; k < nn; k++) correct *= a;
    const { options, correct: idx } = numericMcq(correct, Math.max(4, Math.floor(correct * 0.3)), 1);
    return {
      content: `Tính giá trị của ${a}^${nn} (${a} mũ ${nn})?`,
      options, correct: idx,
      explanation: `${a}^${nn} là tích của ${nn} thừa số ${a}: ${Array(nn).fill(a).join(" × ")} = ${correct}.`
    };
  }
  if (t === 3) {
    const m = 2 + (i % 4) + level, n = 2 + (i % 3);
    const correct = m + n;
    const { options, correct: idx } = numericMcq(correct, 3, 1, 20);
    return {
      content: `Rút gọn biểu thức a^${m} × a^${n} (a ≠ 0) về dạng a mũ bao nhiêu?`,
      options, correct: idx,
      explanation: `Nhân hai lũy thừa cùng cơ số, ta giữ nguyên cơ số và cộng số mũ: ${m} + ${n} = ${correct}.`
    };
  }
  if (t === 4) {
    const smaller = 3 + (i % 4) + level, m = 2 + (i % 2);
    const bigger = smaller + m;
    const correct = m;
    const { options, correct: idx } = numericMcq(correct, 3, 1, 20);
    return {
      content: `Rút gọn biểu thức a^${bigger} : a^${smaller} (a ≠ 0) về dạng a mũ bao nhiêu?`,
      options, correct: idx,
      explanation: `Chia hai lũy thừa cùng cơ số, ta giữ nguyên cơ số và trừ số mũ: ${bigger} - ${smaller} = ${correct}.`
    };
  }
  const b = 4 + (i % 6) + level;
  const q = 3 + (i % 5) + level;
  const r = i % b;
  const a = b * q + r;
  const correct = r;
  const { options, correct: idx } = numericMcq(correct, 3, 0, b - 1);
  return {
    content: `Chia ${a} cho ${b} được thương là ${q}. Vậy số dư của phép chia này là bao nhiêu?`,
    options, correct: idx,
    explanation: `Ta có ${a} = ${b} × ${q} + ${r}, vậy số dư là ${r}.`
  };
}

function mcqToan6_divisibility(level: number, i: number) {
  const t = i % 6;
  if (t === 0) {
    const base = 20 + level * 10 + i * 3;
    const evenNum = base % 2 === 0 ? base : base + 1;
    const nums = [evenNum, evenNum + 1, evenNum + 3, evenNum + 5];
    const shuffled = shuffle(nums);
    return {
      content: `Trong các số sau, số nào chia hết cho 2: ${shuffled.join(", ")}?`,
      options: shuffled.map(String),
      correct: shuffled.indexOf(evenNum),
      explanation: `Số ${evenNum} có chữ số tận cùng là số chẵn nên chia hết cho 2.`
    };
  }
  if (t === 1) {
    const base = 30 + level * 10 + i * 4;
    const mult5 = base - (base % 5);
    const nums = [mult5, mult5 + 1, mult5 + 2, mult5 + 3];
    const shuffled = shuffle(nums);
    return {
      content: `Trong các số sau, số nào chia hết cho 5: ${shuffled.join(", ")}?`,
      options: shuffled.map(String),
      correct: shuffled.indexOf(mult5),
      explanation: `Số ${mult5} có chữ số tận cùng là 0 hoặc 5 nên chia hết cho 5.`
    };
  }
  if (t === 2) {
    let n0 = 100 + level * 20 + i * 7;
    while (n0 % 3 !== 0) n0++;
    const nums = [n0, n0 + 1, n0 + 2, n0 + 4];
    const shuffled = shuffle(nums);
    const digitSum = String(n0).split("").reduce((s, d) => s + Number(d), 0);
    return {
      content: `Trong các số sau, số nào chia hết cho 3: ${shuffled.join(", ")}?`,
      options: shuffled.map(String),
      correct: shuffled.indexOf(n0),
      explanation: `Tổng các chữ số của ${n0} là ${digitSum}, chia hết cho 3 nên ${n0} chia hết cho 3.`
    };
  }
  if (t === 3) {
    const primesList = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
    const p = primesList[(i + level) % primesList.length];
    const candidates = [p * 2, p * 2 + 2, p * 3, p * 3 + 2, p * 4, p * 5];
    const distractSet = new Set<number>();
    for (const c of candidates) {
      if (c !== p) distractSet.add(c);
      if (distractSet.size === 3) break;
    }
    const nums = shuffle([p, ...Array.from(distractSet)]);
    return {
      content: `Trong các số sau, số nào là số nguyên tố: ${nums.join(", ")}?`,
      options: nums.map(String),
      correct: nums.indexOf(p),
      explanation: `${p} là số nguyên tố vì chỉ có hai ước là 1 và ${p}; các số còn lại đều là hợp số.`
    };
  }
  if (t === 4) {
    const a = 12 + i * 2 + level * 4, b = 18 + i * 3 + level * 6;
    const correct = gcd(a, b);
    const { options, correct: idx } = numericMcq(correct, Math.max(3, Math.floor(correct * 0.5)), 1);
    return {
      content: `Ước chung lớn nhất (ƯCLN) của ${a} và ${b} là bao nhiêu?`,
      options, correct: idx,
      explanation: `ƯCLN(${a}, ${b}) = ${correct}.`
    };
  }
  const a = 4 + (i % 6) + level, b = 6 + (i % 5) + level;
  const g = gcd(a, b);
  const correct = (a * b) / g;
  const { options, correct: idx } = numericMcq(correct, Math.max(4, Math.floor(correct * 0.3)), 1);
  return {
    content: `Bội chung nhỏ nhất (BCNN) của ${a} và ${b} là bao nhiêu?`,
    options, correct: idx,
    explanation: `BCNN(${a}, ${b}) = (${a} × ${b}) : ƯCLN(${a}, ${b}) = (${a} × ${b}) : ${g} = ${correct}.`
  };
}

function mcqToan6_integers(level: number, i: number) {
  const t = i % 6;
  const mag = 5 + level * 4 + i;
  if (t === 0) {
    const a = (i % 2 === 0 ? 1 : -1) * mag;
    const correct = -a;
    const { options, correct: idx } = numericMcq(correct, 5);
    return {
      content: `Số đối của số ${a} là số nào?`,
      options, correct: idx,
      explanation: `Số đối của ${a} là ${correct} (hai số đối nhau nằm cách đều điểm 0 trên trục số).`
    };
  }
  if (t === 1) {
    const a = (i % 2 === 0 ? -1 : 1) * mag;
    const correct = Math.abs(a);
    const { options, correct: idx } = numericMcq(correct, 5, 0);
    return {
      content: `Giá trị tuyệt đối của số ${a} (|${a}|) bằng bao nhiêu?`,
      options, correct: idx,
      explanation: `|${a}| = ${correct} vì giá trị tuyệt đối luôn không âm, bằng khoảng cách từ ${a} đến 0.`
    };
  }
  if (t === 2) {
    const a = -mag - (i % 3), b = mag - (i % 4);
    const correct = Math.max(a, b);
    const other = correct === a ? b : a;
    const options = shuffle([a, b, correct + 3, correct - 7].filter((v, idx3, arr) => arr.indexOf(v) === idx3));
    while (options.length < 4) options.push(correct + options.length * 5 + 2);
    return {
      content: `Trong hai số ${a} và ${b}, số nào lớn hơn?`,
      options: options.slice(0, 4).map(String),
      correct: options.slice(0, 4).indexOf(correct),
      explanation: `So sánh trên trục số: ${correct} lớn hơn ${other}.`
    };
  }
  if (t === 3) {
    const a = (i % 2 === 0 ? 1 : -1) * (5 + i + level * 3);
    const b = (i % 3 === 0 ? -1 : 1) * (3 + i + level * 2);
    const correct = a + b;
    const { options, correct: idx } = numericMcq(correct, 6);
    return {
      content: `Tính: (${a}) + (${b}) = ?`,
      options, correct: idx,
      explanation: `(${a}) + (${b}) = ${correct}.`
    };
  }
  if (t === 4) {
    const a = (i % 2 === 0 ? 1 : -1) * (4 + i + level * 3);
    const b = (i % 3 === 0 ? -1 : 1) * (2 + i + level * 2);
    const correct = a - b;
    const { options, correct: idx } = numericMcq(correct, 6);
    return {
      content: `Tính: (${a}) - (${b}) = ?`,
      options, correct: idx,
      explanation: `(${a}) - (${b}) = (${a}) + (${-b}) = ${correct}.`
    };
  }
  const a = (i % 2 === 0 ? 1 : -1) * (2 + (i % 5) + level);
  const b = (i % 3 === 0 ? -1 : 1) * (2 + (i % 4) + level);
  const correct = a * b;
  const { options, correct: idx } = numericMcq(correct, Math.max(6, Math.floor(Math.abs(correct) * 0.3)));
  return {
    content: `Tính: (${a}) × (${b}) = ?`,
    options, correct: idx,
    explanation: `(${a}) × (${b}) = ${correct} (${(a < 0) === (b < 0) ? "cùng dấu nên tích dương" : "khác dấu nên tích âm"}).`
  };
}

function mcqToan6_planeShapes(level: number, i: number) {
  const t = i % 8;
  const base = 4 + level * 2 + (i % 6);
  if (t === 0) {
    const a = base;
    const correct = 4 * a;
    const { options, correct: idx } = numericMcq(correct, 6, 1);
    return { content: `Một hình vuông có cạnh ${a} cm. Chu vi hình vuông đó là bao nhiêu cm?`, options, correct: idx, explanation: `Chu vi hình vuông = 4 × cạnh = 4 × ${a} = ${correct} (cm).` };
  }
  if (t === 1) {
    const a = base;
    const correct = a * a;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình vuông có cạnh ${a} cm. Diện tích hình vuông đó là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích hình vuông = cạnh × cạnh = ${a} × ${a} = ${correct} (cm²).` };
  }
  if (t === 2) {
    const a = base + 2, b = base;
    const correct = 2 * (a + b);
    const { options, correct: idx } = numericMcq(correct, 6, 1);
    return { content: `Một hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Chu vi hình chữ nhật là bao nhiêu cm?`, options, correct: idx, explanation: `Chu vi hình chữ nhật = 2 × (dài + rộng) = 2 × (${a} + ${b}) = ${correct} (cm).` };
  }
  if (t === 3) {
    const a = base + 3, b = base;
    const correct = a * b;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm. Diện tích hình chữ nhật là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích hình chữ nhật = dài × rộng = ${a} × ${b} = ${correct} (cm²).` };
  }
  if (t === 4) {
    const d1 = 2 * (base + 2), d2 = 2 * (base + 1);
    const correct = (d1 * d2) / 2;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình thoi có hai đường chéo lần lượt là ${d1} cm và ${d2} cm. Diện tích hình thoi là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích hình thoi = (đường chéo 1 × đường chéo 2) : 2 = (${d1} × ${d2}) : 2 = ${correct} (cm²).` };
  }
  if (t === 5) {
    const a = base + 4, h = base;
    const correct = a * h;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình bình hành có độ dài đáy ${a} cm, chiều cao ${h} cm. Diện tích hình bình hành là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích hình bình hành = đáy × chiều cao = ${a} × ${h} = ${correct} (cm²).` };
  }
  if (t === 6) {
    const a = base + 2, b = base + 6, h = 2 * (base % 3 + 1);
    const correct = ((a + b) * h) / 2;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình thang cân có hai đáy ${a} cm và ${b} cm, chiều cao ${h} cm. Diện tích hình thang là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích hình thang = (đáy lớn + đáy nhỏ) × chiều cao : 2 = (${a} + ${b}) × ${h} : 2 = ${correct} (cm²).` };
  }
  const a = base + 1;
  const correct = 3 * a;
  const { options, correct: idx } = numericMcq(correct, 6, 1);
  return { content: `Một tam giác đều có cạnh ${a} cm. Chu vi tam giác đều đó là bao nhiêu cm?`, options, correct: idx, explanation: `Chu vi tam giác đều = 3 × cạnh = 3 × ${a} = ${correct} (cm).` };
}

const SYMMETRY_BANK: [string, string, string][] = [
  ["Hình nào sau đây có trục đối xứng?", "Hình vuông", "Hình vuông có 4 trục đối xứng (2 đường chéo và 2 đường trung trực của các cạnh)."],
  ["Hình nào sau đây có tâm đối xứng?", "Hình bình hành", "Hình bình hành có tâm đối xứng là giao điểm hai đường chéo."],
  ["Tam giác đều có bao nhiêu trục đối xứng?", "3 trục", "Tam giác đều có 3 trục đối xứng đi qua mỗi đỉnh và trung điểm cạnh đối diện."],
  ["Hình tròn có bao nhiêu trục đối xứng?", "Vô số trục", "Mọi đường thẳng đi qua tâm hình tròn đều là trục đối xứng của nó."],
  ["Hình nào sau đây KHÔNG có tâm đối xứng?", "Tam giác đều", "Tam giác đều có trục đối xứng nhưng không có tâm đối xứng."],
  ["Chữ cái nào sau đây có trục đối xứng?", "Chữ M", "Chữ M có một trục đối xứng dọc ở giữa."],
  ["Chữ cái nào sau đây có tâm đối xứng?", "Chữ S", "Chữ S khi quay 180° quanh tâm sẽ trùng khít với chính nó."],
  ["Hình chữ nhật (không phải hình vuông) có bao nhiêu trục đối xứng?", "2 trục", "Hình chữ nhật có 2 trục đối xứng là hai đường trung trực của các cạnh."],
  ["Hình thoi có tâm đối xứng không?", "Có, tại giao điểm hai đường chéo", "Hình thoi có tâm đối xứng là giao điểm của hai đường chéo."],
  ["Lục giác đều có bao nhiêu trục đối xứng?", "6 trục", "Lục giác đều có 6 trục đối xứng."],
  ["Hình nào sau đây vừa có trục đối xứng vừa có tâm đối xứng?", "Hình vuông", "Hình vuông có cả 4 trục đối xứng và 1 tâm đối xứng."],
  ["Khi gấp một hình theo trục đối xứng, điều gì xảy ra?", "Hai phần của hình trùng khít lên nhau", "Đó chính là định nghĩa của trục đối xứng."]
];

function mcqToan6_symmetry(level: number, i: number) {
  const [content, correctAns, explanation] = SYMMETRY_BANK[(i + level) % SYMMETRY_BANK.length];
  const wrongPool = ["Hình thang thường", "Tam giác vuông (không cân)", "Chữ cái C", "5 trục", "Không có", "Hình bình hành", "1 trục", "4 trục"];
  const wrongs = shuffle(wrongPool.filter(w => w !== correctAns)).slice(0, 3);
  const { options, correct: idx } = textOptions(correctAns, wrongs);
  return { content, options, correct: idx, explanation };
}

function mcqToan6_fractions(level: number, i: number) {
  const t = i % 6;
  if (t === 0) {
    const k = 2 + (i % 4) + level;
    const rn = 3 + (i % 5), rd = 4 + (i % 5) + level;
    const num = rn * k, den = rd * k;
    const [sn, sd] = reduceFrac(num, den);
    const correctStr = `${sn}/${sd}`;
    const { options, correct: idx } = textOptions(correctStr, [`${sn + 1}/${sd}`, `${sn}/${sd + 1}`, `${num}/${den - 1 === 0 ? den : den - 1}`]);
    return {
      content: `Rút gọn phân số ${num}/${den} về dạng tối giản.`,
      options, correct: idx,
      explanation: `Chia cả tử và mẫu cho ƯCLN(${num}, ${den}) = ${gcd(num, den)}, ta được phân số tối giản ${correctStr}.`
    };
  }
  if (t === 1) {
    const c = 8 + level + (i % 4);
    const a = 1 + (i % (c - 2));
    const bb = Math.min(a + 1 + (i % 2), c - 1);
    const aFrac = `${a}/${c}`, bFrac = `${bb}/${c}`;
    const correctStr = a > bb ? aFrac : bFrac;
    const distractC = c + 2;
    const { options, correct: idx } = textOptions(correctStr, [correctStr === aFrac ? bFrac : aFrac, `${a}/${distractC}`, `${bb}/${distractC}`]);
    return {
      content: `So sánh hai phân số ${aFrac} và ${bFrac}, phân số nào lớn hơn?`,
      options, correct: idx,
      explanation: `Hai phân số cùng mẫu, phân số nào có tử lớn hơn thì lớn hơn. Vì ${Math.max(a, bb)} > ${Math.min(a, bb)} nên ${correctStr} lớn hơn.`
    };
  }
  if (t === 2) {
    const den = 6 + (i % 5) + level;
    const n1 = 1 + (i % (den - 2)), n2 = 1 + ((i + 2) % (den - 2));
    const sumNum = n1 + n2;
    const [sn, sd] = reduceFrac(sumNum, den);
    const correctStr = `${sn}/${sd}`;
    const { options, correct: idx } = textOptions(correctStr, [`${sumNum}/${den + 1}`, `${sn + 1}/${sd}`, `${Math.max(0, sumNum - 1)}/${den}`]);
    return {
      content: `Tính: ${n1}/${den} + ${n2}/${den} = ?`,
      options, correct: idx,
      explanation: `Cộng hai phân số cùng mẫu: giữ nguyên mẫu, cộng hai tử số: (${n1} + ${n2})/${den} = ${sumNum}/${den} = ${correctStr}.`
    };
  }
  if (t === 3) {
    const a = 1 + (i % 4), b = 2 + (i % 3) + level, c = 1 + ((i + 1) % 4), d = 2 + ((i + 1) % 3) + level;
    const num = a * c, den = b * d;
    const [sn, sd] = reduceFrac(num, den);
    const correctStr = `${sn}/${sd}`;
    const { options, correct: idx } = textOptions(correctStr, [`${num}/${den}`, `${sn}/${sd + 1}`, `${a + c}/${b + d}`]);
    return {
      content: `Tính: ${a}/${b} × ${c}/${d} = ?`,
      options, correct: idx,
      explanation: `Nhân hai phân số: nhân tử với tử, mẫu với mẫu: (${a}×${c})/(${b}×${d}) = ${num}/${den} = ${correctStr}.`
    };
  }
  if (t === 4) {
    const b = 3 + (i % 5) + level, a = 1 + (i % (b - 1));
    const k = 2 + (i % 3);
    const correctStr = `${a * k}/${b * k}`;
    const { options, correct: idx } = textOptions(correctStr, [`${a * k + 1}/${b * k}`, `${a * k}/${b * k + 1}`, `${a + k}/${b + k}`]);
    return {
      content: `Phân số nào sau đây bằng phân số ${a}/${b}?`,
      options, correct: idx,
      explanation: `Nhân cả tử và mẫu của ${a}/${b} với ${k} ta được phân số bằng nó: ${a * k}/${b * k}.`
    };
  }
  const m = 4 + (i % 4) + level, n = 6 + (i % 3) + level;
  const correct = (m * n) / gcd(m, n);
  const { options, correct: idx } = numericMcq(correct, Math.max(4, Math.floor(correct * 0.3)), 1);
  return {
    content: `Khi quy đồng mẫu số hai phân số có mẫu số lần lượt là ${m} và ${n}, mẫu số chung nhỏ nhất là bao nhiêu?`,
    options, correct: idx,
    explanation: `Mẫu số chung nhỏ nhất chính là BCNN(${m}, ${n}) = ${correct}.`
  };
}

function mcqToan6_decimals(level: number, i: number) {
  const t = i % 7;
  const fmt10 = (v: number) => `${Math.floor(v / 10)},${Math.abs(v % 10)}`;
  if (t === 0) {
    const intPart = 10 + level * 5 + i;
    const dec = 100 + ((i * 7) % 900);
    const decStr = String(dec).padStart(3, "0");
    const numStr = `${intPart},${decStr}`;
    const correct = Number(decStr[1]);
    const { options, correct: idx } = numericMcq(correct, 3, 0, 9);
    return {
      content: `Trong số thập phân ${numStr}, chữ số ở hàng phần trăm là chữ số nào?`,
      options, correct: idx,
      explanation: `Số ${numStr} có phần thập phân là ${decStr}; chữ số hàng phần trăm (vị trí thứ hai sau dấu phẩy) là ${correct}.`
    };
  }
  if (t === 1) {
    const whole = 5 + level * 2 + (i % 6);
    const d2 = (i + 3) % 10;
    const dd1 = i % 10 === d2 ? (i + 1) % 10 : i % 10;
    const aStr = `${whole},${d2}`, bStr = `${whole},${dd1}`;
    const correctStr = d2 > dd1 ? aStr : bStr;
    const wrong1 = d2 > dd1 ? bStr : aStr;
    const { options, correct: idx } = textOptions(correctStr, [wrong1, `${whole + 1},${d2}`, `${whole - 1},${dd1}`]);
    return {
      content: `So sánh hai số thập phân ${aStr} và ${bStr}, số nào lớn hơn?`,
      options, correct: idx,
      explanation: `Phần nguyên bằng nhau (${whole}), so sánh phần thập phân: ${Math.max(d2, dd1)} > ${Math.min(d2, dd1)} nên ${correctStr} lớn hơn.`
    };
  }
  if (t === 2) {
    const a10 = 30 + level * 10 + i * 3;
    const b10 = 15 + level * 7 + i * 2;
    const sum10 = a10 + b10;
    const correctStr = fmt10(sum10);
    const { options, correct: idx } = textOptions(correctStr, [fmt10(sum10 + 1), fmt10(sum10 - 1), fmt10(sum10 + 10)]);
    return {
      content: `Tính: ${fmt10(a10)} + ${fmt10(b10)} = ?`,
      options, correct: idx,
      explanation: `${fmt10(a10)} + ${fmt10(b10)} = ${correctStr}.`
    };
  }
  if (t === 3) {
    const a10 = 60 + level * 10 + i * 3;
    const b10 = 20 + level * 6 + i * 2;
    const hi10 = Math.max(a10, b10), lo10 = Math.min(a10, b10);
    const diff = hi10 - lo10;
    const correctStr = fmt10(diff);
    const { options, correct: idx } = textOptions(correctStr, [fmt10(diff + 1), fmt10(diff - 1), fmt10(diff + 10)]);
    return {
      content: `Tính: ${fmt10(hi10)} - ${fmt10(lo10)} = ?`,
      options, correct: idx,
      explanation: `${fmt10(hi10)} - ${fmt10(lo10)} = ${correctStr}.`
    };
  }
  if (t === 4) {
    const a10 = 12 + level * 3 + (i % 8);
    const n = 2 + (i % 4) + level;
    const product10 = a10 * n;
    const correctStr = fmt10(product10);
    const { options, correct: idx } = textOptions(correctStr, [fmt10(product10 + 1), fmt10(product10 - 1), fmt10(product10 + 10)]);
    return {
      content: `Tính: ${fmt10(a10)} × ${n} = ?`,
      options, correct: idx,
      explanation: `${fmt10(a10)} × ${n} = ${correctStr}.`
    };
  }
  if (t === 5) {
    const whole = 10 + level * 3 + i;
    const d = i % 10;
    const correct = d >= 5 ? whole + 1 : whole;
    const { options, correct: idx } = numericMcq(correct, 3, 0);
    return {
      content: `Làm tròn số thập phân ${whole},${d} đến hàng đơn vị.`,
      options, correct: idx,
      explanation: `Chữ số hàng phần mười là ${d}, ${d >= 5 ? `≥ 5 nên làm tròn lên: ${whole} + 1 = ${correct}` : `< 5 nên giữ nguyên phần nguyên: ${correct}`}.`
    };
  }
  const bOptions = [4, 5, 10, 20, 25, 50];
  const b = bOptions[i % bOptions.length];
  const a = 1 + (i % (b - 1));
  const correct = (a * 100) / b;
  const { options, correct: idx } = numericMcq(correct, Math.max(4, correct * 0.2), 0, 100);
  return {
    content: `Tỉ số phần trăm của ${a} và ${b} là bao nhiêu phần trăm?`,
    options, correct: idx,
    explanation: `Tỉ số phần trăm của ${a} và ${b} là (${a} : ${b}) × 100% = ${correct}%.`
  };
}

function mcqToan6_solids(level: number, i: number) {
  const t = i % 6;
  const base = 3 + level + (i % 6);
  if (t === 0) {
    const a = base, b = base + 1, c = base + 2;
    const correct = a * b * c;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm, chiều cao ${c} cm. Thể tích của hình hộp là bao nhiêu cm³?`, options, correct: idx, explanation: `Thể tích hình hộp chữ nhật = dài × rộng × cao = ${a} × ${b} × ${c} = ${correct} (cm³).` };
  }
  if (t === 1) {
    const a = base, b = base + 2, c = base + 1;
    const correct = 2 * (a + b) * c;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình hộp chữ nhật có chiều dài ${a} cm, chiều rộng ${b} cm, chiều cao ${c} cm. Diện tích xung quanh của hình hộp là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích xung quanh = 2 × (dài + rộng) × cao = 2 × (${a} + ${b}) × ${c} = ${correct} (cm²).` };
  }
  if (t === 2) {
    const a = 2 + (i % 5) + (level >= 2 ? 1 : 0);
    const correct = a * a * a;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình lập phương có cạnh ${a} cm. Thể tích hình lập phương là bao nhiêu cm³?`, options, correct: idx, explanation: `Thể tích hình lập phương = cạnh³ = ${a} × ${a} × ${a} = ${correct} (cm³).` };
  }
  if (t === 3) {
    const a = 2 + (i % 5) + (level >= 2 ? 1 : 0);
    const correct = 6 * a * a;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình lập phương có cạnh ${a} cm. Diện tích toàn phần của hình lập phương là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích toàn phần = 6 × cạnh² = 6 × ${a} × ${a} = ${correct} (cm²).` };
  }
  if (t === 4) {
    const sDay = base * 3, h = base;
    const correct = sDay * h;
    const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
    return { content: `Một hình lăng trụ đứng có diện tích đáy ${sDay} cm², chiều cao ${h} cm. Thể tích hình lăng trụ là bao nhiêu cm³?`, options, correct: idx, explanation: `Thể tích lăng trụ đứng = diện tích đáy × chiều cao = ${sDay} × ${h} = ${correct} (cm³).` };
  }
  const C = base * 4, h = base + 2;
  const correct = C * h;
  const { options, correct: idx } = numericMcq(correct, Math.max(6, correct * 0.3), 1);
  return { content: `Một hình lăng trụ đứng có chu vi đáy ${C} cm, chiều cao ${h} cm. Diện tích xung quanh của hình lăng trụ là bao nhiêu cm²?`, options, correct: idx, explanation: `Diện tích xung quanh = chu vi đáy × chiều cao = ${C} × ${h} = ${correct} (cm²).` };
}

function mcqToan6_statsProb(level: number, i: number) {
  const t = i % 4;
  if (t === 0) {
    const n = 20 + level * 10 + (i % 5) * 5;
    const m = 2 + (i % Math.max(2, Math.floor(n / 4)));
    const [sn, sd] = reduceFrac(m, n);
    const correctStr = `${sn}/${sd}`;
    const { options, correct: idx } = textOptions(correctStr, [`${sn + 1}/${sd}`, `${sn}/${sd + 1}`, `${m}/${n + 1}`]);
    return {
      content: `Gieo một con xúc xắc ${n} lần, thấy mặt 6 chấm xuất hiện ${m} lần. Xác suất thực nghiệm xuất hiện mặt 6 chấm là bao nhiêu?`,
      options, correct: idx,
      explanation: `Xác suất thực nghiệm = số lần xuất hiện : tổng số lần thử = ${m}/${n} = ${correctStr}.`
    };
  }
  if (t === 1) {
    const vals = [10 + i, 6 + level, 14 + (i % 3), 8 + level * 2];
    const subjects = ["Toán", "Văn", "Tiếng Anh", "KHTN"];
    const maxVal = Math.max(...vals);
    const correctSubject = subjects[vals.indexOf(maxVal)];
    const pairs = subjects.map((s, idx4) => `${s} ${vals[idx4]}`).join(", ");
    return {
      content: `Số học sinh giỏi từng môn của một lớp: ${pairs}. Môn nào có số học sinh giỏi nhiều nhất?`,
      options: subjects,
      correct: subjects.indexOf(correctSubject),
      explanation: `Môn ${correctSubject} có số học sinh giỏi nhiều nhất (${maxVal} học sinh).`
    };
  }
  if (t === 2) {
    const a = 8 + i, b = 5 + level + (i % 3), c = 6 + (i % 4);
    const correct = a + b + c;
    const { options, correct: idx } = numericMcq(correct, Math.max(4, correct * 0.2), 1);
    return {
      content: `Một lớp khảo sát sở thích thể thao: ${a} bạn thích bóng đá, ${b} bạn thích cầu lông, ${c} bạn thích bơi (mỗi bạn chỉ chọn một môn). Tổng số bạn được khảo sát là bao nhiêu?`,
      options, correct: idx,
      explanation: `Tổng số bạn được khảo sát = ${a} + ${b} + ${c} = ${correct} (bạn).`
    };
  }
  const total = 30 + level * 10 + i;
  const partA = 12 + (i % 6) + level;
  const correct = total - partA;
  const { options, correct: idx } = numericMcq(correct, Math.max(4, correct * 0.2), 0);
  return {
    content: `Một lớp có ${total} học sinh, trong đó có ${partA} bạn thích môn Toán, số còn lại thích môn Văn. Hỏi có bao nhiêu bạn thích môn Văn?`,
    options, correct: idx,
    explanation: `Số bạn thích môn Văn = ${total} - ${partA} = ${correct} (bạn).`
  };
}

const TOAN6_MCQ_GENERATORS: Array<(level: number, i: number) => { content: string; options: string[]; correct: number; explanation: string }> = [
  mcqToan6_setsNat,
  mcqToan6_ops,
  mcqToan6_divisibility,
  mcqToan6_integers,
  mcqToan6_planeShapes,
  mcqToan6_symmetry,
  mcqToan6_fractions,
  mcqToan6_decimals,
  mcqToan6_solids,
  mcqToan6_statsProb,
];

const TOAN6_SHORT_BANK: [string, string][][] = [
  [["Số liền sau của 999 là số nào?", "1000"], ["Số La Mã IX có giá trị là bao nhiêu?", "9"]],
  [["Tính: 2 mũ 5 bằng bao nhiêu?", "32"], ["Kết quả phép tính 3 + 4 x 2 là bao nhiêu?", "11"]],
  [["Số nguyên tố nhỏ nhất là số nào?", "2"], ["ƯCLN của 12 và 18 là bao nhiêu?", "6"]],
  [["Số đối của -7 là số nào?", "7"], ["Giá trị tuyệt đối của -9 là bao nhiêu?", "9"]],
  [["Chu vi hình vuông cạnh 5cm là bao nhiêu?", "20"], ["Diện tích hình chữ nhật 4cm x 6cm là bao nhiêu?", "24"]],
  [["Hình vuông có bao nhiêu trục đối xứng?", "4"], ["Tam giác đều có bao nhiêu trục đối xứng?", "3"]],
  [["Rút gọn phân số 6/8 về tối giản.", "3/4"], ["1/2 + 1/4 bằng bao nhiêu?", "3/4"]],
  [["0,5 viết dưới dạng phân số tối giản là bao nhiêu?", "1/2"], ["Tỉ số phần trăm của 1 và 4 là bao nhiêu phần trăm?", "25"]],
  [["Thể tích hình lập phương cạnh 3cm là bao nhiêu?", "27"], ["Hình hộp chữ nhật có bao nhiêu mặt?", "6"]],
  [["Gieo xúc xắc 10 lần, mặt 6 chấm ra 2 lần. Xác suất thực nghiệm là bao nhiêu (dạng phân số tối giản)?", "1/5"], ["Số liệu thống kê thường được biểu diễn bằng bảng số liệu và gì nữa?", "biểu đồ"]],
];

function toan6ShortQ(order: number, seedIdx: number) {
  const arr = TOAN6_SHORT_BANK[order - 1] || TOAN6_SHORT_BANK[0];
  const [content, sample] = arr[seedIdx % arr.length];
  return { content, sampleAnswer: sample, explanation: `Đáp án đúng là "${sample}".` };
}

const TOAN6_ESSAY_BANK: [string, string[]][] = [
  ["Nêu cách viết một tập hợp và cho ví dụ.", ["liệt kê", "tính chất đặc trưng", "phần tử", "ví dụ"]],
  ["Nêu thứ tự thực hiện các phép tính trong một biểu thức không có dấu ngoặc.", ["lũy thừa", "nhân chia", "cộng trừ", "trái sang phải"]],
  ["Nêu cách tìm ƯCLN và BCNN của hai số.", ["ước chung", "bội chung", "lớn nhất", "nhỏ nhất"]],
  ["Nêu quy tắc cộng hai số nguyên khác dấu.", ["giá trị tuyệt đối", "lớn trừ nhỏ", "dấu", "số lớn hơn"]],
  ["Nêu công thức tính chu vi và diện tích hình chữ nhật.", ["chiều dài", "chiều rộng", "chu vi", "diện tích"]],
  ["Nêu sự khác nhau giữa trục đối xứng và tâm đối xứng.", ["trục đối xứng", "tâm đối xứng", "gấp", "quay 180"]],
  ["Nêu cách quy đồng mẫu số hai phân số.", ["mẫu số chung", "bội chung nhỏ nhất", "tử số", "thừa số phụ"]],
  ["Nêu cách so sánh hai số thập phân.", ["phần nguyên", "phần thập phân", "so sánh", "từng hàng"]],
  ["Nêu công thức tính thể tích hình hộp chữ nhật.", ["chiều dài", "chiều rộng", "chiều cao", "thể tích"]],
  ["Nêu công thức tính xác suất thực nghiệm của một sự kiện.", ["số lần xuất hiện", "tổng số lần thử", "xác suất", "tỉ số"]],
];

function toan6EssayQ(order: number) {
  const [content, keywords] = TOAN6_ESSAY_BANK[order - 1] || TOAN6_ESSAY_BANK[0];
  return { content, keywords, explanation: `Bài viết cần nêu được các ý: ${keywords.join(", ")}.` };
}

function generateToan6Questions(lessonId: string, level: number, order: number): Question[] {
  const qs: Question[] = [];
  const mk = TOAN6_MCQ_GENERATORS[order - 1] || TOAN6_MCQ_GENERATORS[0];

  for (let i = 0; i < 20; i++) {
    const m = mk(level, i);
    qs.push({
      id: `${lessonId}_L${level}_mcq${i}`,
      subject: "Toán", grade: 6, lessonId, level, type: "mcq",
      content: m.content, options: m.options, correct: m.correct, explanation: m.explanation
    });
  }
  for (let i = 0; i < 2; i++) {
    const s = toan6ShortQ(order, i);
    qs.push({
      id: `${lessonId}_L${level}_short${i}`,
      subject: "Toán", grade: 6, lessonId, level, type: "short",
      content: s.content, sampleAnswer: s.sampleAnswer, explanation: s.explanation
    });
  }
  for (let i = 0; i < 2; i++) {
    const e = toan6EssayQ(order);
    qs.push({
      id: `${lessonId}_L${level}_essay${i}`,
      subject: "Toán", grade: 6, lessonId, level, type: "essay",
      content: e.content, keywords: e.keywords, explanation: e.explanation
    });
  }
  return qs;
}

export function generateQuestionsFor(subject: string, grade: number, lessonId: string, level: number, varietySeed: number): Question[] {
  if (subject === "Toán" && grade === 6) {
    return generateToan6Questions(lessonId, level, varietySeed);
  }
  const gens: Record<string, (g: number, l: number, s: number) => { content: string; options: string[]; correct: number; explanation?: string }> = {
    "Toán": mcqMath, "Tiếng Anh": mcqEnglish, "Văn": mcqLit, "KHTN": mcqScience
  };
  const mk = gens[subject] || mcqMath;
  const qs: Question[] = [];
  const seedBase = varietySeed * 10;
  // Deterministic (not nid()-based) IDs: lessons/questions are regenerated fresh on every
  // page load rather than persisted, so their IDs must stay stable across reloads for
  // persisted Attempts/Certificates (which reference lessonId) to keep resolving correctly.

  for (let i = 0; i < 6; i++) {
    const m = mk(grade, level, seedBase + i);
    qs.push({
      id: `${lessonId}_L${level}_mcq${i}`,
      subject,
      grade,
      lessonId,
      level,
      type: "mcq",
      content: m.content,
      options: m.options,
      correct: m.correct,
      explanation: m.explanation
    });
  }

  for (let i = 0; i < 2; i++) {
    const s = shortQ(subject, grade, level, seedBase + i);
    qs.push({
      id: `${lessonId}_L${level}_short${i}`,
      subject,
      grade,
      lessonId,
      level,
      type: "short",
      content: s.content,
      sampleAnswer: s.sampleAnswer,
      explanation: s.explanation
    });
  }

  for (let i = 0; i < 2; i++) {
    const e = essayQ(subject, grade, level, seedBase + i);
    qs.push({
      id: `${lessonId}_L${level}_essay${i}`,
      subject,
      grade,
      lessonId,
      level,
      type: "essay",
      content: e.content,
      keywords: e.keywords,
      explanation: e.explanation
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
      // Deterministic ID (not nid()) so it stays stable across reloads — lessons are
      // regenerated fresh every page load rather than persisted; see generateQuestionsFor.
      if (subject === "Toán" && grade === 6) {
        TOAN6_LESSONS.forEach((spec, i) => {
          out.push({
            id: `les_${norm(subject).replace(/\s+/g, "")}_${grade}_${i + 1}`,
            subject,
            grade,
            order: i + 1,
            title: `Bài ${i + 1}: ${spec.title}`,
            desc: spec.desc,
            content: spec.content,
            driveLink: "https://drive.google.com/drive/folders/an-tam-demo"
          });
        });
        return;
      }
      (LESSON_TITLES[subject] || []).forEach((title, i) => {
        out.push({
          id: `les_${norm(subject).replace(/\s+/g, "")}_${grade}_${i + 1}`,
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
