import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useChat } from '../../hooks/useChat';

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const widgetRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, isLoading, isError, isSending, sendMessage } = useChat();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || isSending) {
      return;
    }

    setDraft('');
    await sendMessage(trimmed);
  };

  return (
    <div
      ref={widgetRef}
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 60,
      }}
    >
      {isOpen && (
        <Card
          style={{
            width: '360px',
            maxWidth: 'calc(100vw - 32px)',
            marginBottom: '12px',
            padding: '0',
            overflow: 'hidden',
            boxShadow: '0 24px 48px rgba(15, 17, 23, 0.18)',
          }}
        >
          <div
            style={{
              padding: '16px 18px',
              background: 'var(--navy-gradient)',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>Wellbeing Chat</h3>
              <p style={{ fontSize: '12px', opacity: 0.7 }}>Ask about risk, sleep, stress, or what-if scenarios</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '999px',
                border: 'none',
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              aria-label="Close chat"
            >
              <X size={14} />
            </button>
          </div>

          <div
            style={{
              height: '320px',
              padding: '14px',
              overflowY: 'auto',
              backgroundColor: 'var(--surface)',
            }}
          >
            {isLoading ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Loading your chat history...</p>
            ) : isError ? (
              <p style={{ fontSize: '13px', color: 'var(--danger)' }}>Unable to load chat right now.</p>
            ) : messages.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                }}
              >
                Ask me something like "What is my risk?" or "What should I improve first?"
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.map((message) => (
                  <div
                    key={message.chatId}
                    style={{
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      padding: '10px 12px',
                      borderRadius: '14px',
                      backgroundColor: message.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                      color: message.role === 'user' ? '#fff' : 'var(--text-primary)',
                      border: message.role === 'user' ? 'none' : '1px solid var(--border)',
                      fontSize: '13px',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {message.content}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your question..."
              rows={2}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                padding: '10px 12px',
                fontSize: '13px',
                fontFamily: 'inherit',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isSending}
              style={{ padding: '10px 12px', minWidth: '44px' }}
            >
              <Send size={14} />
            </Button>
          </form>
        </Card>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '999px',
          border: 'none',
          background: 'var(--navy-gradient)',
          color: '#fff',
          boxShadow: '0 18px 32px rgba(15, 17, 23, 0.28)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
        aria-label="Open wellbeing chat"
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
};

export default ChatWidget;
