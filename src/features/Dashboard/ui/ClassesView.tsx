'use client';

import { useState } from 'react';

interface Teacher {
    id: string;
    name: string;
    initials: string;
}

interface StudentData {
    id: string;
    name: string;
    initials: string;
    lastActive: string;
    status: 'active' | 'warning' | 'inactive';
}

interface LessonData {
    id: string;
    name: string;
    assignedDate: string;
    completed: number;
    total: number;
}

interface ClassData {
    id: string;
    name: string;
    teacher: Teacher | null;
    educationLevel: string;
    studentCount: number;
    lessonCount: number;
    lastActive: string;
}

const AVAILABLE_TEACHERS: Teacher[] = [
    { id: '1', name: 'Mrs. Adebayo', initials: 'AD' },
    { id: '2', name: 'Mr. Okonkwo', initials: 'AO' },
    { id: '3', name: 'Mrs. Chukwu', initials: 'MC' },
    { id: '4', name: 'Dr. Eze', initials: 'DE' },
    { id: '5', name: 'Miss Ibrahim', initials: 'MI' },
    { id: '6', name: 'Mr. Bello', initials: 'MB' },
    { id: '7', name: 'Mrs. Oluwaseun', initials: 'MO' },
    { id: '8', name: 'Mr. Adeyemi', initials: 'MA' },
    { id: '9', name: 'Mrs. Nwankwo', initials: 'MN' },
    { id: '10', name: 'Mrs. Adebayo Oluwaseun', initials: 'AO' },
    { id: '11', name: 'Chinedu Okafor', initials: 'CO' },
];

const INITIAL_CLASSES: ClassData[] = [
    { id: '1', name: 'JSS 2A Mathematics', teacher: AVAILABLE_TEACHERS[0], educationLevel: 'Junior Secondary', studentCount: 18, lessonCount: 5, lastActive: 'Today' },
    { id: '2', name: 'SSS 1B English Literature', teacher: AVAILABLE_TEACHERS[1], educationLevel: 'Senior Secondary', studentCount: 22, lessonCount: 7, lastActive: 'Today' },
    { id: '3', name: 'JSS 1A Science', teacher: AVAILABLE_TEACHERS[2], educationLevel: 'Junior Secondary', studentCount: 15, lessonCount: 4, lastActive: '2 days ago' },
    { id: '4', name: 'SSS 3B Chemistry', teacher: AVAILABLE_TEACHERS[3], educationLevel: 'Senior Secondary', studentCount: 20, lessonCount: 8, lastActive: 'Today' },
    { id: '5', name: 'JSS 2C English', teacher: AVAILABLE_TEACHERS[4], educationLevel: 'Junior Secondary', studentCount: 19, lessonCount: 6, lastActive: 'Yesterday' },
    { id: '6', name: 'SSS 1A History', teacher: AVAILABLE_TEACHERS[5], educationLevel: 'Senior Secondary', studentCount: 24, lessonCount: 5, lastActive: 'Today' },
    { id: '7', name: 'JSS 3A Mathematics', teacher: AVAILABLE_TEACHERS[6], educationLevel: 'Junior Secondary', studentCount: 17, lessonCount: 7, lastActive: '3 days ago' },
    { id: '8', name: 'SSS 2B Physics', teacher: AVAILABLE_TEACHERS[7], educationLevel: 'Senior Secondary', studentCount: 21, lessonCount: 6, lastActive: 'Today' },
    { id: '9', name: 'JSS 1B Computer Science', teacher: AVAILABLE_TEACHERS[8], educationLevel: 'Junior Secondary', studentCount: 16, lessonCount: 3, lastActive: 'Yesterday' },
    { id: '10', name: 'JSS 2 Mathematics', teacher: null, educationLevel: 'Junior Secondary', studentCount: 18, lessonCount: 0, lastActive: 'Today' },
];

