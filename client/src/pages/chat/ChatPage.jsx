import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/slices/authSlice";
import PageWrapper from "../../components/layout/PageWrapper";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import toast from "react-hot-toast";
import { useSocketClient } from "../../hooks/useSocket";
import {
  getConversationMessages,
  getMyConversations,
  markConversationRead,
  sendConversationMessage,
  startConversation,
} from "../../api/chatApi";

const ChatPage = () => {
  const user = useSelector(selectCurrentUser);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [draft, setDraft] = useState("");
  const [bootstrappingParticipantId, setBootstrappingParticipantId] = useState(location.state?.participantId || null);
  const socket = useSocketClient();

  const conversationsQuery = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => getMyConversations().then((response) => response.data.data),
    staleTime: 10000,
  });

  const conversations = conversationsQuery.data?.conversations || [];

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0]._id);
    }
  }, [conversations, selectedConversationId]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation._id) === String(selectedConversationId)) || null,
    [conversations, selectedConversationId]
  );

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedConversationId],
    queryFn: () => getConversationMessages(selectedConversationId).then((response) => response.data.data),
    enabled: Boolean(selectedConversationId),
    staleTime: 0,
  });

  const messages = messagesQuery.data?.messages || [];

  const startConversationMutation = useMutation({
    mutationFn: (participantId) => startConversation({ participantId }),
    onSuccess: (response, participantId) => {
      const conversation = response.data.data.conversation;
      setSelectedConversationId(conversation._id);
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setBootstrappingParticipantId(null);
      navigate("/chat", { replace: true, state: null });
      if (participantId) {
        toast.success("Conversation opened");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to open conversation");
      setBootstrappingParticipantId(null);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, body }) => sendConversationMessage(conversationId, { body }),
    onSuccess: (response, variables) => {
      const message = response.data.data.message;
      queryClient.setQueryData(["chat", "messages", variables.conversationId], (current) => {
        const currentMessages = current?.messages || [];
        const alreadyExists = currentMessages.some((item) => String(item._id) === String(message._id));
        return alreadyExists
          ? current
          : {
              ...current,
              messages: [...currentMessages, message],
            };
      });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      setDraft("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  const readMutation = useMutation({
    mutationFn: (conversationId) => markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });

  useEffect(() => {
    if (bootstrappingParticipantId) {
      startConversationMutation.mutate(bootstrappingParticipantId);
    }
  }, [bootstrappingParticipantId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    readMutation.mutate(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!socket || !selectedConversationId) return undefined;

    const handleReconnect = () => {
      socket.emit("chat:join", selectedConversationId);
    };

    socket.emit("chat:join", selectedConversationId);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("connect", handleReconnect);
      socket.emit("chat:leave", selectedConversationId);
    };
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMessage = ({ conversationId, message }) => {
      if (String(conversationId) === String(selectedConversationId)) {
        queryClient.setQueryData(["chat", "messages", selectedConversationId], (current) => {
          const currentMessages = current?.messages || [];
          const alreadyExists = currentMessages.some((item) => String(item._id) === String(message._id));
          return alreadyExists
            ? current
            : {
                ...current,
                messages: [...currentMessages, message],
              };
        });
      }

      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    };

    const handleConversationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    };

    socket.on("chat:message", handleMessage);
    socket.on("chat:conversation:update", handleConversationUpdate);

    return () => {
      socket.off("chat:message", handleMessage);
      socket.off("chat:conversation:update", handleConversationUpdate);
    };
  }, [socket, selectedConversationId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedConversationId]);

  const otherParticipant = selectedConversation?.participantIds?.find((participant) => String(participant._id) !== String(user?._id)) || selectedConversation?.participantIds?.[0];

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedDraft = draft.trim();
    if (!trimmedDraft || !selectedConversationId) return;
    sendMessageMutation.mutate({ conversationId: selectedConversationId, body: trimmedDraft });
  };

  const handleDraftKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return;

    event.preventDefault();
    handleSubmit(event);
  };

  return (
    <PageWrapper>
      <div className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-text-primary">Chat</h1>
            <p className="text-text-secondary mt-1">Messages sync in real time when the conversation is open.</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/discover")}>Find people</Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] min-h-[70vh]">
          <Card className="p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border">
              <p className="font-semibold text-text-primary">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversationsQuery.isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-xl bg-background-elevated animate-pulse" />
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-sm text-text-muted text-center">
                  No conversations yet. Start one from Discover.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {conversations.map((conversation) => {
                    const other = conversation.participantIds?.find((participant) => String(participant._id) !== String(user?._id)) || conversation.participantIds?.[0];
                    const isActive = String(conversation._id) === String(selectedConversationId);
                    const preview = conversation.lastMessageId?.body || "Start the conversation";

                    return (
                      <button
                        key={conversation._id}
                        type="button"
                        onClick={() => setSelectedConversationId(conversation._id)}
                        className={`w-full text-left px-4 py-3 transition-colors ${isActive ? "bg-brand-dim/15" : "hover:bg-background-elevated"}`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={other?.avatar?.url} name={other?.name} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-text-primary truncate">{other?.name || "Unknown user"}</p>
                              {conversation.unreadCount > 0 && (
                                <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white px-1">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted truncate">{other?.university || other?.email || ""}</p>
                            <p className="text-xs text-text-secondary mt-1 truncate">{preview}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col min-h-[70vh]">
            {!selectedConversation ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <div className="text-5xl mb-4">💬</div>
                  <h2 className="text-xl font-display font-bold text-text-primary">Select a conversation</h2>
                  <p className="text-text-secondary mt-2 max-w-md">
                    Open an existing thread or start a new one from Discovery.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={otherParticipant?.avatar?.url} name={otherParticipant?.name} size="md" />
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary truncate">{otherParticipant?.name || "Conversation"}</p>
                      <p className="text-xs text-text-muted truncate">{otherParticipant?.university || otherParticipant?.email || ""}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/discover`)}>
                    New chat
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background-primary/40">
                  {messagesQuery.isLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-14 rounded-2xl bg-background-elevated animate-pulse" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-text-muted py-16">
                      No messages yet. Say hello.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMine = String(message.senderId?._id || message.senderId) === String(user?._id);

                      return (
                        <div key={message._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? "bg-brand text-white rounded-br-md" : "bg-background-elevated text-text-primary rounded-bl-md"}`}>
                            <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                            <p className={`mt-1 text-[11px] ${isMine ? "text-white/70" : "text-text-muted"}`}>
                              {message.createdAt ? new Date(message.createdAt).toLocaleString() : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-background-primary">
                  <div className="flex gap-3 items-end">
                    <textarea
                      rows={2}
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      placeholder="Write a message..."
                      className="input resize-none flex-1"
                      maxLength={2000}
                      disabled={!selectedConversationId}
                    />
                    <Button type="submit" loading={sendMessageMutation.isPending} disabled={!selectedConversationId || !draft.trim()}>
                      Send
                    </Button>
                  </div>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default ChatPage;