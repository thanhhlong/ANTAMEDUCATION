import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CheckCircle2, LogIn, LogOut, Trash2, ScanFace, RefreshCw } from 'lucide-react';
import { User, FaceEnrollment, AttendanceRecord } from '../types';
import { Card, Badge, Button, Select, EmptyState } from './UI';
import { nid, todayStr, norm } from '../data/seedData';
import { loadFaceModels, detectFaceDescriptor, averageDescriptors, findBestMatch } from '../lib/faceRecognition';

const CAPTURES_NEEDED = 3;
const RECOGNITION_INTERVAL_MS = 1500;
const SAME_STUDENT_COOLDOWN_MS = 8000;
const MIN_GAP_BETWEEN_CHECKIN_CHECKOUT_MS = 60000;

function fmtTime(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('vi-VN');
}

// Best-effort sync to the Admin's Google Sheet — mirrors the accounts-sheet pattern.
// Silently ignored if the backend isn't configured with Sheets credentials yet.
function syncAttendanceAppend(record: AttendanceRecord, studentName: string) {
  fetch('/api/attendance-sheet/append', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName,
      date: record.date,
      checkIn: record.checkIn || '',
      checkOut: record.checkOut || ''
    })
  }).catch(() => {});
}

function useCamera(active: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      .then(s => {
        if (cancelled) { s.getTracks().forEach(t => t.stop()); return; }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => setReady(true);
        }
      })
      .catch(err => setError(err?.message || 'Không thể truy cập camera.'));

    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach(t => t.stop());
      setReady(false);
    };
  }, [active]);

  return { videoRef, ready, error };
}