const MOCK_STUDENTS: StudentData[] = [
    { id: '1', name: 'Chidinma Okafor', initials: 'CO', lastActive: 'Active 2h ago', status: 'active' },
    { id: '2', name: 'Emeka Nwosu', initials: 'EN', lastActive: 'Active 5h ago', status: 'active' },
    { id: '3', name: 'Oluwapelumi Adebayo', initials: 'OA', lastActive: 'Last active 8 days ago', status: 'inactive' },
    { id: '4', name: 'Fatima Ibrahim', initials: 'FI', lastActive: 'Active 1h ago', status: 'active' },
    { id: '5', name: 'Chukwuemeka Obi', initials: 'CO', lastActive: 'Active 3h ago', status: 'active' },
    { id: '6', name: 'Aisha Mohammed', initials: 'AM', lastActive: 'Active 4h ago', status: 'active' },
    { id: '7', name: 'Tunde Bakare', initials: 'TB', lastActive: 'Last active 2 days ago', status: 'warning' },
    { id: '8', name: 'Ngozi Eze', initials: 'NE', lastActive: 'Active 6h ago', status: 'active' },
];

const MOCK_LESSONS: LessonData[] = [
    { id: '1', name: 'Introduction to Algebra', assignedDate: 'Assigned Feb 12, 2025', completed: 14, total: 18 },
    { id: '2', name: 'Linear Equations', assignedDate: 'Assigned Feb 10, 2025', completed: 12, total: 18 },
    { id: '3', name: 'Quadratic Functions', assignedDate: 'Assigned Feb 8, 2025', completed: 16, total: 18 },
    { id: '4', name: 'Coordinate Geometry', assignedDate: 'Assigned Feb 5, 2025', completed: 15, total: 18 },
    { id: '5', name: 'Basic Trigonometry', assignedDate: 'Assigned Feb 3, 2025', completed: 13, total: 18 },
    { id: '6', name: 'Number Systems', assignedDate: 'Assigned Feb 1, 2025', completed: 17, total: 18 },
];

const EDUCATION_LEVELS = ['Primary', 'Secondary', 'Tertiary'];
const SUBJECTS = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Computer Studies', 'Agricultural Science'];

// ─── Main Component ───

