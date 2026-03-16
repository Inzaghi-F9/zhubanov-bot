"use client";
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Plus, Trash2, Send, Moon, Sun, Menu, Edit2, Mic, MicOff } from "lucide-react";

interface Message { role: string; content: string; }
interface Chat { id: string; title: string; messages: Message[]; }

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("zhubanov_chats");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) setCurrentChatId(parsed[0].id);
    } else {
      createNewChat();
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) localStorage.setItem("zhubanov_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [currentChatId, chats]);

  const createNewChat = () => {
    const newId = Date.now().toString();
    const newChat = { id: newId, title: "Новый чат", messages: [{ role: "assistant", content: "Сәлеметсіз бе! Чем могу помочь?" }] };
    setChats([newChat, ...chats]);
    setCurrentChatId(newId);
  };

  const startSpeechRecognition = () => {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    alert("Браузер не поддерживает голос.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'ru-RU';
  recognition.continuous = false; // Отключаем постоянное слушание для стабильности
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsListening(true);
    console.log("Запись пошла...");
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    setInput(prev => prev + (prev ? " " : "") + transcript);
    setIsListening(false); // Выключаем сразу после получения результата
  };

  recognition.onerror = (event: any) => {
    setIsListening(false);
    console.error("Ошибка API:", event.error);
    
    // Вместо пугающих алертов просто пишем в консоль или даем тихую подсказку
    if (event.error === 'network') {
      console.warn("Сетевая заминка. Попробуйте нажать еще раз.");
    }
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  try {
    recognition.start();
  } catch (err) {
    console.error("Критическая ошибка старта:", err);
    setIsListening(false);
  }
};

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (currentChatId === id && filtered.length > 0) setCurrentChatId(filtered[0].id);
    else if (filtered.length === 0) createNewChat();
  };

  const renameChat = (id: string) => {
    const newTitle = prompt("Введите название чата:");
    if (newTitle) setChats(chats.map(c => c.id === id ? { ...c, title: newTitle } : c));
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const currentChat = chats.find(c => c.id === currentChatId);
    if (!currentChat) return;

    const userMsg = { role: "user", content: input };
    const updatedMessages = [...currentChat.messages, userMsg];
    
    let newTitle = currentChat.title;
    if (currentChat.messages.length === 1) newTitle = input.slice(0, 30);

    setChats(chats.map(c => c.id === currentChatId ? { ...c, messages: updatedMessages, title: newTitle } : c));
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...updatedMessages, { role: "assistant", content: data.text }] } : c));
    } catch (e) {
      alert("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  const currentChat = chats.find(c => c.id === currentChatId) || chats[0];

  return (
    <div className={`flex h-screen ${darkMode ? "bg-[#171717] text-white" : "bg-white text-black"}`}>
      {/* Инъекция стиля для скрытия скроллбара */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Sidebar */}
      <div className={`${isSidebarOpen ? "w-64" : "w-0"} overflow-hidden transition-all bg-[#202123] text-gray-200 flex flex-col`}>
        <button onClick={createNewChat} className="m-3 p-3 border border-gray-600 rounded-md flex items-center gap-3 hover:bg-gray-700 transition">
          <Plus size={16} /> Новый чат
        </button>
        <div className="flex-1 overflow-y-auto px-3 no-scrollbar">
          {chats.map(chat => (
            <div key={chat.id} onClick={() => setCurrentChatId(chat.id)} className={`p-3 mb-1 rounded-md flex items-center gap-3 cursor-pointer group ${currentChatId === chat.id ? "bg-gray-800" : "hover:bg-gray-800"}`}>
              <MessageSquare size={16} />
              <span className="flex-1 truncate text-sm">{chat.title}</span>
              <div className="hidden group-hover:flex gap-1">
                <Edit2 size={14} onClick={() => renameChat(chat.id)} className="hover:text-white" />
                <Trash2 size={14} onClick={(e) => deleteChat(chat.id, e)} className="hover:text-red-400" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setDarkMode(!darkMode)} className="p-4 hover:bg-gray-800 flex items-center gap-3 border-t border-gray-700">
          {darkMode ? <Sun size={18} /> : <Moon size={18} />} {darkMode ? "Светлая тема" : "Темная тема"}
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col relative bg-inherit">
        <header className="p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
  <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
    <Menu size={20} />
  </button>
  <h2 className="ml-4 font-semibold truncate">{currentChat?.title}</h2>
</header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:px-20 space-y-6 no-scrollbar">
          {currentChat?.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] md:max-w-2xl p-4 rounded-2xl shadow-sm ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-[#2f2f2f] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
              }`}>
                <p className="text-sm md:text-base whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 md:px-20 border-t border-gray-200 dark:border-gray-700">
          <div className="relative flex items-end bg-white dark:bg-[#2f2f2f] border border-gray-300 dark:border-gray-600 rounded-2xl p-2 shadow-sm">
            <button 
              onClick={startSpeechRecognition}
              className={`p-2 transition rounded-full ${isListening ? "text-red-500 animate-pulse" : "text-gray-500 hover:text-blue-500"}`}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <textarea
              rows={1}
              className="flex-1 bg-transparent p-2 outline-none resize-none max-h-40 overflow-y-auto no-scrollbar text-gray-900 dark:text-white placeholder-gray-500"
              placeholder={isListening ? "Слушаю..." : "Спросите что-нибудь..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            
            <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-center text-gray-400 mt-2">Shift + Enter — новая строка</p>
        </div>
      </div>
    </div>
  );
}