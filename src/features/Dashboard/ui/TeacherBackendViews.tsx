'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudentDetailView } from './StudentDetailView';
import { useAuthGuard } from '@/shared/lib';
import {
  getTeacherDashboard,
  getTeacherDashboardHome,
  getTeacherStudents,
  getTeacherConnectionRequests,
  getTeacherQr,
  updateTeacherConnectionRequest,
  getTeacherProfile,
  updateTeacherProfile,
} from '../api/teacher';

const LESSON_SUBJECTS = ['Mathematics', 'English', 'Science', 'History', 'Geography', 'Arts', 'Other'];
const LESSON_LEVELS = ['Primary', 'Secondary', 'Tertiary'];

export function TeacherHomeBackendView({
  user,
  onAction,
}: {
  user?: any;
  onAction: (action: 'upload' | 'assign') => void;
}) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await getTeacherDashboardHome();
      setData('data' in res ? res.data || null : null);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const d = data || {};
    return [
      { label: 'Students who may need support', value: d.students_need_support ?? 0 },
      { label: 'Lessons with confusion signals', value: d.lessons_with_confusion ?? 0 },
      { label: 'Topics building well', value: d.topics_building_well ?? 0 },
    ];
  }, [data]);

  const activity = Array.isArray(data?.recent_activity) ? data.recent_activity : [];

  return (
    <div className="max-w-[780px]">
      <h1 className="text-2xl font-semibold text-indigo leading-tight tracking-[-0.01em]">
        Good afternoon, {user?.name || 'Teacher'}
      </h1>
      <p className="text-graphite-60 text-[14px] mt-2 mb-8">Here&apos;s what&apos;s happening with your students today</p>

      <section className="mb-8">
        <h2 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">This week</h2>
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-transparent rounded-2xl px-6 py-5 border border-[#E9E7E2]">
              <div className="text-[32px] font-bold text-[#3B3F6E]">{loading ? '...' : s.value}</div>
              <div className="text-[12.5px] text-graphite-60">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Quick actions</h2>
        <div className="flex gap-4">
          <button
            onClick={() => onAction('upload')}
            className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13.5px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
          >
            Upload lesson
          </button>
          <button
            onClick={() => onAction('assign')}
            className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13.5px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
          >
            Assign lesson
          </button>
          <button
            onClick={() => router.push('/dashboard?view=students')}
            className="flex-1 py-3 px-5 text-center border-2 border-[#3B3F6E] text-[#3B3F6E] rounded-full text-[13.5px] font-semibold hover:bg-[#3B3F6E] hover:text-white transition-all duration-200 cursor-pointer"
          >
            View students
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-[#3B3F6E] mb-4">Recent activity</h2>
        <div className="bg-white rounded-2xl border border-[#E9E7E2] overflow-hidden">
          {activity.length === 0 && <p className="px-6 py-5 text-[13px] text-graphite-40">No recent activity yet.</p>}
          {activity.map((item: any, idx: number) => (
            <div key={item.id || idx} className={`px-6 py-4 text-[13px] ${idx < activity.length - 1 ? 'border-b border-[#EEECEA]' : ''}`}>
              {item.text || item.message || JSON.stringify(item)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TeacherLessonsBackendView({
  onAction,
}: {
  onAction: (action: 'upload' | 'assign') => void;
}) {
  const [data, setData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts'>('all');
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const res = await getTeacherDashboard();
      const d = 'data' in res ? res.data || {} : {};
      setData(Array.isArray(d.lessons) ? d.lessons : Array.isArray(d) ? d : []);
    })();
  }, []);

  const normalized = data.map((l: any) => ({
    id: l.id,
    title: l.title || l.name || 'Lesson',
    subject: l.subject || 'Subject',
    level: l.level || l.grade_level || l.class_level || 'Secondary',
    status: String(l.status || 'published').toLowerCase(),
  }));

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) => (prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]));
  };

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };

  const applyFilters = () => {
    setShowFilter(false);
  };

  const clearFilters = () => {
    setSelectedSubjects([]);
    setSelectedLevels([]);
  };

  const filtered = normalized.filter((l) => {
    if (activeTab === 'published' && l.status !== 'published') return false;
    if (activeTab === 'drafts' && l.status !== 'draft') return false;
    if (search && !`${l.title} ${l.subject}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedSubjects.length > 0 && !selectedSubjects.includes(l.subject)) return false;
    if (selectedLevels.length > 0 && !selectedLevels.includes(l.level)) return false;
    return true;
  });

  return (
    <div className="max-w-[900px]">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-semibold text-[#3B3F6E]">Lessons</h2>
        <div className="flex gap-2">
          {/* <button
            onClick={() => onAction('assign')}
            className="px-4 py-2 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] text-[13px] font-semibold"
          >
            Assign lesson
          </button> */}
          <button
            onClick={() => onAction('upload')}
            className="px-4 py-2 rounded-xl cursor-pointer bg-[#3B3F6E] text-white text-[13px] font-semibold"
          >
            Upload lesson
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lessons..."
          className="flex-1 border border-[#E0DDD8] rounded-xl px-4 py-2.5 text-[13px] outline-none focus:border-[#3B3F6E]"
        />
        <button
          onClick={() => {
            setShowFilter(true);
          }}
          className="px-4 py-2.5 rounded-xl border cursor-pointer border-[#E0DDD8] text-[13px] font-semibold text-[#3B3F6E]"
        >
          Filter
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-full text-[12px] font-semibold ${activeTab === 'all' ? 'bg-[#3B3F6E] text-white' : 'text-graphite-60'}`}>All</button>
        <button onClick={() => setActiveTab('published')} className={`px-4 py-2 rounded-full text-[12px] font-semibold ${activeTab === 'published' ? 'bg-[#3B3F6E] text-white' : 'text-graphite-60'}`}>Published</button>
        <button onClick={() => setActiveTab('drafts')} className={`px-4 py-2 rounded-full text-[12px] font-semibold ${activeTab === 'drafts' ? 'bg-[#3B3F6E] text-white' : 'text-graphite-60'}`}>Drafts</button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E9E7E2] overflow-hidden">
        {filtered.length === 0 && (
          <div className="px-6 py-10 text-center">
            <p className="text-[13px] text-graphite-40">No lessons found for this view.</p>
            <p className="text-[12px] text-graphite-40 mt-1">You can still upload or assign lessons using the actions above.</p>
          </div>
        )}
        {filtered.map((l: any, i: number) => (
          <div key={l.id || i} className={`px-6 py-4 ${i < filtered.length - 1 ? 'border-b border-[#EEECEA]' : ''}`}>
            <p className="text-[14px] font-semibold text-[#2B2B2F]">{l.title}</p>
            <p className="text-[12px] text-graphite-40">{l.subject} · {l.level}</p>
          </div>
        ))}
      </div>

      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={() => setShowFilter(false)} />
          <div className="relative w-full max-w-[700px] bg-[#F7F1E6] rounded-t-3xl px-8 pt-4 pb-8 animate-slide-up">
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-graphite-40/40" />
            </div>

            <h3 className="text-[17px] font-semibold text-[#3B3F6E] mb-6">Filter lessons</h3>

            <div className="mb-6">
              <p className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Subject</p>
              <div className="flex flex-wrap gap-2">
                {LESSON_SUBJECTS.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${
                      selectedSubjects.includes(subject)
                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                        : 'bg-white border-[#D4D0CA] text-[#4A4A4A] hover:border-[#3B3F6E]'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <p className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Level</p>
              <div className="flex flex-wrap gap-2">
                {LESSON_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${
                      selectedLevels.includes(level)
                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                        : 'bg-white border-[#D4D0CA] text-[#4A4A4A] hover:border-[#3B3F6E]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={applyFilters}
              className="w-full bg-[#3B3F6E] text-white py-4 rounded-2xl font-semibold text-[14px] hover:bg-[#2E3259] transition-colors cursor-pointer mb-3"
            >
              Apply filters
            </button>
            <button
              onClick={() => {
                clearFilters();
                setShowFilter(false);
              }}
              className="w-full text-graphite-60 text-[13px] font-medium py-2 hover:text-graphite transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TeacherStudentsBackendView() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All classes');
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const guardAuth = useAuthGuard('teacher');
  useEffect(() => {
    (async () => {
      const res = await getTeacherStudents();
      if (guardAuth(res)) return;
      if ('error' in res && res.error) {
        setError(res.error);
        setStudents([]);
        setLoading(false);
        return;
      }
      const d = 'data' in res ? res.data : null;
      setStudents(Array.isArray(d) ? d : Array.isArray(d?.students) ? d.students : []);
      setError(null);
      setLoading(false);
    })();
  }, [guardAuth]);

  const normalized = useMemo(
    () =>
      students.map((s: any, i: number) => {
        const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part: string) => part[0]?.toUpperCase() || '')
          .join('');
        return {
          id: Number(s.id) || i + 1,
          name,
          initials: initials || 'ST',
          className: s.class_name || s.class || s.group_name || 'Unassigned class',
          subject: s.subject || '',
          lastActive: s.last_activity_at || s.last_active || s.last_seen || 'Recently',
          signal: i % 3 === 0 ? 'green' : i % 3 === 1 ? 'amber' : 'purple',
        };
      }),
    [students],
  );

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    normalized.forEach((s) => set.add(s.className));
    return ['All classes', ...Array.from(set)];
  }, [normalized]);

  const filtered = useMemo(() => {
    return normalized.filter((s) => {
      if (classFilter !== 'All classes' && s.className !== classFilter) return false;
      if (search && !`${s.name} ${s.className} ${s.subject}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [normalized, classFilter, search]);

  if (selectedStudentId !== null) {
    return <StudentDetailView studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
  }

  return (
    <div className="max-w-[900px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-[#3B3F6E]">Students</h2>
        <div className="relative">
          <button
            onClick={() => setShowClassFilter((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#3B3F6E] text-[#3B3F6E] text-[13px] font-medium bg-transparent cursor-pointer"
          >
            {classFilter}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6L8 10L12 6" />
            </svg>
          </button>
          {showClassFilter && (
            <div className="absolute top-full right-0 mt-1 min-w-[180px] bg-white rounded-xl border border-[#E9E7E2] overflow-hidden z-20 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
              {classOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setClassFilter(opt);
                    setShowClassFilter(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-[#3B3F6E] hover:bg-[#F7F1E6] cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative mb-3">
        <span className="absolute left-4 top-1/2 -translate-y-1/2">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="#9B9B9B" strokeWidth="1.5">
            <circle cx="7.5" cy="7.5" r="5.5" />
            <line x1="11.5" y1="11.5" x2="16" y2="16" strokeLinecap="round" />
          </svg>
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students"
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E0DDD8] bg-transparent text-[13.5px] outline-none focus:border-[#3B3F6E] text-[#111111] placeholder-graphite-40 transition-colors"
        />
      </div>

      {loading ? (
        <div className="bg-transparent rounded-2xl border border-[#E9E7E2] px-6 py-12 text-center">
          <p className="text-[13px] text-graphite-40">Loading students...</p>
        </div>
      ) : error ? (
        <div className="bg-transparent rounded-2xl border border-[#E9E7E2] px-6 py-12 text-center">
          <p className="text-[15px] font-semibold text-[#3B3F6E] mb-2">Couldn&apos;t load students.</p>
          <p className="text-[13px] text-graphite-40">{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-[170px] h-[140px] rounded-2xl bg-[#DCD8D8] flex items-center justify-center mb-4">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" stroke="#3B3F6E" strokeWidth="2" strokeLinecap="round">
              <circle cx="36" cy="18" r="10" />
              <path d="M36 28V48" />
              <path d="M24 38L36 48L48 38" />
              <circle cx="14" cy="48" r="7" />
              <circle cx="58" cy="48" r="7" />
              <path d="M14 55V64" />
              <path d="M58 55V64" />
            </svg>
          </div>
          <p className="text-sm text-[#1A1A1A] mb-4">No students connected yet.</p>
          <button className="px-8.25 py-3.5 rounded-xl border border-indigo text-indigo text-[15px] leading-none font-medium cursor-pointer">
            Share your school code
          </button>
        </div>
      ) : (
        <div className="bg-transparent rounded-2xl border border-[#E9E7E2] overflow-hidden">
          {filtered.map((s: any, i: number) => (
            <button
              key={s.id || i}
              onClick={() => setSelectedStudentId(s.id)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-[#F7F1E6] transition-colors cursor-pointer ${i < filtered.length - 1 ? 'border-b border-[#DDDAD3]' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#3B3F6E] text-white text-[18px] font-semibold flex items-center justify-center">
                  {s.initials}
                </div>
                <div>
                  <p className="text-[30px] leading-tight font-semibold text-[#2B2B2F]">{s.name}</p>
                  <p className="text-[24px] leading-tight text-graphite-40">
                    {s.className}{s.subject ? ` · ${s.subject}` : ''} · Last active: {s.lastActive}
                  </p>
                </div>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  s.signal === 'green' ? 'bg-[#5FAE63]' : s.signal === 'amber' ? 'bg-[#DDA047]' : 'bg-[#8F95CD]'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeacherInsightsBackendView() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const res = await getTeacherDashboard();
      setData('data' in res ? res.data || null : null);
    })();
  }, []);
  return (
    <div className="max-w-[900px]">
      <h2 className="text-2xl font-semibold text-[#3B3F6E] mb-5">Insights</h2>
      <pre className="bg-white rounded-2xl border border-[#E9E7E2] p-5 text-[12px] text-graphite-60 overflow-auto">
        {JSON.stringify(data || {}, null, 2)}
      </pre>
    </div>
  );
}

export function TeacherConnectBackendView() {
  const [qr, setQr] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);

  const refresh = async () => {
    const [qrRes, reqRes] = await Promise.all([getTeacherQr(), getTeacherConnectionRequests()]);
    setQr('data' in qrRes ? qrRes.data || null : null);
    const d = 'data' in reqRes ? reqRes.data : null;
    setRequests(Array.isArray(d) ? d : Array.isArray(d?.requests) ? d.requests : []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const updateReq = async (id: string, action: 'accept' | 'reject') => {
    await updateTeacherConnectionRequest(id, action);
    await refresh();
  };

  return (
    <div className="max-w-[900px]">
      <h2 className="text-2xl font-semibold text-[#3B3F6E] mb-5">Connect</h2>
      <div className="bg-white rounded-2xl border border-[#E9E7E2] p-5 mb-5">
        <p className="text-[13px] font-semibold text-[#2B2B2F] mb-1">Teacher QR</p>
        <p className="text-[12px] text-graphite-40 break-all">{qr?.qr_url || qr?.url || 'QR not available'}</p>
      </div>
      <div className="bg-white rounded-2xl border border-[#E9E7E2] overflow-hidden">
        {requests.length === 0 && <p className="px-6 py-5 text-[13px] text-graphite-40">No pending connection requests.</p>}
        {requests.map((r: any, i: number) => (
          <div key={r.id || i} className={`px-6 py-4 ${i < requests.length - 1 ? 'border-b border-[#EEECEA]' : ''}`}>
            <p className="text-[14px] font-semibold text-[#2B2B2F]">{r.student_name || r.name || 'Student request'}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => updateReq(String(r.id), 'accept')} className="px-3 py-1 rounded-lg bg-[#3B3F6E] text-white text-[12px]">Accept</button>
              <button onClick={() => updateReq(String(r.id), 'reject')} className="px-3 py-1 rounded-lg border border-[#3B3F6E] text-[#3B3F6E] text-[12px]">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherProfileBackendView() {
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getTeacherProfile();
      const p = 'data' in res ? res.data || {} : {};
      setProfile(p);
      setName(p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim());
      setEmail(p.email || '');
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    await updateTeacherProfile({ name, email });
    const res = await getTeacherProfile();
    setProfile('data' in res ? res.data || null : null);
    setSaving(false);
  };

  return (
    <div className="max-w-[780px]">
      <h2 className="text-2xl font-semibold text-[#3B3F6E] mb-5">Profile</h2>
      <div className="bg-white rounded-2xl border border-[#E9E7E2] p-5">
        <label className="text-[12px] text-graphite-60">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 mb-3 border border-[#E0DDD8] rounded-xl px-4 py-3 text-[14px]" />
        <label className="text-[12px] text-graphite-60">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 mb-4 border border-[#E0DDD8] rounded-xl px-4 py-3 text-[14px]" />
        <button onClick={onSave} disabled={saving} className="px-4 py-2 rounded-xl bg-[#3B3F6E] text-white text-[13px] font-semibold">
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {profile && <p className="mt-3 text-[11px] text-graphite-40">Teacher ID: {profile.id || 'n/a'}</p>}
      </div>
    </div>
  );
}
