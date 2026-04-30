'use client';

import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'next-auth/react';
import QRCode from 'react-qr-code';
import {
    getTeacherConnectionRequests,
    getTeacherQr,
    updateTeacherConnectionRequest,
} from '../api/teacher';

type ConnectScreen = 'list' | 'qr-full';

interface ConnectionRequestItem {
    id: string;
    name: string;
    initials: string;
    classInfo: string;
    time: string;
    status: 'pending' | 'accepted' | 'rejected';
}

export function ConnectView() {
    const [screen, setScreen] = useState<ConnectScreen>('list');
    const [qrData, setQrData] = useState<any>(null);
    const [requests, setRequests] = useState<ConnectionRequestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const refresh = async () => {
        const [qrRes, reqRes] = await Promise.all([getTeacherQr(), getTeacherConnectionRequests()]);
        const authExpired = Boolean((qrRes as any)?.authExpired) || Boolean((reqRes as any)?.authExpired);
        const qrErrorText = String((qrRes as any)?.error || '');
        const reqErrorText = String((reqRes as any)?.error || '');
        const hasTokenError = /invalid|expired|unauthorized|token/i.test(`${qrErrorText} ${reqErrorText}`);
        if (authExpired || hasTokenError) {
            await signOut({ callbackUrl: '/login/teacher' });
            return;
        }

        const qr = 'data' in qrRes ? qrRes.data : null;
        const reqPayload = 'data' in reqRes ? reqRes.data : null;
        const reqList = Array.isArray(reqPayload) ? reqPayload : Array.isArray(reqPayload?.requests) ? reqPayload.requests : [];
        const qrError = 'error' in qrRes ? qrRes.error : null;
        const reqError = 'error' in reqRes ? reqRes.error : null;

        setQrData(qr || null);
        setFetchError(qrError || reqError || null);
        setRequests(
            reqList.map((r: any, i: number) => {
                const name = r.student_name || r.name || `Student ${i + 1}`;
                const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0]?.toUpperCase() || '')
                    .join('') || 'ST';
                return {
                    id: String(r.id ?? `req-${i}`),
                    name,
                    initials,
                    classInfo: r.class_name || r.class || 'Class not specified',
                    time: r.created_at || r.requested_at || 'Recently',
                    status: (r.status === 'accepted' || r.status === 'rejected') ? r.status : 'pending',
                } as ConnectionRequestItem;
            }),
        );
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            await refresh();
            if (mounted) setLoading(false);
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const handleRequestAction = async (id: string, action: 'accept' | 'reject') => {
        setActingId(id);
        await updateTeacherConnectionRequest(id, action);
        await refresh();
        setActingId(null);
    };

    const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests]);

    const handleNewMessage = () => {
        setNotice('Messaging composer is not enabled yet for this backend flow.');
        setTimeout(() => setNotice(null), 2500);
    };

    if (screen === 'qr-full') {
        return <FullQRView qrData={qrData} onBack={() => setScreen('list')} />;
    }

    return (
        <ConnectList
            qrData={qrData}
            pendingRequests={pendingRequests}
            loading={loading}
            actingId={actingId}
            notice={notice}
            fetchError={fetchError}
            onViewQR={() => setScreen('qr-full')}
            onNewMessage={handleNewMessage}
            onAccept={(id) => handleRequestAction(id, 'accept')}
            onReject={(id) => handleRequestAction(id, 'reject')}
        />
    );
}

