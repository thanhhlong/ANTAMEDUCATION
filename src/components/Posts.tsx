import React, { useState } from 'react';
import { Plus, MessageSquare, ChevronRight } from 'lucide-react';
import { User, Post } from '../types';
import { Card, Badge, Button, Input, Textarea, Modal, EmptyState, Avatar } from './UI';

interface PostFormProps {
  onSubmit: (title: string, content: string) => void;
  onCancel: () => void;
}

export function PostForm({ onSubmit, onCancel }: PostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="space-y-4">
      <Input 
        label="Tiêu đề bài viết" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
        placeholder="Ví dụ: Bí quyết ôn tập và làm chủ môn Toán" 
      />
      <Textarea 
        label="Nội dung chia sẻ" 
        rows={6} 
        value={content} 
        onChange={e => setContent(e.target.value)} 
        placeholder="Chia sẻ phương pháp học, mẹo ghi nhớ hay các bài tập hữu ích..." 
      />
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
          Huỷ
        </Button>
        <Button 
          className="flex-1 justify-center" 
          disabled={!title.trim() || !content.trim()} 
          onClick={() => onSubmit(title.trim(), content.trim())}
        >
          Gửi bài chia sẻ (chờ duyệt)
        </Button>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: Post;
  authorName: string;
}

export function PostCard({ post, authorName }: PostCardProps) {
  return (
    <Card className="p-5 animate-fadeUp flex flex-col justify-between bg-white hover:border-slate-200 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Badge tone={post.kind === 'official' ? 'blue' : 'sky'}>
            {post.kind === 'official' ? 'Bài viết chính thức' : 'Bài viết cộng đồng'}
          </Badge>
          {post.status === 'pending' && <Badge tone="amber">Chờ duyệt</Badge>}
        </div>
        
        <h3 className="font-bold text-slate-800 text-base mb-2 leading-snug">{post.title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{post.content}</p>
      </div>

      <div className="flex items-center gap-2.5 mt-4 pt-3.5 border-t border-slate-50">
        <Avatar name={authorName} size={24} />
        <span className="text-xs text-slate-400 font-medium">
          Đăng bởi: {authorName} · {new Date(post.createdAt).toLocaleDateString("vi-VN")}
        </span>
      </div>
    </Card>
  );
}

interface PostsPageProps {
  user: User;
  posts: Post[];
  users: User[];
  onAddPost: (title: string, content: string) => void;
}

export function PostsPage({ user, posts, users, onAddPost }: PostsPageProps) {
  const [tab, setTab] = useState<'official' | 'community' | 'mine'>('official');
  const [showForm, setShowForm] = useState(false);

  const nameOf = (id: string) => {
    return users.find(u => u.id === id)?.name || "Ẩn danh";
  };

  const officialPosts = posts.filter(p => p.status === 'approved' && p.kind === 'official');
  const communityPosts = posts.filter(p => p.status === 'approved' && p.kind === 'community');
  const myPending = posts.filter(p => p.authorId === user.id && p.status === 'pending');

  const list = tab === 'official' 
    ? officialPosts 
    : tab === 'community' 
      ? communityPosts 
      : myPending;

  return (
    <div className="animate-fadeUp">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Bài viết chia sẻ kiến thức</h1>
          <p className="text-sm text-slate-500 mt-1">
            Nơi đọc các bài chính thức từ thầy cô hoặc thảo luận, trao đổi kinh nghiệm học tập của học sinh.
          </p>
        </div>
        
        {user.role !== 'admin' && (
          <Button icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Viết bài mới
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-none pb-1">
        {(
          [
            ['official', 'Chính thức'],
            ['community', 'Cộng đồng'],
            ['mine', 'Bài của tôi (chờ duyệt)']
          ] as const
        ).map(([k, l]) => {
          // Hide "mine" tab if user is admin
          if (k === 'mine' && user.role === 'admin') return null;
          return (
            <button 
              key={k} 
              onClick={() => setTab(k)} 
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === k 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {l}
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {list.map(p => (
          <PostCard key={p.id} post={p} authorName={nameOf(p.authorId)} />
        ))}
        {list.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState text="Chưa có bài viết nào được đăng ở danh mục này." />
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Viết bài chia sẻ kiến thức" wide>
        <PostForm 
          onCancel={() => setShowForm(false)} 
          onSubmit={(title, content) => { 
            onAddPost(title, content); 
            setShowForm(false); 
          }} 
        />
      </Modal>
    </div>
  );
}
