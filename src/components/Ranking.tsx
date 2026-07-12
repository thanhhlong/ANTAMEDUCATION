import React, { useState, useMemo } from 'react';
import { Trophy, Users, Shield } from 'lucide-react';
import { User, Attempt, Lesson } from '../types';
import { Card, Badge, Select, Avatar, MedalDot, computeLeaderboard } from './UI';
import { GRADES } from '../data/seedData';

interface RankingPageProps {
  users: User[];
  attempts: Attempt[];
  lessons: Lesson[];
  currentUser: User | null;
}

export function RankingPage({ users, attempts, lessons, currentUser }: RankingPageProps) {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [limit, setLimit] = useState<number>(10);

  const filteredUsers = useMemo(() => {
    return gradeFilter === 'all'
      ? users
      : users.filter(u => u.grade === Number(gradeFilter));
  }, [users, gradeFilter]);

  const board = useMemo(() => {
    return computeLeaderboard(filteredUsers, attempts, lessons);
  }, [filteredUsers, attempts, lessons]);

  const top = useMemo(() => {
    return board.slice(0, limit);
  }, [board, limit]);

  const myRank = useMemo(() => {
    if (!currentUser) return -1;
    return board.findIndex(b => b.user.id === currentUser.id) + 1;
  }, [board, currentUser]);

  const top3 = useMemo(() => {
    return board.slice(0, 3);
  }, [board]);

  return (
    <div className="animate-fadeUp">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">Bảng xếp hạng</h1>
        <p className="text-sm text-slate-500 mt-1">
          Xếp hạng dựa trên tổng điểm tích luỹ và mức độ tích cực ôn luyện của học sinh.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select 
          value={gradeFilter} 
          onChange={e => setGradeFilter(e.target.value)} 
          className="w-40 !py-2.5"
        >
          <option value="all">Tất cả khối</option>
          {GRADES.map(g => <option key={g} value={g}>Khối {g}</option>)}
        </Select>

        <div className="flex gap-1.5">
          {[3, 5, 10].map(n => (
            <button 
              key={n} 
              onClick={() => setLimit(n)} 
              className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                limit === n 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              TOP {n}
            </button>
          ))}
        </div>

        {currentUser?.role === 'student' && myRank > 0 && (
          <Badge tone="green">Hạng của bạn: #{myRank}</Badge>
        )}
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid md:grid-cols-3 gap-5 mb-6 items-end">
        {top3.map((b, i) => {
          const cardOrders = ["order-2 md:-translate-y-4 border-2 border-yellow-200 shadow-md", "order-1", "order-3"];
          const podiumPositions = [1, 2, 3];
          const podiumTones = [
            "bg-yellow-50 text-yellow-700 border-yellow-100",
            "bg-slate-100 text-slate-600",
            "bg-amber-50 text-amber-800"
          ];
          
          return (
            <Card 
              key={b.user.id} 
              className={`p-6 text-center relative overflow-hidden bg-white ${cardOrders[i] || ""}`}
            >
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-extrabold text-lg mb-3 ${podiumTones[i] || ""}`}>
                #{podiumPositions[i]}
              </div>
              
              <div className="flex justify-center mb-2">
                <Avatar name={b.user.name} size={48} />
              </div>
              
              <p className="font-bold text-slate-800 text-base">{b.user.name}</p>
              <p className="text-xs text-slate-400 mb-3 font-medium">Khối {b.user.grade}</p>
              
              <p className="text-2xl font-extrabold text-emerald-600">
                {b.points.toFixed(1)}
                <span className="text-xs text-slate-300 font-semibold ml-0.5"> điểm</span>
              </p>
              
              <div className="flex flex-wrap justify-center gap-1 mt-3">
                {b.medals.slice(0, 3).map((m, idx) => (
                  <MedalDot key={idx} medal={m.medal} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Complete Table List */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="text-left px-4 py-3">Hạng</th>
              <th className="text-left px-4 py-3">Học sinh</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Khối</th>
              <th className="text-left px-4 py-3">Điểm</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Lượt thi</th>
              <th className="text-left px-4 py-3">Huy chương</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {top.map((b, i) => (
              <tr 
                key={b.user.id} 
                className={`transition-colors ${b.user.id === currentUser?.id ? "bg-emerald-50/40" : "hover:bg-slate-50/30"}`}
              >
                <td className="px-4 py-3.5 font-extrabold text-slate-500">#{i + 1}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={b.user.name} size={28} />
                    <span className="font-semibold text-slate-700">{b.user.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell text-slate-500 font-medium">Khối {b.user.grade}</td>
                <td className="px-4 py-3.5 font-bold text-emerald-600">{b.points.toFixed(1)}</td>
                <td className="px-4 py-3.5 hidden sm:table-cell text-slate-500">{b.activity}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {b.medals.map((m, idx) => (
                      <MedalDot key={idx} medal={m.medal} />
                    ))}
                    {b.medals.length === 0 && <span className="text-slate-300 text-xs">—</span>}
                  </div>
                </td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-400">
                  Chưa có dữ liệu xếp hạng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
