import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Globe,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { httpClient } from "@/api/httpClient";

interface Source {
  document_title: string;
  page_number?: number;
  source_url: string;
  source_org?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: string;
  language?: "en" | "ta";
}

const SUGGESTED_QUESTIONS = [
  "What documents do I need to open a milk parlour in Tamil Nadu?",
  "What is the FSSAI fee for a dairy processing unit handling 20,000 litres/day?",
  "How do I apply for an Aavin franchise?",
  "Which district in Tamil Nadu has the highest milk production?",
  "What government schemes are available for dairy farmers?",
  "தமிழ்நாட்டில் பால் கடை தொடங்க என்ன ஆவணங்கள் தேவை?",
];


export function ChatbotPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Vanakkam. I am the ClearPath-AI Compliance Assistant. I provide regulatory answers grounded strictly in verified official documents from the source registry. If no reviewed evidence exists for a query, I fail closed to prevent regulatory misinformation. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ta">("en");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await httpClient.post<{
        answer: string;
        sources?: Source[];
        language?: "en" | "ta";
      }>("/chatbot/chat", { question: q, language: lang });

      if (response.data) {
        const data = response.data;
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          language: data.language || lang,
        };
        setMessages((prev) => [...prev, aiMsg]);
        setLoading(false);
        return;
      }
    } catch {
      // Backend not running or failed
    }

    setMessages((prev) => [...prev, {
      id: `ai-${Date.now()}`,
      role: "assistant",
      content: "I could not reach the live official-document retrieval service. No answer was generated and no substitute/demo answer was used. Please ensure the backend is running and official documents have been verified.",
      sources: [],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      language: lang,
    }]);
    setLoading(false);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="chatbot-page flex flex-col h-[calc(100vh-140px)] max-h-[850px] bg-white rounded-2xl border border-border shadow-sm overflow-hidden fade-in">
      {/* Top Header */}
      <div className="p-4 border-b border-border bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100/80 border border-teal-200 flex items-center justify-center text-primary">
            <Sparkles size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>ClearPathAI Compliance Assistant</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Grounded RAG
              </span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Citations from FSSAI FoSCoS regulations, Aavin guidelines & data.gov.in
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ta" : "en")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Globe size={13} className="text-primary" />
            <span>{lang === "en" ? "Language: English" : "மொழி: தமிழ்"}</span>
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5 bg-[#faf8f3]/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                m.role === "user"
                  ? "bg-slate-800 text-white"
                  : "bg-primary text-white shadow-xs"
              }`}
            >
              {m.role === "user" ? <User size={14} /> : <Sparkles size={14} />}
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-white rounded-tr-none shadow-sm"
                  : "bg-white border border-border rounded-tl-none shadow-sm text-slate-800"
              }`}
            >
              <div className="whitespace-pre-line">{m.content}</div>

              {/* Source Citation Cards */}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2 flex items-center gap-1">
                    <BookOpen size={11} className="text-primary" />
                    Statutory Citations & Official Sources
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {m.sources.map((s, idx) => (
                      <a
                        key={idx}
                        href={s.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-teal-300 hover:bg-teal-50/30 transition flex flex-col justify-between text-[11px] text-slate-700"
                      >
                        <div className="font-semibold text-slate-900 truncate">
                          {s.document_title}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>
                            {s.source_org} {s.page_number ? `• Page ${s.page_number}` : ""}
                          </span>
                          <ExternalLink size={10} className="text-primary" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message metadata */}
              <div
                className={`mt-2 flex items-center justify-between text-[10px] ${
                  m.role === "user" ? "text-teal-100" : "text-slate-400"
                }`}
              >
                <span>{m.timestamp}</span>
                {m.role === "assistant" && (
                  <button
                    onClick={() => handleCopy(m.id, m.content)}
                    className="hover:text-slate-600 flex items-center gap-1"
                    title="Copy response"
                  >
                    {copiedId === m.id ? (
                      <>
                        <Check size={11} className="text-emerald-600" />
                        <span className="text-emerald-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="bg-white border border-border p-3.5 rounded-2xl rounded-tl-none shadow-sm text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw size={13} className="animate-spin text-primary" />
              <span>Searching verified FoSCoS and Tamil Nadu government documents...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      {messages.length < 3 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-white">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            Suggested Statutory Queries:
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] bg-slate-50 hover:bg-teal-50 hover:text-primary text-slate-700 border border-slate-200 transition text-left shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-border flex items-center gap-2">
        <input
          type="text"
          placeholder={
            lang === "en"
              ? "Ask about FSSAI registration, Aavin franchise requirements, district stats..."
              : "FSSAI உரிமம், ஆவின் விற்பனை மையம், மாவட்ட பால் உற்பத்தி குறித்து கேளுங்கள்..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-border bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
        >
          <span>Send</span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
