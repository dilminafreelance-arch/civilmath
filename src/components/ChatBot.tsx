import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Trash2, 
  HardHat, 
  ArrowRight, 
  Sparkles,
  HelpCircle,
  Code
} from 'lucide-react';
import { CALCULATORS_LIST } from '../data/calculatorsData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatBotProps {
  activeCalcId: string;
  unitSystem: string;
}

const QUICK_SUGGESTIONS = [
  "Concrete mix ratio standards",
  "ACI 318 column spacing limits",
  "Shear reinforcement design guidelines",
  "How to calculate beam deflection limits"
];

export const ChatBot: React.FC<ChatBotProps> = ({ activeCalcId, unitSystem }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your **Engineering Assistant**. Ask me anything about structural calculations, concrete mix designs, surveying traverses, or code compliance guidelines (ACI 318, ASTM, Eurocodes).'
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const activeCalcDef = CALCULATORS_LIST.find(c => c.id === activeCalcId);

  // Auto-scroll to the bottom of the message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Load chat history from local storage
  useEffect(() => {
    const savedChat = localStorage.getItem('civilmath_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    }
  }, []);

  // Save chat history to local storage
  const saveChatHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem('civilmath_chat_history', JSON.stringify(newMessages));
  };

  const handleClearHistory = () => {
    const initialMsg: Message[] = [
      {
        role: 'assistant',
        content: 'Hello! I am your **CivilMath AI Assistant**. Ask me anything about structural calculations, concrete mix designs, surveying traverses, or code compliance guidelines (ACI 318, ASTM, Eurocodes).'
      }
    ];
    saveChatHistory(initialMsg);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue('');
    }

    const newUserMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, newUserMsg];
    saveChatHistory(updatedMessages);
    setIsLoading(true);

    try {
      // Build messages payload with optional context about the active calculator
      const contextMessage = activeCalcDef 
        ? `[Note: The user is currently viewing the "${activeCalcDef.name}" (${activeCalcDef.category}) tool. Current unit system: ${unitSystem}. Keep responses relevant to civil/structural engineering.]`
        : `[Note: The user is browsing the CivilMath structural suite. Current unit system: ${unitSystem}.]`;

      const apiPayload = [
        { role: 'system', content: contextMessage },
        ...updatedMessages.map(m => ({ role: m.role, content: m.content }))
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiPayload })
      });

      const text = await response.text();
      let data: any = null;
      try {
        data = text && text.trim() ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (data && data.status === 'success' && data.response) {
        saveChatHistory([...updatedMessages, { role: 'assistant', content: data.response }]);
      } else {
        saveChatHistory([
          ...updatedMessages, 
          { 
            role: 'assistant', 
            content: `**System Alert**: ${data?.error || 'The OpenRouter service returned an empty response. Verify that your API key is correctly configured.'}` 
          }
        ]);
      }
    } catch (err: any) {
      saveChatHistory([
        ...updatedMessages, 
        { 
          role: 'assistant', 
          content: `**Connection Error**: Failed to communicate with the CivilMath AI engine. Details: ${err.message || err}` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic HTML formatter for Markdown inside chat bubbles
  const renderMessageContent = (content: string) => {
    const lines = content.split('\n');
    const renderedElements: React.ReactNode[] = [];
    let codeBlockLines: string[] = [];
    let isCodeBlock = false;

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        if (isCodeBlock) {
          renderedElements.push(
            <pre key={`code-${index}`} className="bg-slate-950 text-slate-100 p-3 rounded-xl font-mono text-[10px] overflow-x-auto my-2 border border-slate-800 leading-normal text-left">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          );
          codeBlockLines = [];
          isCodeBlock = false;
        } else {
          isCodeBlock = true;
        }
        return;
      }

      if (isCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      // Inline formatting: detect **bold** and `code`
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/);
      const inlineElements = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} className="bg-slate-200 dark:bg-slate-950 text-red-600 dark:text-red-400 px-1 rounded font-mono text-[10.5px] font-semibold">{part.slice(1, -1)}</code>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        renderedElements.push(
          <ul key={index} className="list-disc pl-4 my-1 text-left">
            <li className="text-slate-700 dark:text-slate-300">{inlineElements.slice(1)}</li>
          </ul>
        );
      } else if (/^\d+\.\s/.test(line.trim())) {
        renderedElements.push(
          <ol key={index} className="list-decimal pl-4 my-1 text-left">
            <li className="text-slate-700 dark:text-slate-300">{inlineElements}</li>
          </ol>
        );
      } else if (line.trim() === '') {
        renderedElements.push(<div key={index} className="h-1.5" />);
      } else {
        renderedElements.push(<p key={index} className="my-1 text-slate-700 dark:text-slate-300 text-left">{inlineElements}</p>);
      }
    });

    return <div className="space-y-0.5">{renderedElements}</div>;
  };

  return (
    <>
      {/* Floating Chat Bubble Button */}
      <div className="fixed top-[250px] right-4 md:top-auto md:bottom-6 md:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-13 h-13 bg-brand text-white hover:bg-primary-dark rounded-full flex items-center justify-center shadow-md shadow-brand/25 cursor-pointer border border-[#7A8981]/40 transition-transform duration-200 hover:scale-105 active:scale-95 group focus:outline-none"
          aria-label="Engineering Assistant Chat"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center"
              >
                <MessageSquare className="w-5 h-5" />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Notification dot (Online Indicator) */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-brand border-2 border-white dark:border-[#0D100E] rounded-full"></span>
        </button>
      </div>

      {/* Floating Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="fixed top-[180px] right-4 md:top-auto md:bottom-24 md:right-6 z-50 w-[380px] h-[520px] max-h-[calc(100vh-16rem)] md:max-h-none max-w-[calc(100vw-2rem)] bg-[#F2F5F3]/98 dark:bg-[#0D100E]/98 border border-[#E2E6E2] dark:border-[#1A211D] rounded-3xl shadow-xl backdrop-blur-md flex flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-[#141A16] dark:bg-[#161916] p-4 text-white flex items-center justify-between border-b border-[#E2E6E2]/20 shadow-xs relative">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/10 text-white rounded-xl border border-white/15">
                  <HardHat className="w-4 h-4 text-[#D9B96E]" />
                </div>
                <div>
                  <h3 className="text-xs font-bold font-sans tracking-tight text-white flex items-center">
                    Engineering Assistant
                    <span className="w-1.5 h-1.5 bg-brand rounded-full ml-1.5 inline-block"></span>
                  </h3>
                  <span className="text-[9px] font-mono text-[#7A8981] uppercase tracking-wider block">Principal Structural AI</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleClearHistory}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Clear Conversation History"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  title="Close Assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Context bar if viewing a calculator */}
            {activeCalcDef && (
              <div className="bg-brand/8 dark:bg-brand/15 px-4 py-2 border-b border-[#E2E6E2] dark:border-[#1A211D] flex items-center justify-between text-[10px] font-mono text-[#7A8981]">
                <span className="flex items-center">
                  <Sparkles className="w-3 h-3 text-brand mr-1" />
                  Viewing: <strong>{activeCalcDef.name}</strong>
                </span>
                <span className="bg-brand/10 text-brand px-1.5 py-0.5 rounded uppercase font-bold text-[8px]">
                  Context Active
                </span>
              </div>
            )}

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-[#E2E6E2] dark:scrollbar-thumb-[#1A211D] scroll-smooth">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[11.5px] leading-relaxed shadow-3xs ${
                      msg.role === 'user'
                        ? 'bg-brand text-white rounded-tr-none'
                        : 'bg-[#F2F5F3] dark:bg-[#131715] text-[#141A16] dark:text-[#ECF2EE] rounded-tl-none border border-[#E2E6E2] dark:border-[#1A211D]'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <p className="whitespace-pre-wrap text-left">{msg.content}</p>
                    ) : (
                      renderMessageContent(msg.content)
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start items-center space-x-2">
                  <div className="bg-[#F2F5F3] dark:bg-[#131715] border border-[#E2E6E2] dark:border-[#1A211D] rounded-2xl rounded-tl-none px-4 py-3 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 text-[10px] text-[#7A8981] font-sans">
                <span className="flex items-center mb-1.5 font-bold">
                  <HelpCircle className="w-3 h-3 mr-1 text-brand" />
                  Suggested Engineering Queries:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      className="px-2.5 py-1 bg-[#F2F5F3] hover:bg-[#ECF2EE] dark:bg-[#131715] dark:hover:bg-[#181E1A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-lg text-[#141A16] dark:text-[#ECF2EE] cursor-pointer transition-colors text-[10px] text-left hover:border-brand font-medium"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-[#E2E6E2] dark:border-[#1A211D] bg-[#F2F5F3]/70 dark:bg-[#090B0A]/50 flex items-center space-x-2"
            >
              <input
                type="text"
                placeholder="Ask CivilMath AI... (e.g. concrete slump)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
                className="flex-grow bg-white dark:bg-[#090B0A] border border-[#E2E6E2] dark:border-[#1A211D] rounded-xl px-3.5 py-2 text-xs text-[#141A16] dark:text-[#ECF2EE] outline-none focus:border-brand font-sans placeholder:text-[#7A8981]"
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2 bg-brand hover:bg-primary-dark text-white rounded-xl flex items-center justify-center cursor-pointer transition-colors disabled:opacity-35"
                title="Send Message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
