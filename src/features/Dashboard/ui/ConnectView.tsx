'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import {
    getTeacherConnectionRequests,
    getTeacherQr,
    updateTeacherConnectionRequest,
} from '../api/teacher';
import { useAuthGuard } from '@/shared/lib';

type ConnectScreen = 'list' | 'qr-full';

interface ConnectionRequestItem {
    id: string;
    name: string;
    initials: string;
    classInfo: string;
    status: 'pending' | 'accepted' | 'rejected';
}

interface TeacherQrClassItem {
    class_id: string;
    class_name: string;
    class_code: string;
}

export function ConnectView() {
    const [screen, setScreen] = useState<ConnectScreen>('list');
    const [qrData, setQrData] = useState<any>(null);
    const [requests, setRequests] = useState<ConnectionRequestItem[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const guardAuth = useAuthGuard('teacher');

    const classItems = useMemo<TeacherQrClassItem[]>(
        () =>
            Array.isArray(qrData?.classes)
                ? qrData.classes
                      .map((item: any) => ({
                          class_id: String(item?.class_id || ''),
                          class_name: String(item?.class_name || item?.name || 'Class'),
                          class_code: String(item?.class_code || ''),
                      }))
                      .filter((item: TeacherQrClassItem) => item.class_id && item.class_code)
                : [],
        [qrData],
    );

    useEffect(() => {
        if (!classItems.length) {
            setSelectedClassId(null);
            return;
        }
        if (!selectedClassId || !classItems.some((item) => item.class_id === selectedClassId)) {
            setSelectedClassId(classItems[0].class_id);
        }
    }, [classItems, selectedClassId]);

    const refresh = async () => {
        const [qrRes, reqRes] = await Promise.all([getTeacherQr(), getTeacherConnectionRequests()]);
        if (guardAuth([qrRes as any, reqRes as any])) return;

        const qr = 'data' in qrRes ? qrRes.data : null;
        const reqPayload = 'data' in reqRes ? reqRes.data : null;
        const reqList = Array.isArray(reqPayload)
            ? reqPayload
            : Array.isArray(reqPayload?.requests)
              ? reqPayload.requests
              : [];
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
                    id: String(r.connection_id ?? r.id ?? `req-${i}`),
                    name,
                    initials,
                    classInfo: r.class_name || r.class || 'Class not specified',
                    status: (r.status === 'accepted' || r.status === 'rejected') ? r.status : 'pending',
                } as ConnectionRequestItem;
            }),
        );
    };

    useEffect(() => {
        let mounted = true;
        void (async () => {
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
    const selectedClass = classItems.find((item) => item.class_id === selectedClassId) || null;
    const hasActiveClasses = Boolean(qrData?.has_active_classes) && classItems.length > 0;

    const handleNewMessage = () => {
        setNotice('Messaging composer is not enabled yet for this backend flow.');
        setTimeout(() => setNotice(null), 2500);
    };

    if (screen === 'qr-full') {
        return (
            <FullQRView
                selectedClass={selectedClass}
                hasActiveClasses={hasActiveClasses}
                emptyStateMessage={qrData?.empty_state_message}
                onBack={() => setScreen('list')}
            />
        );
    }

    return (
        <ConnectList
            selectedClassId={selectedClassId}
            selectedClass={selectedClass}
            classItems={classItems}
            hasActiveClasses={hasActiveClasses}
            emptyStateMessage={qrData?.empty_state_message}
            pendingRequests={pendingRequests}
            loading={loading}
            actingId={actingId}
            notice={notice}
            fetchError={fetchError}
            onSelectClass={setSelectedClassId}
            onViewQR={() => setScreen('qr-full')}
            onNewMessage={handleNewMessage}
            onAccept={(id) => handleRequestAction(id, 'accept')}
            onReject={(id) => handleRequestAction(id, 'reject')}
        />
    );
}

function ConnectList({
    selectedClassId,
    selectedClass,
    classItems,
    hasActiveClasses,
    emptyStateMessage,
    pendingRequests,
    loading,
    actingId,
    notice,
    fetchError,
    onSelectClass,
    onViewQR,
    onNewMessage,
    onAccept,
    onReject,
}: {
    selectedClassId: string | null;
    selectedClass: TeacherQrClassItem | null;
    classItems: TeacherQrClassItem[];
    hasActiveClasses: boolean;
    emptyStateMessage?: string | null;
    pendingRequests: ConnectionRequestItem[];
    loading: boolean;
    actingId: string | null;
    notice: string | null;
    fetchError: string | null;
    onSelectClass: (classId: string | null) => void;
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

            {notice ? (
                <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#E8E4DC] text-[#3B3F6E] text-[12px] font-medium">
                    {notice}
                </div>
            ) : null}
            {fetchError ? (
                <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#FCEAE7] text-[#9D3A2C] text-[12px] font-medium">
                    {fetchError}
                </div>
            ) : null}

            <QRSection
                selectedClassId={selectedClassId}
                selectedClass={selectedClass}
                classItems={classItems}
                hasActiveClasses={hasActiveClasses}
                emptyStateMessage={emptyStateMessage}
                onSelectClass={onSelectClass}
                onViewFullQR={onViewQR}
            />

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

function QRSection({
    selectedClassId,
    selectedClass,
    classItems,
    hasActiveClasses,
    emptyStateMessage,
    onSelectClass,
    onViewFullQR,
}: {
    selectedClassId: string | null;
    selectedClass: TeacherQrClassItem | null;
    classItems: TeacherQrClassItem[];
    hasActiveClasses: boolean;
    emptyStateMessage?: string | null;
    onSelectClass: (classId: string | null) => void;
    onViewFullQR: () => void;
}) {
    const [classOpen, setClassOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const emptyMessage = emptyStateMessage || 'No active classes are assigned to you yet.';

    const handleCopyClassCode = async () => {
        if (!selectedClass?.class_code || !hasActiveClasses) return;
        try {
            await navigator.clipboard.writeText(selectedClass.class_code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setCopied(false);
        }
    };

    return (
        <section className="mb-8">
            <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Share your class QR</h3>
            <div className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-5 flex items-start gap-5">
                <div className="relative shrink-0">
                    <div className={`w-[72px] h-[72px] border-2 border-[#3B3F6E] rounded-lg flex items-center justify-center bg-white p-1 ${!hasActiveClasses ? 'opacity-30 blur-[1.2px]' : ''}`}>
                        <QRCode
                            value={selectedClass?.class_code || 'NO-ACTIVE-CLASS'}
                            size={52}
                            fgColor="#3B3F6E"
                            bgColor="#FFFFFF"
                        />
                    </div>
                    {!hasActiveClasses ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#3B3F6E]">
                                No class
                            </span>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-col min-w-0">
                    <p className="text-[13.5px] text-[#2B2B2F] mb-2">
                        {hasActiveClasses
                            ? 'Let students scan this to connect with your selected class.'
                            : emptyMessage}
                    </p>

                    {hasActiveClasses ? (
                        <>
                            <div className="relative mb-2">
                                <button
                                    onClick={() => setClassOpen((v) => !v)}
                                    className="flex items-center gap-1.5 px-4 py-2 border border-[#D4D0CA] rounded-lg text-[12.5px] font-medium text-[#3B3F6E] bg-[#F6F5F8] hover:bg-white transition-colors cursor-pointer"
                                >
                                    Class: {selectedClass?.class_name || 'Select class'}
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#3B3F6E" strokeWidth="1.5" className={`transition-transform ${classOpen ? 'rotate-180' : ''}`}>
                                        <path d="M3 4.5L6 7.5L9 4.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                                {classOpen ? (
                                    <div className="absolute left-0 top-full mt-1 bg-white border border-[#E0DDD8] rounded-xl shadow-lg py-1 min-w-[240px] z-10">
                                        {classItems.map((item) => (
                                            <button
                                                key={item.class_id}
                                                onClick={() => {
                                                    onSelectClass(item.class_id);
                                                    setClassOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-[13px] font-medium transition-colors cursor-pointer ${
                                                    item.class_id === selectedClassId
                                                        ? 'bg-[#F7F1E6] text-[#3B3F6E]'
                                                        : 'text-graphite-60 hover:bg-gray-50'
                                                }`}
                                            >
                                                {item.class_name}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[12.5px] text-[#2B2B2F]/70">
                                    Class code: <span className="font-semibold text-[#3B3F6E]">{selectedClass?.class_code}</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => void handleCopyClassCode()}
                                    className="text-[12px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer"
                                >
                                    {copied ? 'Copied' : 'Copy code'}
                                </button>
                            </div>

                            <button
                                onClick={onViewFullQR}
                                className="text-[12.5px] font-semibold text-[#3B3F6E] hover:underline cursor-pointer text-left w-fit"
                            >
                                View full QR
                            </button>
                        </>
                    ) : (
                        <div className="inline-flex w-fit items-center rounded-lg border border-[#D4D0CA] bg-[#F6F5F8] px-4 py-2 text-[12.5px] font-medium text-[#3B3F6E]/70">
                            No active classes assigned
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function FullQRView({
    selectedClass,
    hasActiveClasses,
    emptyStateMessage,
    onBack,
}: {
    selectedClass: TeacherQrClassItem | null;
    hasActiveClasses: boolean;
    emptyStateMessage?: string | null;
    onBack: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const classCode = selectedClass?.class_code || '';

    const handleCopy = async () => {
        if (!classCode || !hasActiveClasses) return;
        try {
            await navigator.clipboard.writeText(classCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
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

            <h2 className="text-[20px] font-semibold text-[#3B3F6E] mb-1">Your class QR</h2>
            <p className="text-[13px] text-graphite-60 mb-8">
                {hasActiveClasses
                    ? `Students can scan this to join ${selectedClass?.class_name || 'your class'}.`
                    : (emptyStateMessage || 'No active classes are assigned to you yet.')}
            </p>

            <div className="flex flex-col items-center">
                <div className={`border-2 border-dashed border-[#3B3F6E] rounded-2xl p-8 mb-6 flex flex-col items-center bg-white ${!hasActiveClasses ? 'opacity-35 blur-[1.2px]' : ''}`}>
                    <QRCode
                        value={classCode || 'NO-ACTIVE-CLASS'}
                        size={160}
                        fgColor="#3B3F6E"
                        bgColor="#FFFFFF"
                    />
                    <p className="text-[15px] font-semibold text-[#2B2B2F] mt-5">
                        {selectedClass?.class_name || 'No active class'}
                    </p>
                </div>

                {hasActiveClasses ? (
                    <>
                        <p className="text-[11px] font-bold text-graphite-40 tracking-wider uppercase mb-3">Or share your code instead</p>
                        <div className="flex items-center gap-2">
                            <span className="text-[18px] font-bold text-[#2B2B2F] tracking-wider">{classCode}</span>
                            <button
                                onClick={() => void handleCopy()}
                                className="p-1.5 hover:bg-white/60 rounded-lg transition-colors cursor-pointer"
                                title="Copy code"
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
                    </>
                ) : (
                    <div className="rounded-xl border border-[#E0DDD8] bg-white px-4 py-3 text-[13px] text-[#3B3F6E]/70">
                        Assign this teacher to an active class to generate a shareable class QR.
                    </div>
                )}
            </div>
        </div>
    );
}