interface FaceEnrollTabProps {
  students: User[];
  enrollments: FaceEnrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<FaceEnrollment[]>>;
  currentUserName: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function FaceEnrollTab({ students, enrollments, setEnrollments, currentUserName, showToast }: FaceEnrollTabProps) {
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [consent, setConsent] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [captures, setCaptures] = useState<Float32Array[]>([]);
  const [capturing, setCapturing] = useState(false);
  const { videoRef, ready, error } = useCamera(cameraOn);

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true)).catch(() => showToast('Không tải được mô hình nhận diện khuôn mặt.', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enrollmentOf = (id: string) => enrollments.find(e => e.studentId === id);

  const startCamera = () => {
    setCaptures([]);
    setCameraOn(true);
  };

  const stopCamera = () => {
    setCameraOn(false);
    setCaptures([]);
  };

  const capture = async () => {
    if (!videoRef.current || !modelsReady) return;
    setCapturing(true);
    try {
      const descriptor = await detectFaceDescriptor(videoRef.current);
      if (!descriptor) {
        showToast('Không phát hiện khuôn mặt rõ ràng, vui lòng thử lại.', 'error');
        return;
      }
      setCaptures(prev => [...prev, descriptor]);
    } finally {
      setCapturing(false);
    }
  };

  const save = () => {
    if (captures.length === 0) return;
    const descriptor = averageDescriptors(captures);
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const enrollment: FaceEnrollment = {
      studentId,
      descriptor,
      consentAt: new Date().toISOString(),
      consentBy: currentUserName,
      enrolledAt: new Date().toISOString()
    };
    setEnrollments(prev => [...prev.filter(e => e.studentId !== studentId), enrollment]);
    showToast(`Đã đăng ký khuôn mặt cho ${student.name}.`);
    stopCamera();
    setConsent(false);
  };

  const removeEnrollment = (id: string) => {
    setEnrollments(prev => prev.filter(e => e.studentId !== id));
    showToast('Đã xoá dữ liệu khuôn mặt.');
  };

  const canCapture = cameraOn && ready && modelsReady && consent && captures.length < CAPTURES_NEEDED;
  const canSave = captures.length > 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Đăng ký khuôn mặt học sinh</h3>

        <Select label="Chọn học sinh" value={studentId} onChange={e => { setStudentId(e.target.value); stopCamera(); }}>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name} — Khối {s.grade}{enrollmentOf(s.id) ? ' (đã đăng ký)' : ''}</option>
          ))}
        </Select>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <input type="checkbox" className="mt-0.5" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>
            Tôi xác nhận đã có sự đồng ý của học sinh/phụ huynh về việc thu thập dữ liệu khuôn mặt
            (dữ liệu sinh trắc học) để phục vụ điểm danh, theo quy định về bảo vệ dữ liệu cá nhân.
            Người xác nhận: <strong>{currentUserName}</strong>.
          </span>
        </label>

        {!cameraOn ? (
          <Button icon={<Camera size={15} />} onClick={startCamera} disabled={!consent || !modelsReady}>
            {modelsReady ? 'Bật camera' : 'Đang tải mô hình nhận diện...'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={capture} disabled={!canCapture || capturing} icon={<ScanFace size={14} />}>
                {capturing ? 'Đang chụp...' : `Chụp mẫu (${captures.length}/${CAPTURES_NEEDED})`}
              </Button>
              <Button size="sm" variant="secondary" onClick={stopCamera}>Tắt camera</Button>
            </div>
            <Button className="w-full justify-center" variant="success" disabled={!canSave} onClick={save}>
              Lưu đăng ký ({captures.length} mẫu)
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-slate-800 mb-4">Đã đăng ký ({enrollments.length})</h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {enrollments.map(e => {
            const s = students.find(st => st.id === e.studentId);
            return (
              <div key={e.studentId} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{s?.name || 'Học sinh đã xoá'}</p>
                  <p className="text-xs text-slate-400">
                    Đăng ký {new Date(e.enrolledAt).toLocaleDateString('vi-VN')} · Xác nhận bởi {e.consentBy}
                  </p>
                </div>
                <button onClick={() => removeEnrollment(e.studentId)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
          {enrollments.length === 0 && <EmptyState text="Chưa có học sinh nào được đăng ký khuôn mặt." />}
        </div>
      </Card>
    </div>
  );
}

interface KioskViewProps {
  students: User[];
  enrollments: FaceEnrollment[];
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

function KioskView({ students, enrollments, records, setRecords }: KioskViewProps) {
  const [running, setRunning] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [status, setStatus] = useState<{ msg: string; kind: 'in' | 'out' | 'info' | 'unknown' } | null>(null);
  const { videoRef, ready, error } = useCamera(running);
  const cooldownRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    loadFaceModels().then(() => setModelsReady(true));
  }, []);

  const handleRecognized = useCallback((studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    const now = new Date();
    const today = todayStr();

    setRecords(prev => {
      const idx = prev.findIndex(r => r.studentId === studentId && r.date === today);
      if (idx === -1) {
        const rec: AttendanceRecord = { id: nid('att'), studentId, date: today, checkIn: now.toISOString() };
        setStatus({ msg: `Xin chào, ${student.name}! Đã điểm danh VÀO lúc ${fmtTime(rec.checkIn)}.`, kind: 'in' });
        syncAttendanceAppend(rec, student.name);
        return [...prev, rec];
      }
      const existing = prev[idx];
      if (!existing.checkOut) {
        const inTime = existing.checkIn ? new Date(existing.checkIn).getTime() : 0;
        if (now.getTime() - inTime < MIN_GAP_BETWEEN_CHECKIN_CHECKOUT_MS) {
          setStatus({ msg: `${student.name} đã điểm danh vào lúc ${fmtTime(existing.checkIn)}.`, kind: 'info' });
          return prev;
        }
        const updated = { ...existing, checkOut: now.toISOString() };
        setStatus({ msg: `Tạm biệt, ${student.name}! Đã điểm danh RA lúc ${fmtTime(updated.checkOut)}.`, kind: 'out' });
        syncAttendanceAppend(updated, student.name);
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      setStatus({ msg: `${student.name} đã điểm danh đủ hôm nay (vào ${fmtTime(existing.checkIn)}, ra ${fmtTime(existing.checkOut)}).`, kind: 'info' });
      return prev;
    });
  }, [students, setRecords]);

  useEffect(() => {
    if (!running || !ready || !modelsReady) return;
    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (!video) return;
      const descriptor = await detectFaceDescriptor(video);
      if (!descriptor) return;

      const best = findBestMatch(descriptor, enrollments);
      if (!best) {
        setStatus({ msg: 'Đã phát hiện khuôn mặt nhưng chưa được đăng ký trong hệ thống.', kind: 'unknown' });
        return;
      }
      const studentId = best.match.studentId;
      const last = cooldownRef.current.get(studentId) || 0;
      if (Date.now() - last < SAME_STUDENT_COOLDOWN_MS) return;
      cooldownRef.current.set(studentId, Date.now());
      handleRecognized(studentId);
    }, RECOGNITION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [running, ready, modelsReady, enrollments, handleRecognized, videoRef]);

  const todayRecords = records.filter(r => r.date === todayStr());

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-slate-800">Màn hình điểm danh (Kiosk)</h3>
        <p className="text-sm text-slate-500">
          Đặt thiết bị ở cửa lớp. Học sinh lần lượt đứng trước camera để hệ thống tự nhận diện và ghi giờ vào/ra.
        </p>

        {!running ? (
          <Button icon={<Camera size={15} />} onClick={() => setRunning(true)} disabled={!modelsReady}>
            {modelsReady ? 'Bắt đầu điểm danh' : 'Đang tải mô hình nhận diện...'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video">
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover -scale-x-100" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button size="sm" variant="secondary" onClick={() => setRunning(false)}>Dừng điểm danh</Button>
          </div>
        )}

        {status && (
          <div className={`p-3.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
            status.kind === 'in' ? 'bg-emerald-50 text-emerald-700' :
            status.kind === 'out' ? 'bg-sky-50 text-sky-700' :
            status.kind === 'unknown' ? 'bg-amber-50 text-amber-700' :
            'bg-slate-50 text-slate-600'
          }`}>
            {status.kind === 'in' && <LogIn size={16} />}
            {status.kind === 'out' && <LogOut size={16} />}
            {status.kind === 'info' && <CheckCircle2 size={16} />}
            {status.msg}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="font-bold text-slate-800 mb-4">Điểm danh hôm nay ({todayRecords.length})</h3>
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {todayRecords.map(r => {
            const s = students.find(st => st.id === r.studentId);
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <p className="text-sm font-semibold text-slate-700 truncate">{s?.name || '—'}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge tone="green">Vào {fmtTime(r.checkIn)}</Badge>
                  <Badge tone={r.checkOut ? 'sky' : 'slate'}>Ra {fmtTime(r.checkOut)}</Badge>
                </div>
              </div>
            );
          })}
          {todayRecords.length === 0 && <EmptyState text="Chưa có lượt điểm danh nào hôm nay." />}
        </div>
      </Card>
    </div>
  );
}

interface AttendanceLogTabProps {
  students: User[];
  records: AttendanceRecord[];
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

function AttendanceLogTab({ students, records, showToast }: AttendanceLogTabProps) {
  const [dateFilter, setDateFilter] = useState(todayStr());
  const [query, setQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const nameOf = (id: string) => students.find(s => s.id === id)?.name || '—';

  const filtered = records
    .filter(r => !dateFilter || r.date === dateFilter)
    .filter(r => !query || norm(nameOf(r.studentId)).includes(norm(query)))
    .sort((a, b) => (b.checkIn || '').localeCompare(a.checkIn || ''));

  const syncToDrive = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/attendance-sheet/full-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: records.map(r => ({
            studentName: nameOf(r.studentId),
            date: r.date,
            checkIn: r.checkIn || '',
            checkOut: r.checkOut || ''
          }))
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Đồng bộ Google Drive thất bại.', 'error');
        return;
      }
      showToast('Đã đồng bộ nhật ký điểm danh lên Google Drive.');
    } catch {
      showToast('Không thể kết nối tới máy chủ để đồng bộ.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h3 className="font-bold text-slate-800">Nhật ký điểm danh</h3>
        <Button
          size="sm"
          variant="secondary"
          disabled={syncing}
          icon={<RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />}
          onClick={syncToDrive}
        >
          Đồng bộ Google Drive
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
        />
        <input
          type="text"
          placeholder="Tìm theo tên học sinh..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
        />
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map(r => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">{nameOf(r.studentId)}</p>
              <p className="text-xs text-slate-400">{fmtDate(r.date)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="green">Vào {fmtTime(r.checkIn)}</Badge>
              <Badge tone={r.checkOut ? 'sky' : 'slate'}>Ra {fmtTime(r.checkOut)}</Badge>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState text="Không có dữ liệu điểm danh phù hợp." />}
      </div>
    </Card>
  );
}

interface AttendancePageProps {
  mode: 'full' | 'kiosk-only';
  currentUserName: string;
  students: User[];
  enrollments: FaceEnrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<FaceEnrollment[]>>;
  records: AttendanceRecord[];
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function AttendancePage({ mode, currentUserName, students, enrollments, setEnrollments, records, setRecords, showToast }: AttendancePageProps) {
  const [tab, setTab] = useState<'enroll' | 'kiosk' | 'log'>('kiosk');

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Điểm danh bằng khuôn mặt</h1>
        <p className="text-sm text-slate-500 mt-1">
          Nhận diện khuôn mặt chạy ngay trên trình duyệt (không gửi ảnh ra ngoài), tự động ghi lại giờ vào/ra của học sinh.
        </p>
      </div>

      {mode === 'full' && (
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
          {([
            ['enroll', 'Đăng ký khuôn mặt'],
            ['kiosk', 'Điểm danh (Kiosk)'],
            ['log', 'Nhật ký điểm danh']
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === k ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {(mode === 'kiosk-only' || tab === 'kiosk') && (
        <KioskView students={students} enrollments={enrollments} records={records} setRecords={setRecords} />
      )}
      {mode === 'full' && tab === 'enroll' && (
        <FaceEnrollTab students={students} enrollments={enrollments} setEnrollments={setEnrollments} currentUserName={currentUserName} showToast={showToast} />
      )}
      {mode === 'full' && tab === 'log' && (
        <AttendanceLogTab students={students} records={records} showToast={showToast} />
      )}
    </div>
  );
}
