'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import {
    getTeacherConnectionRequests,
    getTeacherQr,
    getTeacherStudents,
    updateTeacherConnectionRequest,
} from '../api/teacher';
import { useAuthGuard } from '@/shared/lib';

type ConnectScreen = 'list' | 'qr-full' | 'thread';

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

interface MessageThreadItem {
    threadId: string;
    recipientType: 'student' | 'class';
    recipientId: string;
    title: string;
    latestPreview: string;
    lastMessageAt: string;
}

interface MessageItem {
    messageId: string;
    threadId: string;
    senderId: string | null;
    senderName: string | null;
    content: string;
    createdAt: string;
}

interface MessageRecipient {
    id: string;
    type: 'student' | 'class';
    name: string;
    subtitle: string;
}

type GuardableResponse = { error?: string; authExpired?: boolean } | null | undefined;
type TeacherQrPayload = {
    classes?: Array<Record<string, unknown>>;
    has_active_classes?: boolean;
    empty_state_message?: string | null;
};
type TeacherRequestPayload = {
    requests?: Array<Record<string, unknown>>;
};
type TeacherStudentsPayload = {
    students?: Array<Record<string, unknown>>;
};
type MessageThreadsPayload = {
    threads?: Array<Record<string, unknown>>;
    total?: number;
};
type MessageListPayload = {
    thread_id?: string;
    messages?: Array<Record<string, unknown>>;
};

type ApiResult<T> = {
    data?: T;
    error?: string;
};

function getInitials(name: string) {
    return (
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() || '')
            .join('') || 'NA'
    );
}

function formatTimestamp(value: string) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

async function fetchClientJson<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
    try {
        const res = await fetch(url, options);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                error:
                    data?.detail ||
                    data?.message ||
                    data?.error ||
                    'Request failed.',
            };
        }
        return { data: data as T };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Request failed.',
        };
    }
}

function normalizeThreads(payload: MessageThreadsPayload | undefined): MessageThreadItem[] {
    const threads = Array.isArray(payload?.threads) ? payload.threads : [];

    return threads
        .map((thread) => {
            const recipientType =
                thread?.recipient_type === 'class' ? 'class' : 'student';
            const recipientId = String(thread?.recipient_id || '');
            const threadId = String(thread?.thread_id || thread?.id || '');
            if (!threadId || !recipientId) return null;

            return {
                threadId,
                recipientType,
                recipientId,
                title: String(thread?.title || 'Conversation'),
                latestPreview: String(thread?.latest_preview || ''),
                lastMessageAt: String(thread?.last_message_at || ''),
            } as MessageThreadItem;
        })
        .filter(Boolean) as MessageThreadItem[];
}

function normalizeMessages(payload: MessageListPayload | undefined): MessageItem[] {
    const messages = Array.isArray(payload?.messages) ? payload.messages : [];

    return messages.map((message, index: number) => ({
        messageId: String(message?.message_id || message?.id || `message-${index}`),
        threadId: String(message?.thread_id || ''),
        senderId: message?.sender_id ? String(message.sender_id) : null,
        senderName: message?.sender_name ? String(message.sender_name) : null,
        content: String(message?.content || ''),
        createdAt: String(message?.created_at || ''),
    }));
}

