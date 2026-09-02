import React, { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2 } from "lucide-react";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AI travel assistant powered by MakeLyft. How can I help you with your ride or travel plans today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMessage })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [
          ...prev, 
          { 
            role: "assistant", 
            content: data.error || data.message || "Sorry, I couldn't reach the AI brain right now. Make sure you are logged in and Ollama is running." 
          }
        ]);
      }
    } catch (err) {
      console.error("AI chat error:", err);
      setMessages(prev => [
        ...prev, 
        { role: "assistant", content: "Network error: Could not connect to the backend server." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#714B67] to-[#8C5D80] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#5c3c54] transition-all transform hover:scale-110 z-[500] cursor-pointer animate-float border-2 border-white/20 shadow-[#714B67]/40 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        title="Open AI Assistant"
      >
        <Bot className="w-7 h-7 text-amber-300 drop-shadow-md" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#00A09D] rounded-full border-2 border-white flex items-center justify-center shadow-sm">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
        </span>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col z-[500] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#714B67] text-white p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-semibold text-sm">MakeLyft AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/70">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-[#00A09D] text-white rounded-br-none shadow-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#714B67]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={loading}
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-2 w-8 h-8 flex items-center justify-center bg-[#714B67] text-white rounded-lg disabled:opacity-50 disabled:bg-gray-400 hover:bg-[#5c3c54] transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

export default AIAssistant;