export function ClassesView() {
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [hasClasses, setHasClasses] = useState(true);
    const [classes, setClasses] = useState<ClassData[]>(INITIAL_CLASSES);

    const selectedClass = classes.find(c => c.id === selectedClassId) || null;

    if (selectedClass) {
        return (
            <>
                <ClassDetailView
                    classData={selectedClass}
                    onBack={() => setSelectedClassId(null)}
                    onEdit={() => setShowEditModal(true)}
                    onArchive={() => setShowArchiveModal(true)}
                />
                {showEditModal && (
                    <EditClassModal
                        classData={selectedClass}
                        onClose={() => setShowEditModal(false)}
                        onSave={(updated) => {
                            setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
                            setShowEditModal(false);
                        }}
                    />
                )}
                {showArchiveModal && (
                    <ArchiveClassModal
                        classData={selectedClass}
                        onClose={() => setShowArchiveModal(false)}
                        onConfirm={() => {
                            setClasses(prev => prev.filter(c => c.id !== selectedClass.id));
                            setSelectedClassId(null);
                            setShowArchiveModal(false);
                        }}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <div className="w-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">Classes</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
                    >
                        <span className="text-[15px] leading-none">+</span>
                        Create class
                    </button>
                </div>

                {hasClasses && classes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                        {classes.map(c => (
                            <ClassCard
                                key={c.id}
                                classData={c}
                                onClick={() => setSelectedClassId(c.id)}
                            />
                        ))}
                    </div>
                ) : (
                    <ClassesEmptyState onCreateClick={() => setShowCreateModal(true)} />
                )}
            </div>

            {showCreateModal && (
                <CreateClassModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={(newClass) => {
                        setClasses(prev => [...prev, newClass]);
                        setShowCreateModal(false);
                    }}
                />
            )}

            <button
                onClick={() => setHasClasses(!hasClasses)}
                className="fixed bottom-6 right-6 px-4 py-2 bg-white text-[#3B3F6E] rounded-full text-[11px] font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] z-50 border border-[#E9E7E2] hover:bg-gray-50 transition-colors cursor-pointer"
            >
                Toggle Empty/Populated
            </button>
        </>
    );
}

// ─── Class Card ───

function ClassCard({ classData, onClick }: { classData: ClassData; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-5 border border-[#E9E7E2] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow relative"
        >
            <h3 className="text-[15px] font-bold text-[#3B3F6E] mb-3">{classData.name}</h3>

            {classData.teacher && (
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-[24px] h-[24px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[9px] font-bold shrink-0">
                        {classData.teacher.initials}
                    </div>
                    <span className="text-[13px] text-[#3B3F6E] font-medium">{classData.teacher.name}</span>
                </div>
            )}

            <div className="inline-block px-3 py-1 rounded-full bg-[#EAE8F2] text-[11px] font-semibold text-[#3B3F6E] mb-3">
                {classData.educationLevel}
            </div>

            <p className="text-[12px] text-graphite-60 mb-1">
                {classData.studentCount} students &middot; {classData.lessonCount} lessons assigned
            </p>
            <p className="text-[12px] text-graphite-40">
                Last active: {classData.lastActive}
            </p>

            <button
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-4 right-4 text-graphite-40 hover:text-[#3B3F6E] cursor-pointer p-1"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="8" cy="3" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="8" cy="13" r="1.5" />
                </svg>
            </button>
        </div>
    );
}

// ─── Empty State ───

function ClassesEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <div className="w-[60px] h-[48px] bg-[#EAE8F2] rounded-lg flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A29ECA" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <line x1="8" y1="10" x2="16" y2="10" strokeLinecap="round" />
                    <line x1="8" y1="14" x2="13" y2="14" strokeLinecap="round" />
                </svg>
            </div>
            <p className="text-[14px] text-graphite-60 font-medium mb-5">No classes yet. Create your first class.</p>
            <button
                onClick={onCreateClick}
                className="flex items-center gap-2 px-5 py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
            >
                <span className="text-[15px] leading-none">+</span>
                Create class
            </button>
        </div>
    );
}

// ─── Class Detail View ───

function ClassDetailView({ classData, onBack, onEdit, onArchive }: {
    classData: ClassData;
    onBack: () => void;
    onEdit: () => void;
    onArchive: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const hasTeacher = classData.teacher !== null;

    const filteredStudents = MOCK_STUDENTS.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full flex flex-col gap-5">
            {/* Back link */}
            <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-[#3B3F6E] font-medium hover:opacity-70 cursor-pointer self-start -mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 12L6 8L10 4" />
                </svg>
                Classes
            </button>

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-[22px] font-bold text-[#3B3F6E] tracking-tight">{classData.name}</h1>
                    {hasTeacher ? (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-[22px] h-[22px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[8px] font-bold">
                                {classData.teacher!.initials}
                            </div>
                            <span className="text-[13px] text-graphite-60 font-medium">Mrs. Oluwaseun Adeyemi</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[13px] text-[#E59842] font-medium">No teacher assigned</span>
                            <button className="text-[13px] text-graphite-40 hover:text-[#3B3F6E] cursor-pointer">Assign teacher</button>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onEdit} className="px-4 py-2 border border-[#3B3F6E] rounded-lg text-[13px] font-semibold text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer">
                        Edit class
                    </button>
                    <button onClick={onArchive} className="px-4 py-2 border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-graphite-60 hover:bg-black/5 transition-colors cursor-pointer">
                        Archive
                    </button>
                </div>
            </div>

            {/* Main: Students + Sidebar */}
            <div className="flex gap-6">
                {/* Left: Students list */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Students ({classData.studentCount})</h2>

                    <div className="relative mb-4">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#A29ECA" strokeWidth="1.5" className="absolute left-4 top-1/2 -translate-y-1/2">
                            <circle cx="7" cy="7" r="4.5" />
                            <path d="M10.5 10.5L14 14" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#E9E7E2] rounded-xl text-[13px] text-[#3B3F6E] placeholder:text-graphite-40 focus:outline-none focus:border-[#3B3F6E] transition-colors"
                        />
                    </div>

                    <div className="flex flex-col">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6]">
                                <div className="flex items-center gap-3">
                                    <div className="w-[8px] h-[8px] rounded-full bg-[#3B3F6E] shrink-0" />
                                    <span className="text-[13px] font-medium text-[#3B3F6E]">{student.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[12px] text-graphite-40">{student.lastActive}</span>
                                    <div className={`w-[8px] h-[8px] rounded-full shrink-0 ${
                                        student.status === 'active' ? 'bg-[#5A9B6A]' :
                                        student.status === 'warning' ? 'bg-[#E59842]' : 'bg-[#D4534A]'
                                    }`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="mt-4 px-4 py-2 border border-[#E9E7E2] rounded-lg text-[13px] font-medium text-[#3B3F6E] hover:bg-black/5 transition-colors cursor-pointer">
                        Add student
                    </button>
                </div>

                {/* Right: Sidebar */}
                <div className="w-[280px] shrink-0 flex flex-col gap-4">
                    {hasTeacher ? (
                        <>
                            <div className="bg-[#FFFAF0] rounded-xl p-5 border-l-4 border-l-[#E5C566]">
                                <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-4">Overview</h3>
                                <div className="flex flex-col gap-3">
                                    <SidebarStat label="Active students" value="18 of 18 students active this week" />
                                    <SidebarStat label="Completion rate" value="Most students completing 70-85% of lessons" />
                                    <SidebarStat label="Most active day" value="Tuesdays and Thursdays" />
                                </div>
                            </div>

                            <div className="bg-[#FFF5F0] rounded-xl p-5 border-l-4 border-l-[#D4534A]">
                                <h3 className="text-[13px] font-bold text-[#3B3F6E] mb-4">Students who may need support</h3>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">Oluwapelumi Adebayo</p>
                                        <p className="text-[11px] text-graphite-40">Last active 8 days ago</p>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">Tunde Bakare</p>
                                        <p className="text-[11px] text-graphite-40">Last active 2 days ago</p>
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#3B3F6E]">Emeka Nwosu</p>
                                        <p className="text-[11px] text-graphite-40 italic">Completion rate below 50%</p>
                                    </div>
                                </div>
                                <button className="mt-3 text-[12px] font-medium text-[#3B3F6E] hover:underline cursor-pointer">View full insights</button>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#FFF5F0] border border-[#F0D9CC] rounded-xl p-5">
                            <p className="text-[13px] font-bold text-[#3B3F6E] mb-2">This class has no teacher assigned.</p>
                            <p className="text-[12px] text-graphite-60 mb-4 leading-relaxed">Students in this class won&apos;t receive lessons until a teacher is assigned.</p>
                            <button className="w-full py-[10px] bg-[#3B3F6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer">
                                Assign a teacher
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Assigned lessons */}
            <div className="mt-2">
                <h2 className="text-[15px] font-bold text-[#3B3F6E] mb-4">Assigned lessons ({MOCK_LESSONS.length})</h2>
                <div className="flex flex-col">
                    {MOCK_LESSONS.map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between py-3 border-b border-[#F0EDE6]">
                            <div>
                                <p className="text-[13px] font-medium text-[#3B3F6E]">{lesson.name}</p>
                                <p className="text-[11px] text-graphite-40">{lesson.assignedDate}</p>
                            </div>
                            <span className="text-[12px] text-graphite-60 shrink-0">{lesson.completed} of {lesson.total} completed</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SidebarStat({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] text-graphite-40 mb-[2px]">{label}</p>
            <p className="text-[13px] font-medium text-[#3B3F6E]">{value}</p>
        </div>
    );
}

// ─── Create Class Modal ───

function CreateClassModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: ClassData) => void }) {
    const [name, setName] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [educationLevel, setEducationLevel] = useState<string | null>(null);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [academicYear, setAcademicYear] = useState('');
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

    const isValid = name.trim().length > 0;

    const handleCreate = () => {
        if (!isValid) return;
        onCreate({
            id: Date.now().toString(),
            name: name.trim(),
            teacher: selectedTeacher,
            educationLevel: educationLevel || 'Secondary',
            studentCount: 0,
            lessonCount: 0,
            lastActive: 'Just now',
        });
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#FDFBF9] rounded-2xl w-full max-w-[560px] p-8 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-graphite-60 hover:text-[#3B3F6E] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 5L15 15M15 5L5 15" />
                    </svg>
                </button>

                <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">Create a class</h2>

                <div className="flex flex-col gap-5">
                    <input
                        type="text"
                        placeholder="e.g. Grade 7 Mathematics"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] placeholder:text-graphite-40 bg-white focus:outline-none focus:border-[#3B3F6E] transition-colors"
                    />

                    {/* Teacher select */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer focus:outline-none focus:border-[#3B3F6E] transition-colors"
                        >
                            {selectedTeacher ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-[24px] h-[24px] rounded-full bg-[#5A9B6A] flex items-center justify-center text-white text-[9px] font-bold">
                                        {selectedTeacher.initials}
                                    </div>
                                    <span className="text-[#3B3F6E] font-medium">{selectedTeacher.name}</span>
                                </div>
                            ) : (
                                <span className="text-graphite-40">Select a teacher</span>
                            )}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showTeacherDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>

                        {showTeacherDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10 max-h-[200px] overflow-y-auto">
                                {AVAILABLE_TEACHERS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedTeacher(t); setShowTeacherDropdown(false); }}
                                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#F7F1E6] text-left cursor-pointer transition-colors"
                                    >
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[9px] font-bold">
                                            {t.initials}
                                        </div>
                                        <span className="text-[13px] font-medium text-[#3B3F6E]">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Education level */}
                    <div>
                        <label className="text-[13px] font-semibold text-[#3B3F6E] mb-3 block">Education level</label>
                        <div className="flex gap-2">
                            {EDUCATION_LEVELS.map(level => (
                                <button
                                    key={level}
                                    onClick={() => setEducationLevel(educationLevel === level ? null : level)}
                                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                                        educationLevel === level
                                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                            : 'bg-white text-[#3B3F6E] border-[#E9E7E2] hover:border-[#3B3F6E]'
                                    }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div>
                        <label className="text-[13px] font-semibold text-[#3B3F6E] mb-3 block">Subject(s)</label>
                        <div className="flex flex-wrap gap-2">
                            {SUBJECTS.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubjects(prev =>
                                        prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
                                    )}
                                    className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                                        selectedSubjects.includes(subject)
                                            ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                            : 'bg-white text-[#3B3F6E] border-[#E9E7E2] hover:border-[#3B3F6E]'
                                    }`}
                                >
                                    {subject}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Academic year */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-[13px] font-semibold text-[#3B3F6E]">Academic year / Term</label>
                            <span className="text-[10px] font-bold text-white bg-[#5A9B6A] px-2 py-[2px] rounded-full">Optional</span>
                        </div>
                        <input
                            type="text"
                            value={academicYear}
                            onChange={e => setAcademicYear(e.target.value)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] bg-white focus:outline-none focus:border-[#3B3F6E] transition-colors"
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={!isValid}
                        className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-colors ${
                            isValid
                                ? 'bg-[#3B3F6E] text-white hover:bg-[#2C2F52] cursor-pointer'
                                : 'bg-[#B8B6C8] text-white cursor-not-allowed'
                        }`}
                    >
                        Create class
                    </button>
                    <button onClick={onClose} className="text-[13px] text-graphite-60 font-medium hover:text-[#3B3F6E] cursor-pointer text-center">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Class Modal ───

function EditClassModal({ classData, onClose, onSave }: { classData: ClassData; onClose: () => void; onSave: (c: ClassData) => void }) {
    const [name, setName] = useState(classData.name);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(classData.teacher);
    const [educationLevel, setEducationLevel] = useState(
        classData.educationLevel.includes('Junior') ? 'JSS' :
        classData.educationLevel.includes('Senior') ? 'SSS' : 'Primary'
    );
    const [subjects, setSubjects] = useState<string[]>(['Mathematics', 'English']);
    const [academicYear, setAcademicYear] = useState('2024/2025');
    const [term, setTerm] = useState('First Term');
    const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
    const [showTermDropdown, setShowTermDropdown] = useState(false);

    const editLevels = ['Primary', 'JSS', 'SSS'];
    const terms = ['First Term', 'Second Term', 'Third Term'];

    const handleSave = () => {
        const levelMap: Record<string, string> = { 'Primary': 'Primary', 'JSS': 'Junior Secondary', 'SSS': 'Senior Secondary' };
        onSave({
            ...classData,
            name,
            teacher: selectedTeacher,
            educationLevel: levelMap[educationLevel] || classData.educationLevel,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-[#FDFBF9] rounded-2xl w-full max-w-[560px] p-8 relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 text-graphite-60 hover:text-[#3B3F6E] cursor-pointer">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M5 5L15 15M15 5L5 15" />
                    </svg>
                </button>

                <h2 className="text-[18px] font-bold text-[#3B3F6E] text-center mb-8">Edit class</h2>

                <div className="flex flex-col gap-5">
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] bg-white focus:outline-none focus:border-[#3B3F6E] transition-colors"
                    />

                    {/* Teacher dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer"
                        >
                            {selectedTeacher ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-[24px] h-[24px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[9px] font-bold">
                                        {selectedTeacher.initials}
                                    </div>
                                    <span className="text-[#3B3F6E] font-medium">{selectedTeacher.name}</span>
                                </div>
                            ) : (
                                <span className="text-graphite-40">Select a teacher</span>
                            )}
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showTeacherDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>

                        {showTeacherDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10 max-h-[200px] overflow-y-auto">
                                {AVAILABLE_TEACHERS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedTeacher(t); setShowTeacherDropdown(false); }}
                                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-[#F7F1E6] text-left cursor-pointer transition-colors"
                                    >
                                        <div className="w-[24px] h-[24px] rounded-full bg-[#EAE8F2] flex items-center justify-center text-[#3B3F6E] text-[9px] font-bold">
                                            {t.initials}
                                        </div>
                                        <span className="text-[13px] font-medium text-[#3B3F6E]">{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Education level */}
                    <div className="flex gap-2">
                        {editLevels.map(level => (
                            <button
                                key={level}
                                onClick={() => setEducationLevel(level)}
                                className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-colors cursor-pointer ${
                                    educationLevel === level
                                        ? 'bg-[#3B3F6E] text-white border-[#3B3F6E]'
                                        : 'bg-white text-[#3B3F6E] border-[#E9E7E2] hover:border-[#3B3F6E]'
                                }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    {/* Subjects as removable chips */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {subjects.map(subject => (
                            <span key={subject} className="flex items-center gap-1 px-3 py-[6px] bg-[#3B3F6E] text-white rounded-full text-[12px] font-medium">
                                {subject}
                                <button
                                    onClick={() => setSubjects(prev => prev.filter(s => s !== subject))}
                                    className="ml-1 hover:opacity-70 cursor-pointer"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 3L9 9M9 3L3 9" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                        <button className="px-3 py-[6px] border border-[#E9E7E2] rounded-full text-[12px] font-medium text-[#3B3F6E] hover:border-[#3B3F6E] cursor-pointer transition-colors">
                            + Add subject
                        </button>
                    </div>

                    {/* Academic year */}
                    <input
                        type="text"
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] text-[#3B3F6E] bg-white focus:outline-none focus:border-[#3B3F6E] transition-colors"
                    />

                    {/* Term dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTermDropdown(!showTermDropdown)}
                            className="w-full px-4 py-3 border border-[#E9E7E2] rounded-xl text-[14px] bg-white flex items-center justify-between cursor-pointer"
                        >
                            <span className="text-[#3B3F6E] font-medium">{term}</span>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#9a9ccb" strokeWidth="2" strokeLinecap="round" className={`transition-transform ${showTermDropdown ? 'rotate-180' : ''}`}>
                                <path d="M4 6L8 10L12 6" />
                            </svg>
                        </button>

                        {showTermDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E9E7E2] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] z-10">
                                {terms.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { setTerm(t); setShowTermDropdown(false); }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-medium text-[#3B3F6E] hover:bg-[#F7F1E6] cursor-pointer transition-colors first:rounded-t-xl last:rounded-b-xl"
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full py-3 rounded-xl text-[14px] font-semibold bg-[#B8B6C8] text-white hover:bg-[#3B3F6E] transition-colors cursor-pointer"
                    >
                        Save changes
                    </button>
                    <button onClick={onClose} className="text-[13px] text-graphite-60 font-medium hover:text-[#3B3F6E] cursor-pointer text-center">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Archive Class Modal ───

function ArchiveClassModal({ classData, onClose, onConfirm }: { classData: ClassData; onClose: () => void; onConfirm: () => void }) {
    return (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-[420px] p-8 text-center" onClick={e => e.stopPropagation()}>
                <div className="w-[56px] h-[56px] mx-auto mb-4 bg-[#FFF3E0] rounded-full flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 20H22L12 2Z" stroke="#E59842" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="12" y1="9" x2="12" y2="13" stroke="#E59842" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="12" cy="16" r="1" fill="#E59842" />
                    </svg>
                </div>

                <h2 className="text-[18px] font-bold text-[#3B3F6E] mb-1">Archive this class?</h2>
                <p className="text-[15px] font-semibold text-[#3B3F6E] mb-3">{classData.name}</p>
                <p className="text-[13px] text-graphite-60 mb-6 leading-relaxed">
                    Archiving will remove this class from your active workspace. Teachers and students currently in this class will lose access to class-specific features.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 border border-[#E9E7E2] rounded-xl text-[14px] font-medium text-graphite-60 hover:bg-black/5 transition-colors cursor-pointer"
                    >
                        Archive class
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-[#3B3F6E] text-white rounded-xl text-[14px] font-semibold hover:bg-[#2C2F52] transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-[11px] text-graphite-40 mt-4">You can restore archived classes from Settings.</p>
            </div>
        </div>
    );
}
