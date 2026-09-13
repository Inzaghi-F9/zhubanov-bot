"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User } from "lucide-react";
import toast from "react-hot-toast";
import type { ChatMessage } from "@/lib/types";

/** Лёгкий рендер ответа ИИ: **жирный**, списки и абзацы — без markdown-зависимостей */
function renderContent(content: string) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const bold = (text: string, key: string) =>
      text.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={`${key}-${j}`}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={`${key}-${j}`}>{part}</span>
        )
      );

    const trimmed = line.trim();
    const key = `l${i}`;

    if (/^[-•]\s+/.test(trimmed)) {
      blocks.push(
        <li key={key} className="ml-4 list-disc">
          {bold(trimmed.replace(/^[-•]\s+/, ""), key)}
        </li>
      );
    } else if (/^\d+[.)]\s+/.test(trimmed)) {
      blocks.push(
        <li key={key} className="ml-4 list-decimal">
          {bold(trimmed.replace(/^\d+[.)]\s+/, ""), key)}
        </li>
      );
    } else if (trimmed === "") {
      blocks.push(<div key={key} className="h-2" />);
    } else if (trimmed.startsWith("#")) {
      blocks.push(
        <div key={key} className="font-bold mt-1">
          {bold(trimmed.replace(/^#+\s*/, ""), key)}
        </div>
      );
    } else {
      blocks.push(<p key={key}>{bold(trimmed, key)}</p>);
    }
  });

  return <div className="space-y-0.5">{blocks}</div>;
}

// Минимальные типы Web Speech API (не входит в стандартную библиотеку TS)
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEventLike {
  results: { transcript: string }[][];
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) as SpeechRecognitionConstructor | null;
}

const QUICK_QUESTIONS = [
  "Что такое академическая мобильность?",
  "Какие документы нужны?",
  "Как подать заявку?",
  "Какие требования и GPA?",
];

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Сәлеметсіз бе! 👋 Я ИИ-ассистент университета им. К. Жубанова. Чем могу помочь?",
};

export function ChatBox({ className = "", greeting }: { className?: string; greeting?: ChatMessage }) {
  const [messages, setMessages] = useState<ChatMessage[]>([greeting ?? GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Web Speech API создаётся один раз (в Safari/Firefox не работает — покажем тост)
  useEffect(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "ru-RU";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      setInput((prev) => prev + (prev ? " " : "") + event.results[0][0].transcript);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    setRecognition(rec);
    return () => rec.abort();
  }, []);

  const sendMessage = async (raw?: string) => {
    const text = (raw ?? input).trim().slice(0, 2000);
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(1) }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Ошибка связи с ИИ");
      }

      // Стриминг: дописываем ответ по мере поступления
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: acc }]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка связи с ИИ");
      setMessages([
        ...history,
        { role: "assistant", content: "⚠️ Не удалось получить ответ. Попробуйте ещё раз." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMic = () => {
    if (!recognition) {
      toast.error("Браузер не поддерживает голосовой ввод");
      return;
    }
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <Bot size={15} />
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-2xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "card text-[color:var(--foreground)] rounded-bl-md"
              }`}
            >
              {m.role === "assistant" ? renderContent(m.content) : m.content}
              {loading && m.role === "assistant" && m.content === "" && (
                <span className="inline-flex gap-1 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                </span>
              )}
            </div>
            {m.role === "user" && (
              <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-slate-600">
                <User size={15} />
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {messages.length <= 2 && !loading && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="card rounded-full px-3 py-1.5 text-xs hover:border-blue-400 hover:text-blue-600 transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 pt-0">
        <div className="card flex items-end gap-2 rounded-2xl p-2 shadow-sm">
          <button
            onClick={toggleMic}
            aria-label="Голосовой ввод"
            className={`p-2 rounded-full transition ${
              isListening ? "text-red-500 animate-pulse bg-red-50" : "text-slate-400 hover:text-blue-600"
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <textarea
            rows={1}
            className="flex-1 bg-transparent p-2 outline-none resize-none max-h-40 overflow-y-auto no-scrollbar"
            placeholder={isListening ? "Слушаю…" : "Спросите что-нибудь…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <button
            onClick={() => sendMessage()}
            aria-label="Отправить"
            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
            disabled={loading}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-1.5">Shift + Enter — новая строка</p>
      </div>
    </div>
  );
}