export function ConnectView() {
    const [screen, setScreen] = useState<ConnectScreen>('list');
    const [qrData, setQrData] = useState<TeacherQrPayload | null>(null);
    const [requests, setRequests] = useState<ConnectionRequestItem[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [threads, setThreads] = useState<MessageThreadItem[]>([]);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [threadMessages, setThreadMessages] = useState<MessageItem[]>([]);
    const [threadLoading, setThreadLoading] = useState(false);
    const [students, setStudents] = useState<MessageRecipient[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [composerRecipientId, setComposerRecipientId] = useState<string>('');
    const [composerMessage, setComposerMessage] = useState('');
    const [replyMessage, setReplyMessage] = useState('');
    const guardAuth = useAuthGuard('teacher');

    const classItems = useMemo<TeacherQrClassItem[]>(
        () =>
            Array.isArray(qrData?.classes)
                ? qrData.classes
                      .map((item) => ({
                          class_id: String(item?.class_id || ''),
                          class_name: String(item?.class_name || item?.name || 'Class'),
                          class_code: String(item?.class_code || ''),
                      }))
                      .filter((item: TeacherQrClassItem) => item.class_id && item.class_code)
                : [],
        [qrData],
    );

    const recipients = useMemo<MessageRecipient[]>(() => {
        const classRecipients = classItems.map((item) => ({
            id: `class:${item.class_id}`,
            type: 'class' as const,
            name: item.class_name,
            subtitle: `Class message • ${item.class_code}`,
        }));

        const seen = new Set<string>();
        const allRecipients = [...classRecipients, ...students].filter((recipient) => {
            const key = `${recipient.type}:${recipient.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        return allRecipients;
    }, [classItems, students]);

    const openComposer = () => {
        const defaultRecipient =
            composerRecipientId && recipients.some((recipient) => recipient.id === composerRecipientId)
                ? composerRecipientId
                : recipients[0]?.id || '';
        setComposerRecipientId(defaultRecipient);
        setComposerMessage('');
        setComposerOpen(true);
    };

    const refresh = useCallback(async () => {
        const [qrRes, reqRes, studentsRes, threadsRes] = await Promise.all([
            getTeacherQr(),
            getTeacherConnectionRequests(),
            getTeacherStudents(),
            fetchClientJson<MessageThreadsPayload>('/api/messages/threads'),
        ]);

        if (
            guardAuth([
                qrRes as GuardableResponse,
                reqRes as GuardableResponse,
                studentsRes as GuardableResponse,
                threadsRes,
            ])
        ) {
            return;
        }

        const qr = ('data' in qrRes ? qrRes.data : null) as TeacherQrPayload | null;
        const reqPayload = ('data' in reqRes ? reqRes.data : null) as TeacherRequestPayload | Record<string, unknown>[] | null;
        const studentsPayload = ('data' in studentsRes ? studentsRes.data : null) as TeacherStudentsPayload | Record<string, unknown>[] | null;

        const reqList: Record<string, unknown>[] = Array.isArray(reqPayload)
            ? reqPayload
            : Array.isArray(reqPayload?.requests)
              ? reqPayload.requests
              : [];

        const studentRows: Record<string, unknown>[] = Array.isArray(studentsPayload)
            ? studentsPayload
            : Array.isArray(studentsPayload?.students)
              ? studentsPayload.students
              : [];

        const qrError = 'error' in qrRes ? qrRes.error : null;
        const reqError = 'error' in reqRes ? reqRes.error : null;
        const studentError = 'error' in studentsRes ? studentsRes.error : null;

        setQrData(qr || null);
        const nextClassItems: TeacherQrClassItem[] = Array.isArray(qr?.classes)
            ? qr.classes
                  .map((item) => ({
                      class_id: String(item?.class_id || ''),
                      class_name: String(item?.class_name || item?.name || 'Class'),
                      class_code: String(item?.class_code || ''),
                  }))
                  .filter((item) => item.class_id && item.class_code)
            : [];
        setSelectedClassId((current) => {
            if (!nextClassItems.length) return null;
            if (current && nextClassItems.some((item) => item.class_id === current)) {
                return current;
            }
            return nextClassItems[0].class_id;
        });
        setFetchError(qrError || reqError || studentError || threadsRes.error || null);
        setThreads(normalizeThreads(threadsRes.data));
        setStudents(
            studentRows
                .map((student, index: number) => {
                    const studentId = String(
                        student?.student_uuid || student?.student_id || student?.uuid || student?.id || '',
                    );
                    if (!studentId) return null;
                    const name =
                        student?.name ||
                        `${student?.first_name || ''} ${student?.last_name || ''}`.trim() ||
                        `Student ${index + 1}`;

                    return {
                        id: studentId,
                        type: 'student' as const,
                        name,
                        subtitle:
                            student?.class_name ||
                            student?.class ||
                            student?.group_name ||
                            'Connected student',
                    };
                })
                .filter(Boolean) as MessageRecipient[],
        );
        setRequests(
            reqList.map((r, i: number) => {
                const name = r.student_name || r.name || `Student ${i + 1}`;
                return {
                    id: String(r.connection_id ?? r.id ?? `req-${i}`),
                    name,
                    initials: getInitials(name),
                    classInfo: r.class_name || r.class || 'Class not specified',
                    status: r.status === 'accepted' || r.status === 'rejected' ? r.status : 'pending',
                } as ConnectionRequestItem;
            }),
        );
    }, [guardAuth]);

    const loadThreadMessages = async (threadId: string) => {
        setThreadLoading(true);
        const res = await fetchClientJson<MessageListPayload>(
            `/api/messages/threads/${encodeURIComponent(threadId)}`,
        );
        if (guardAuth(res)) {
            setThreadLoading(false);
            return;
        }
        if (res.error) {
            setNotice(res.error);
            setThreadMessages([]);
            setThreadLoading(false);
            return;
        }
        setThreadMessages(normalizeMessages(res.data));
        setThreadLoading(false);
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
    }, [refresh]);

    const handleRequestAction = async (id: string, action: 'accept' | 'reject') => {
        setActingId(id);
        const result = await updateTeacherConnectionRequest(id, action);
        if (!guardAuth(result as GuardableResponse) && 'error' in result && result.error) {
            setNotice(result.error);
        }
        await refresh();
        setActingId(null);
    };

    const handleOpenThread = async (threadId: string) => {
        setSelectedThreadId(threadId);
        setScreen('thread');
        setReplyMessage('');
        await loadThreadMessages(threadId);
    };

    const handleSendToRecipient = async () => {
        const recipientKey = composerRecipientId.trim();
        const content = composerMessage.trim();
        if (!recipientKey || !content) return;

        const [recipientType, recipientId] = recipientKey.split(':');
        if (!recipientType || !recipientId) return;

        setSending(true);
        const result = await fetchClientJson<Record<string, unknown>>('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_type: recipientType,
                recipient_id: recipientId,
                content,
            }),
        });

        if (guardAuth(result)) {
            setSending(false);
            return;
        }
        if (result.error) {
            setNotice(result.error);
            setSending(false);
            return;
        }

        await refresh();
        setComposerOpen(false);
        setComposerMessage('');
        setNotice('Message sent.');

        const createdThreadId = result.data?.thread_id ? String(result.data.thread_id) : null;
        if (createdThreadId) {
            await handleOpenThread(createdThreadId);
        }

        setSending(false);
    };

    const handleReply = async () => {
        const content = replyMessage.trim();
        const selectedThread = threads.find((thread) => thread.threadId === selectedThreadId);
        if (!selectedThread || !content) return;

        setSending(true);
        const result = await fetchClientJson<Record<string, unknown>>('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient_type: selectedThread.recipientType,
                recipient_id: selectedThread.recipientId,
                content,
            }),
        });

        if (guardAuth(result)) {
            setSending(false);
            return;
        }
        if (result.error) {
            setNotice(result.error);
            setSending(false);
            return;
        }

        setReplyMessage('');
        await refresh();
        await loadThreadMessages(selectedThread.threadId);
        setSending(false);
    };

    const pendingRequests = useMemo(
        () => requests.filter((request) => request.status === 'pending'),
        [requests],
    );
    const selectedClass = classItems.find((item) => item.class_id === selectedClassId) || null;
    const hasActiveClasses = Boolean(qrData?.has_active_classes) && classItems.length > 0;
    const selectedThread = threads.find((thread) => thread.threadId === selectedThreadId) || null;

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

    if (screen === 'thread' && selectedThread) {
        return (
            <>
                <MessageThreadView
                    thread={selectedThread}
                    messages={threadMessages}
                    loading={threadLoading}
                    sending={sending}
                    replyMessage={replyMessage}
                    notice={notice}
                    onBack={() => setScreen('list')}
                    onReplyMessageChange={setReplyMessage}
                    onSend={handleReply}
                />
                {composerOpen ? (
                    <NewMessageComposer
                        recipients={recipients}
                        selectedRecipientId={composerRecipientId}
                        message={composerMessage}
                        sending={sending}
                        onClose={() => setComposerOpen(false)}
                        onRecipientChange={setComposerRecipientId}
                        onMessageChange={setComposerMessage}
                        onSend={handleSendToRecipient}
                    />
                ) : null}
            </>
        );
    }

    return (
        <>
            <ConnectList
                selectedClassId={selectedClassId}
                selectedClass={selectedClass}
                classItems={classItems}
                hasActiveClasses={hasActiveClasses}
                emptyStateMessage={qrData?.empty_state_message}
                pendingRequests={pendingRequests}
                threads={threads}
                loading={loading}
                actingId={actingId}
                notice={notice}
                fetchError={fetchError}
                onSelectClass={setSelectedClassId}
                onViewQR={() => setScreen('qr-full')}
                onNewMessage={openComposer}
                onOpenThread={handleOpenThread}
                onAccept={(id) => void handleRequestAction(id, 'accept')}
                onReject={(id) => void handleRequestAction(id, 'reject')}
            />
            {composerOpen ? (
                <NewMessageComposer
                    recipients={recipients}
                    selectedRecipientId={composerRecipientId}
                    message={composerMessage}
                    sending={sending}
                    onClose={() => setComposerOpen(false)}
                    onRecipientChange={setComposerRecipientId}
                    onMessageChange={setComposerMessage}
                    onSend={handleSendToRecipient}
                />
            ) : null}
        </>
    );
}

function ConnectList({
    selectedClassId,
    selectedClass,
    classItems,
    hasActiveClasses,
    emptyStateMessage,
    pendingRequests,
    threads,
    loading,
    actingId,
    notice,
    fetchError,
    onSelectClass,
    onViewQR,
    onNewMessage,
    onOpenThread,
    onAccept,
    onReject,
}: {
    selectedClassId: string | null;
    selectedClass: TeacherQrClassItem | null;
    classItems: TeacherQrClassItem[];
    hasActiveClasses: boolean;
    emptyStateMessage?: string | null;
    pendingRequests: ConnectionRequestItem[];
    threads: MessageThreadItem[];
    loading: boolean;
    actingId: string | null;
    notice: string | null;
    fetchError: string | null;
    onSelectClass: (classId: string | null) => void;
    onViewQR: () => void;
    onNewMessage: () => void;
    onOpenThread: (threadId: string) => void | Promise<void>;
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

            <section className="mb-8">
                <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase mb-3">Connection requests</h3>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, idx) => (
                            <div key={idx} className="h-[78px] rounded-2xl bg-[#EDEBE6] animate-pulse" />
                        ))}
                    </div>
                ) : pendingRequests.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#E9E7E2] px-6 py-8 text-center">
                        <p className="text-[14px] font-semibold text-[#3B3F6E] mb-1">No pending requests.</p>
                        <p className="text-[12px] text-graphite-40">New student connection requests will appear here.</p>
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

            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[11px] font-bold text-[#3B3F6E] tracking-wider uppercase">Messages</h3>
                    {threads.length > 0 ? (
                        <span className="text-[12px] text-graphite-40">{threads.length} thread{threads.length === 1 ? '' : 's'}</span>
                    ) : null}
                </div>
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="h-[88px] rounded-2xl bg-[#EDEBE6] animate-pulse" />
                        ))}
                    </div>
                ) : threads.length === 0 ? (
                    <div className="bg-[#F2F2F2] rounded-2xl border border-[#E9E7E2] px-6 py-14 text-center">
                        <p className="text-[15px] font-semibold text-[#3B3F6E] mb-1.5">No messages yet.</p>
                        <p className="text-[13px] text-graphite-40 mb-5">Start a conversation with a class or connected student.</p>
                        <button
                            onClick={onNewMessage}
                            className="px-6 py-2.5 rounded-xl bg-[#3B3F6E] text-white text-[13px] font-semibold hover:bg-[#2E3259] transition-colors cursor-pointer"
                        >
                            New message
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {threads.map((thread) => (
                            <button
                                key={thread.threadId}
                                onClick={() => void onOpenThread(thread.threadId)}
                                className="w-full bg-white rounded-2xl border border-[#E9E7E2] px-5 py-4 text-left hover:bg-[#FBFAF7] transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-semibold text-[#2B2B2F] truncate">{thread.title}</p>
                                        <p className="mt-1 text-[12px] text-graphite-40 truncate">
                                            {thread.latestPreview || 'Open thread'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-graphite-40">
                                        {formatTimestamp(thread.lastMessageAt)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function MessageThreadView({
    thread,
    messages,
    loading,
    sending,
    replyMessage,
    notice,
    onBack,
    onReplyMessageChange,
    onSend,
}: {
    thread: MessageThreadItem;
    messages: MessageItem[];
    loading: boolean;
    sending: boolean;
    replyMessage: string;
    notice: string | null;
    onBack: () => void;
    onReplyMessageChange: (value: string) => void;
    onSend: () => void;
}) {
    return (
        <div className="flex flex-col h-full w-full max-w-[900px] pb-12">
            <button
                onClick={onBack}
                className="mb-4 flex w-fit items-center gap-2 text-[14px] font-medium text-graphite-60 hover:text-[#3B3F6E] transition-colors cursor-pointer"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M10 3L5 8L10 13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Messages
            </button>

            <div className="mb-6">
                <h2 className="text-[22px] font-semibold text-[#3B3F6E]">{thread.title}</h2>
                <p className="mt-1 text-[13px] text-graphite-40">
                    {thread.recipientType === 'class' ? 'Class thread' : 'Student thread'}
                </p>
            </div>

            {notice ? (
                <div className="mb-4 px-4 py-2.5 rounded-lg bg-[#E8E4DC] text-[#3B3F6E] text-[12px] font-medium">
                    {notice}
                </div>
            ) : null}

            <div className="flex-1 rounded-2xl border border-[#E9E7E2] bg-white px-5 py-5 mb-4 min-h-[420px]">
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="h-[72px] rounded-2xl bg-[#EDEBE6] animate-pulse" />
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                        <div>
                            <p className="text-[15px] font-semibold text-[#3B3F6E] mb-1">No messages yet.</p>
                            <p className="text-[12px] text-graphite-40">Send the first message to start this conversation.</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {messages.map((message) => (
                            <div key={message.messageId} className="rounded-2xl bg-[#F7F1E6] border border-[#E9E7E2] px-4 py-3">
                                <div className="mb-1 flex items-center justify-between gap-4">
                                    <p className="text-[12px] font-semibold text-[#3B3F6E]">
                                        {message.senderName || 'Teacher'}
                                    </p>
                                    <span className="text-[11px] text-graphite-40">
                                        {formatTimestamp(message.createdAt)}
                                    </span>
                                </div>
                                <p className="text-[14px] leading-6 text-[#2B2B2F] whitespace-pre-wrap">
                                    {message.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-[#E9E7E2] bg-white px-4 py-4">
                <textarea
                    value={replyMessage}
                    onChange={(e) => onReplyMessageChange(e.target.value)}
                    placeholder="Type your message..."
                    className="min-h-[96px] w-full resize-none rounded-xl border border-[#E0DDD8] bg-[#F7F1E6] px-4 py-3 text-[14px] text-[#2B2B2F] outline-none placeholder:text-graphite-40 focus:border-[#3B3F6E]"
                />
                <div className="mt-3 flex justify-end">
                    <button
                        onClick={onSend}
                        disabled={!replyMessage.trim() || sending}
                        className="rounded-xl bg-[#3B3F6E] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#2E3259] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {sending ? 'Sending...' : 'Send message'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function NewMessageComposer({
    recipients,
    selectedRecipientId,
    message,
    sending,
    onClose,
    onRecipientChange,
    onMessageChange,
    onSend,
}: {
    recipients: MessageRecipient[];
    selectedRecipientId: string;
    message: string;
    sending: boolean;
    onClose: () => void;
    onRecipientChange: (value: string) => void;
    onMessageChange: (value: string) => void;
    onSend: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-[720px] rounded-t-3xl bg-[#F7F1E6] px-6 pt-4 pb-6 animate-slide-up">
                <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[#D0CCC5]" />
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h3 className="text-[18px] font-semibold text-[#3B3F6E]">New message</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[13px] font-medium text-graphite-60 hover:text-[#3B3F6E] cursor-pointer"
                    >
                        Close
                    </button>
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#3B3F6E]">
                        Recipient
                    </label>
                    <select
                        value={selectedRecipientId}
                        onChange={(e) => onRecipientChange(e.target.value)}
                        className="h-[48px] w-full rounded-xl border border-[#E0DDD8] bg-white px-4 text-[14px] text-[#2B2B2F] outline-none focus:border-[#3B3F6E]"
                    >
                        {recipients.length === 0 ? (
                            <option value="">No recipients available</option>
                        ) : (
                            recipients.map((recipient) => (
                                <option key={recipient.id} value={recipient.id}>
                                    {recipient.name} • {recipient.subtitle}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#3B3F6E]">
                        Message
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => onMessageChange(e.target.value)}
                        placeholder="Write your message..."
                        className="min-h-[132px] w-full resize-none rounded-xl border border-[#E0DDD8] bg-white px-4 py-3 text-[14px] text-[#2B2B2F] outline-none placeholder:text-graphite-40 focus:border-[#3B3F6E]"
                    />
                </div>

                <button
                    type="button"
                    onClick={onSend}
                    disabled={!selectedRecipientId || !message.trim() || sending || recipients.length === 0}
                    className="w-full rounded-2xl bg-[#3B3F6E] py-3.5 text-[14px] font-semibold text-white hover:bg-[#2E3259] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {sending ? 'Sending...' : 'Send message'}
                </button>
            </div>
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
