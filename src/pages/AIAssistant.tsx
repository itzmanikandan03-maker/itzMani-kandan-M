import React, { useState } from 'react';
import { Send, Sparkles, User, Bot, Loader2, ArrowRight } from 'lucide-react';
import { recommendationService } from '../services/recommendationService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  data_points?: any;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  "What am I spending most on?",
  "How much did I spend this month?",
  "Am I exceeding my budget?",
  "How much money do I have left?",
  "How much did I spend on Food?",
  "How much can I save?",
  "Which category increased the most?",
];

export const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your PocketSmart AI Financial Assistant. I analyze your authenticated transactions, category budgets, and savings goals to give you deterministic, factual answers about your finances.\n\nWhat would you like to know about your spending this month?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setLoading(true);

    try {
      const res = await recommendationService.askAssistant(textToSend.trim());
      if (res.success && res.data) {
        const assistantMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'assistant',
          text: res.data.answer,
          data_points: res.data.data_points,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(res.message || 'Error processing question');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: "I encountered an error querying your financial records. Please ensure you are connected and try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">AI Financial Assistant</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time calculations grounded exclusively in your authenticated database data
          </p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-xs flex flex-col h-[580px]">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-3.5 text-xs ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.text}
                  </div>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                Analyzing your real database transactions...
              </div>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" /> Try:
          </span>
          {SAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="shrink-0 px-2.5 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about your expenses, budgets, savings, or spending trends..."
              className="flex-1 text-xs border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-md transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