function ConnectList({
    qrData,
    pendingRequests,
    loading,
    actingId,
    notice,
    fetchError,
    onViewQR,
    onNewMessage,
    onAccept,
    onReject,
}: {
    qrData: any;
    pendingRequests: ConnectionRequestItem[];
    loading: boolean;
    actingId: string | null;
    notice: string | null;
    fetchError: string | null;
    onViewQR: () => void;
    onNewMessage: () => void;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}) {
    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-semibold text-[#3B3F6E] leading-tight">Connect</h2>
                <button
                    onClick={onNewMessage}
                    className="flex items-center gap-2 px-5 py-2.5 border border-[#3B3F6E] rounded-xl text-[13px] font-semibold text-[#3B3F6E] bg-white hover:bg-indigo-5 transition-colors cursor-pointer"
                >
                    <span className="text-[14px]">↗</span>
                    New message
                </button>
            </div>

            {notice && (
                <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#E8E4DC] text-[#3B3F6E] text-[12px] font-medium">
                    {notice}
                </div>
            )}
            {fetchError && (
                <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#FCEAE7] text-[#9D3A2C] text-[12px] font-medium">
                    {fetchError}
                </div>
            )}

            <QRSection qrData={qrData} onViewFullQR={onViewQR} />

            <section>
                <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Messages</h3>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="h-[78px] rounded-2xl bg-[#EDEBE6] animate-pulse" />
                        ))}
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="bg-[#F2F2F2] rounded-2xl border border-[#E9E7E2] px-6 py-14 text-center">
                        <p className="text-[15px] font-semibold text-[#3B3F6E] mb-1.5">No messages yet.</p>
                        <p className="text-[13px] text-graphite-40 mb-5">Send a message to a student to get started.</p>
                        <button
                            onClick={onNewMessage}
                            className="px-6 py-2.5 rounded-xl bg-[#3B3F6E] text-white text-[13px] font-semibold hover:bg-[#2E3259] transition-colors cursor-pointer"
                        >
                            New message
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {pendingRequests.map((req) => (
                            <div key={req.id} className="bg-white rounded-2xl border border-[#E9E7E2] px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-[#3B3F6E] text-white text-[12px] font-bold flex items-center justify-center shrink-0">
                                        {req.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-[#2B2B2F] truncate">{req.name}</p>
                                        <p className="text-[12px] text-graphite-40 truncate">{req.classInfo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        disabled={actingId === req.id}
                                        onClick={() => onAccept(req.id)}
                                        className="px-3 py-1.5 rounded-lg bg-[#3B3F6E] text-white text-[12px] font-medium hover:bg-[#2E3259] transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        disabled={actingId === req.id}
                                        onClick={() => onReject(req.id)}
                                        className="px-3 py-1.5 rounded-lg border border-[#3B3F6E] text-[#3B3F6E] text-[12px] font-medium hover:bg-indigo-5 transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function QRSection({ qrData, onViewFullQR }: { qrData: any; onViewFullQR: () => void }) {
    const [classOpen, setClassOpen] = useState(false);
    const classes = Array.isArray(qrData?.classes) ? qrData.classes : [];
    const [selectedClass, setSelectedClass] = useState<string>('');
    const classCode =
        qrData?.class_code ||
        qrData?.code ||
        qrData?.teacher_code ||
        qrData?.classCode ||
        qrData?.teacherCode ||
        qrData?.connection_code ||
        qrData?.connect_code ||
        '';
    const isIndependentTeacher =
        qrData?.independent === true ||
        qrData?.teaching_mode === 'independent' ||
        qrData?.teachingMode === 'independent' ||
        qrData?.teacher_type === 'independent' ||
        (!qrData?.school_id && !qrData?.schoolId && !qrData?.class_name && classes.length === 0);
    const fallbackClassLabel = isIndependentTeacher ? 'Independent Teacher' : 'Class not available';

    useEffect(() => {
        if (
            !selectedClass ||
            selectedClass === 'Class not available' ||
            selectedClass === 'Independent Teacher'
        ) {
            const first = classes[0]?.name || classes[0] || qrData?.class_name || fallbackClassLabel;
            setSelectedClass(first);
        }
    }, [classes, qrData, selectedClass, fallbackClassLabel]);

    return (
        <section className="mb-8">
            <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Share your class QR</h3>
            <div className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5 flex items-start gap-5">
                <div className="w-[72px] h-[72px] border-2 border-[#3B3F6E] rounded-lg flex items-center justify-center shrink-0 bg-white p-1">
                    <QRCode
                        value={classCode || 'NEVO-CLASS-CODE'}
                        size={52}
                        fgColor="#3B3F6E"
                        bgColor="#FFFFFF"
                    />
                </div>
                <div className="flex flex-col">
                    <p className="text-[13.5px] text-[#2B2B2F] mb-2">Let students scan this to connect with you.</p>
                    <div className="relative mb-2">
                        <button
                            onClick={() => setClassOpen((v) => !v)}
                            className="flex items-center gap-1.5 px-4 py-2 border border-[#D4D0CA] rounded-lg text-[12.5px] font-medium text-[#3B3F6E] bg-[#F6F5F8] hover:bg-white transition-colors cursor-pointer"
                        >
                            Class: {selectedClass}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B3F6E" strokeWidth="1.5" className={`transition-transform ${classOpen ? 'rotate-180' : ''}`}>
                                <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        {classOpen && classes.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-[#E0DDD8] rounded-xl shadow-lg py-1 min-w-[220px] z-10">
                                {classes.map((cls: any, idx: number) => {
                                    const className = cls?.name || cls || `Class ${idx + 1}`;
                                    return (
                                        <button
                                            key={`${className}-${idx}`}
                                            onClick={() => {
                                                setSelectedClass(className);
                                                setClassOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-[13px] font-medium text-graphite-60 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            {className}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onViewFullQR}
                        className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer text-left w-fit"
                    >
                        View full QR
                    </button>
                </div>
            </div>
        </section>
    );
}

function FullQRView({ qrData, onBack }: { qrData: any; onBack: () => void }) {
    const [copied, setCopied] = useState(false);
    const teacherCode =
        qrData?.class_code ||
        qrData?.code ||
        qrData?.teacher_code ||
        qrData?.classCode ||
        qrData?.teacherCode ||
        qrData?.connection_code ||
        qrData?.connect_code ||
        '';

    const handleCopy = () => {
        if (!teacherCode) return;
        navigator.clipboard.writeText(teacherCode).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[14px] text-graphite-60 font-medium mb-4 hover:text-[#3B3F6E] transition-colors cursor-pointer w-fit"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Connect
            </button>

            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">Your QR Code</h2>
            <p className="text-[13px] text-graphite-60 mb-8">Students scan this to connect with you.</p>

            <div className="flex flex-col items-center">
                <div className="border-2 border-dashed border-[#3B3F6E] rounded-2xl p-8 mb-6 flex flex-col items-center">
                    <QRCode
                        value={teacherCode || 'NEVO-CLASS-CODE'}
                        size={160}
                        fgColor="#3B3F6E"
                        bgColor="#FFFFFF"
                    />
                    <p className="text-[15px] font-semibold text-[#2B2B2F] mt-5">Teacher Connect</p>
                </div>

                <p className="text-[11px] font-bold text-graphite-40 tracking-wider uppercase mb-3">Or share your code instead</p>
                <div className="flex items-center gap-2">
                    <span className="text-[18px] font-bold text-[#2B2B2F] tracking-wider">{teacherCode || 'Unavailable'}</span>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
                        title="Copy code"
                        disabled={!teacherCode}
                    >
                        {copied ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#5B8A6E" strokeWidth="1.5">
                                <path d="M3 8.5L6 11.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#6B6B6B" strokeWidth="1.3">
                                <rect x="5" y="5" width="8" height="8" rx="1.5" />
                                <path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
