import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BookOpen, 
  Languages, 
  BookMarked, 
  Highlighter, 
  Save, 
  Trash2, 
  Search, 
  ChevronRight,
  Sparkles,
  Plus,
  MessageSquare,
  Clock,
  Menu,
  RefreshCw,
  Play,
  ArrowRight,
  Split,
  FileText,
  Download,
  PenTool,
  Bold,
  Italic,
  Palette,
  X,
  Send,
  Bot,
  List,
  Type,
  CheckCircle2,
  FilePlus,
  StickyNote
} from 'lucide-react';

// --- STRICT COLOR PALETTE ---
const COLORS = {
  midnightGreen: '#03444A',    // Text, Dark Borders, Dark Background, Tab Text
  lightSeaGreen: '#00A8A8',    // Primary Buttons, Active Tabs Line, Sentence Lines
  nonPhotoBlue: '#9AD3DA',     // Cool Accent (Used sparingly, e.g. lightly tinted area)
  atomicTangerine: '#FF924D',  // General Accent, Word/Phrase Background, Action Buttons
  spanishOrange: '#E66414',    // Strong Highlight
  offWhite: '#FEFDF2'          // Main Background (Substitute for Pure White)
};

// --- FONT STACK (Charter for English, Blackbody for Chinese) ---
const FONT_EN = 'Charter, "Bitstream Charter", serif';
const FONT_CN = '"PingFang SC", "Microsoft YaHei", sans-serif';

// Robust JSON Cleaner
const cleanJson = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
      } catch (e2) {
        console.error("JSON Extraction Failed", e2);
        return null;
      }
    }
    return null;
  }
};

// --- 替换为：OpenAI API 调用函数 ---
const callOpenAI = async (prompt, systemInstruction = "", useJsonMode = false) => {
  // 1. 获取 OpenAI Key
  const apiKey = localStorage.getItem('user_openai_key'); // 注意：这里名字改成了 user_openai_key
  
  if (!apiKey) {
    alert("请先点击右上角设置您的 OpenAI API Key");
    throw new Error("No API Key provided");
  }

  const url = "https://api.openai.com/v1/chat/completions";
  
  // 2. 构建 OpenAI 请求体
  const payload = {
    model: "gpt-4o", // 如果未来出了 GPT-5，把这里改成 "gpt-5" 即可
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    // OpenAI 的 JSON 模式写法
    response_format: useJsonMode ? { type: "json_object" } : undefined
  };

  let attempt = 0;
  const delays = [1000, 2000, 3000];

  while (attempt <= delays.length) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // OpenAI 要求把 Key 放在这里
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`OpenAI Error: ${errData.error?.message || response.status}`);
      }
      
      const data = await response.json();
      // OpenAI 的返回路径不同
      return data.choices?.[0]?.message?.content || "";
      
    } catch (error) {
      console.error("API Call Failed:", error);
      if (attempt === delays.length) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      attempt++;
    }
  }
};

// Helper component to render text with bold formatting
// Added explicit removal of curly braces to prevent display issues
const RenderText = ({ text, className = "" }) => {
  if (text == null) return null;
  let content = "";
  if (typeof text === 'string') content = text;
  else if (Array.isArray(text)) content = text.join(', ');
  else if (typeof text === 'object') {
    try { content = JSON.stringify(text); } catch (e) { content = String(text); }
  } else content = String(text);

  // Remove curly braces that AI might erroneously include for structure
  content = content.replace(/[{}]/g, '');

  const html = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
};

// --- Components ---

// --- 修改：API Key 设置弹窗 ---
const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
  const [inputKey, setInputKey] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in">
        <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}>
          设置 OpenAI API Key
        </h3>
        <p className="text-sm mb-4 opacity-80" style={{ color: COLORS.midnightGreen }}>
          本项目将使用 OpenAI (GPT-4o) 模型。Key 仅存储在本地，不上传服务器。
          <br/><span className="text-red-500 font-bold">注意：OpenAI API 需要账户有余额才能使用。</span>
        </p>
        <input 
          type="password" 
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="sk-proj-..."
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:border-[#00A8A8]"
          style={{ fontFamily: 'monospace' }}
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">取消</button>
          <button 
            onClick={() => {
              if(inputKey.trim()) onSave(inputKey.trim());
            }}
            className="px-4 py-2 rounded-lg text-white text-sm font-bold shadow-md hover:shadow-lg transition-all"
            style={{ backgroundColor: COLORS.lightSeaGreen }}
          >
            保存并开始
          </button>
        </div>
        <div className="mt-4 text-xs text-center">
          <a href="https://platform.openai.com/api-keys" target="_blank" className="underline hover:text-[#00A8A8]" style={{ color: `${COLORS.midnightGreen}80` }}>
            获取 OpenAI API Key
          </a>
        </div>
      </div>
    </div>
  );
};

const ImportView = ({ onStart }) => {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col items-center justify-center h-full p-10" style={{ backgroundColor: COLORS.offWhite }}>
      <div className="w-full max-w-3xl shadow-xl rounded-2xl p-8 border" 
           style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS.lightSeaGreen}20`, color: COLORS.lightSeaGreen }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="font-bold" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN, fontSize: '20px' }}>导入新文章</h1>
            <p style={{ color: `${COLORS.midnightGreen}99`, fontFamily: FONT_CN, fontSize: '14px', marginTop: '2px' }}>开启精读学习之旅</p>
          </div>
        </div>
        
        <textarea
          className="w-full h-64 p-4 border rounded-xl focus:outline-none resize-none text-lg leading-relaxed mb-4"
          style={{ 
            borderColor: `${COLORS.midnightGreen}40`, 
            color: COLORS.midnightGreen,
            fontFamily: `${FONT_EN}, ${FONT_CN}`, 
            backgroundColor: `${COLORS.nonPhotoBlue}10`
          }}
          placeholder="在此粘贴英语文章..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="flex justify-end">
          <button
            onClick={() => text.trim() && onStart(text)}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-md hover:shadow-lg"
            style={{ backgroundColor: COLORS.lightSeaGreen, color: COLORS.offWhite, fontFamily: FONT_CN }}
          >
            开始学习 <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const AIChatModal = ({ isOpen, onClose, contextArticle }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '你好！我是你的 AI 助教。' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const articleContext = contextArticle ? `Context:\n${contextArticle.substring(0, 5000)}...\n\n` : "";
      const prompt = `${articleContext}History:\n${messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n')}\nUser: ${userMsg}\nAI:`;
      const response = await callOpenAI(prompt, "Helpful tutor.");
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error, try again." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col border z-50 animate-slide-up overflow-hidden font-sans"
         style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}30`, fontFamily: FONT_CN }}>
      <div className="p-4 flex justify-between items-center text-white shrink-0" style={{ backgroundColor: COLORS.midnightGreen }}>
        <div className="flex items-center gap-2 font-bold" style={{ color: COLORS.atomicTangerine }}> 
          <Bot size={20} /> AI 知识助手
        </div>
        <button onClick={onClose} className="hover:opacity-80 p-1 rounded" style={{ color: COLORS.offWhite }}><X size={18}/></button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ backgroundColor: COLORS.offWhite }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'text-white rounded-br-none' : 'rounded-bl-none'}`}
              style={{ 
                backgroundColor: msg.role === 'user' ? COLORS.lightSeaGreen : `${COLORS.nonPhotoBlue}33`,
                color: msg.role === 'user' ? COLORS.offWhite : COLORS.midnightGreen,
                border: msg.role === 'ai' ? `1px solid ${COLORS.midnightGreen}10` : 'none'
              }}
            >
              <RenderText text={msg.text} />
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="p-3 rounded-lg rounded-bl-none shadow-sm" style={{ backgroundColor: `${COLORS.nonPhotoBlue}33` }}>...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2 shrink-0" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="输入问题..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}40`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg disabled:opacity-50"
          style={{ backgroundColor: COLORS.atomicTangerine, color: COLORS.offWhite }}
        >
          <Send size={18} style={{ color: COLORS.offWhite }}/>
        </button>
      </div>
    </div>
  );
};

const NotesEditor = ({ initialHtml, onSave }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && initialHtml !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) onSave(editorRef.current.innerHTML);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border overflow-hidden" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}30` }}>
      <div className="flex flex-wrap items-center justify-between p-2 border-b" style={{ borderColor: `${COLORS.midnightGreen}20`, backgroundColor: `${COLORS.nonPhotoBlue}15` }}>
        <div className="flex flex-wrap items-center gap-1">
          <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><Bold size={16}/></button>
          <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><Italic size={16}/></button>
          <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><List size={16}/></button>
          <div className="h-4 w-px mx-1" style={{ backgroundColor: `${COLORS.midnightGreen}40` }}></div>
          <button onClick={() => execCmd('fontSize', '3')} className="p-1.5 hover:bg-black/5 rounded text-xs font-bold" style={{ color: COLORS.midnightGreen }}>A</button>
          <button onClick={() => execCmd('fontSize', '5')} className="p-1.5 hover:bg-black/5 rounded text-sm font-bold" style={{ color: COLORS.midnightGreen }}>A+</button>
          <div className="h-4 w-px mx-1" style={{ backgroundColor: `${COLORS.midnightGreen}40` }}></div>
          <div className="flex items-center gap-1">
             {[COLORS.midnightGreen, COLORS.lightSeaGreen, COLORS.nonPhotoBlue, COLORS.atomicTangerine, COLORS.spanishOrange].map(color => (
               <button 
                 key={color}
                 onClick={() => execCmd('foreColor', color)} 
                 className="w-3 h-3 rounded-full border hover:scale-125 transition-transform"
                 style={{ backgroundColor: color, borderColor: `${COLORS.midnightGreen}40` }}
               ></button>
             ))}
          </div>
        </div>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning={true}
        className="flex-1 p-4 focus:outline-none overflow-y-auto text-sm leading-relaxed prose prose-sm max-w-none"
        onInput={handleInput}
        style={{ backgroundColor: COLORS.offWhite, minHeight: '200px', fontFamily: 'Charter, "Bitstream Charter", serif', color: COLORS.midnightGreen }}
      />
    </div>
  );
};

const NotesManager = ({ notes, activeNoteId, onSaveNote, onCreateNote, onDeleteNote, onSelectNote }) => {
  const activeNote = notes.find(n => n.id === activeNoteId);
  const initialHtml = activeNote ? activeNote.content : "<div>开始记录笔记...</div>";

  const handleEditorSave = (content) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = content;
    const textContent = tmp.textContent || tmp.innerText || "";
    const title = activeNote?.title || (textContent.trim().substring(0, 20) + (textContent.length > 20 ? "..." : "") || "New Note");
    onSaveNote(content, title);
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return alert("没有笔记可导出");
    const stripHtml = (html) => {
       if (!html) return "";
       let processed = html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n");
       const tmp = document.createElement("DIV");
       tmp.innerHTML = processed;
       return (tmp.textContent || tmp.innerText || "").trim();
    };

    try {
      const textContent = notes.map(note => {
        const typeTag = note.type === 'entity' ? ' [专业术语]' : '';
        const cleanBody = stripHtml(note.content);
        return `【标题】 ${note.title || '无标题'}${typeTag}\n【时间】 ${note.date}\n【内容】\n${cleanBody}\n\n--------------------------------------------------\n`;
      }).join('\n');

      const blob = new Blob(['\ufeff', textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `My_Notes_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Export failed: " + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col h-[40%] shrink-0"> 
         <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-bold" style={{ color: `${COLORS.midnightGreen}99`, fontFamily: FONT_CN }}>编辑区域</span>
            <div className="flex items-center gap-2">
              <button onClick={onCreateNote} className="text-xs flex items-center gap-1 hover:opacity-80" style={{ color: COLORS.lightSeaGreen, fontFamily: FONT_CN }}><FilePlus size={14}/> 新建</button>
            </div>
         </div>
         <div className="h-full"><NotesEditorWrapper initialHtml={initialHtml} onSave={handleEditorSave} /></div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}>
        <div className="p-3 border-b text-xs font-bold uppercase tracking-wider flex items-center justify-between shrink-0"
             style={{ borderColor: `${COLORS.midnightGreen}10`, backgroundColor: `${COLORS.nonPhotoBlue}15`, color: COLORS.atomicTangerine, fontFamily: FONT_CN }}>
           <div className="flex items-center gap-2"><StickyNote size={14} style={{ color: COLORS.atomicTangerine }}/> 历史笔记 ({notes.length})</div>
           <button onClick={handleExportNotes} className="hover:opacity-70 transition-colors" style={{ color: COLORS.lightSeaGreen }} title="导出TXT"><Download size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {notes.length === 0 ? (
            <div className="text-center mt-10 text-xs" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN }}>暂无笔记<br/>点击上方保存按钮添加</div>
          ) : (
            notes.map(note => (
              <div 
                key={note.id} 
                onClick={() => onSelectNote(note.id)}
                className={`group p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm`}
                style={{ 
                  borderColor: activeNoteId === note.id ? COLORS.lightSeaGreen : `${COLORS.midnightGreen}15`,
                  backgroundColor: activeNoteId === note.id ? `${COLORS.lightSeaGreen}15` : COLORS.offWhite 
                }}
              >
                <div className="flex justify-between items-start">
                  <h4 className={`text-sm font-medium line-clamp-1`} style={{ color: activeNoteId === note.id ? COLORS.midnightGreen : `${COLORS.midnightGreen}CC`, fontFamily: FONT_CN }}>
                    {note.title || "无标题笔记"}
                  </h4>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                    className="hover:opacity-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: COLORS.spanishOrange }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                   <span className="text-[10px]" style={{ color: `${COLORS.midnightGreen}60` }}>{note.date}</span>
                   {note.type === 'entity' && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.atomicTangerine}40`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}>术语</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Wrapper component to pass through save
const NotesEditorWrapper = ({ initialHtml, onSave }) => {
    const editorRef = useRef(null);

    useEffect(() => {
      if (editorRef.current && initialHtml !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = initialHtml;
      }
    }, [initialHtml]);
  
    const execCmd = (command, value = null) => {
      document.execCommand(command, false, value);
      editorRef.current.focus();
    };
  
    const handleInput = () => {
      // Auto save logic could go here
    };

    return (
      <div className="flex flex-col h-full rounded-xl border overflow-hidden" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}30` }}>
        <div className="flex flex-wrap items-center justify-between p-2 border-b" style={{ borderColor: `${COLORS.midnightGreen}20`, backgroundColor: `${COLORS.nonPhotoBlue}15` }}>
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><Bold size={16}/></button>
            <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><Italic size={16}/></button>
            <button onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-black/5 rounded" style={{ color: COLORS.midnightGreen }}><List size={16}/></button>
            <div className="h-4 w-px mx-1" style={{ backgroundColor: `${COLORS.midnightGreen}40` }}></div>
            <button onClick={() => execCmd('fontSize', '3')} className="p-1.5 hover:bg-black/5 rounded text-xs font-bold" style={{ color: COLORS.midnightGreen }}>A</button>
            <button onClick={() => execCmd('fontSize', '5')} className="p-1.5 hover:bg-black/5 rounded text-sm font-bold" style={{ color: COLORS.midnightGreen }}>A+</button>
            <div className="h-4 w-px mx-1" style={{ backgroundColor: `${COLORS.midnightGreen}40` }}></div>
            <div className="flex items-center gap-1">
               {[COLORS.midnightGreen, COLORS.lightSeaGreen, COLORS.nonPhotoBlue, COLORS.atomicTangerine, COLORS.spanishOrange].map(color => (
                 <button key={color} onClick={() => execCmd('foreColor', color)} className="w-3 h-3 rounded-full border hover:scale-125 transition-transform" style={{ backgroundColor: color, borderColor: `${COLORS.midnightGreen}40` }}></button>
               ))}
            </div>
          </div>
          <button 
            onClick={() => onSave(editorRef.current.innerHTML)}
            className="ml-2 flex items-center gap-1 text-white px-3 py-1.5 rounded-full transition-colors"
            style={{ backgroundColor: COLORS.atomicTangerine, color: COLORS.offWhite, fontSize: '0.75rem' }}
          >
            <Save size={14} style={{ color: COLORS.offWhite }} /> 保存
          </button>
        </div>
        <div 
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          className="flex-1 p-4 focus:outline-none overflow-y-auto text-sm leading-relaxed prose prose-sm max-w-none"
          onInput={handleInput}
          style={{ backgroundColor: COLORS.offWhite, minHeight: '200px', fontFamily: 'Charter, "Bitstream Charter", serif', color: COLORS.midnightGreen }}
        />
      </div>
    );
};

// --- Recursive Highlighting Component ---
const HighlightedText = ({ text, analysisCache, onClickCache }) => {
  const getMatches = (str) => {
    const keys = Object.keys(analysisCache).sort((a, b) => b.length - a.length);
    const matches = [];
    keys.forEach(key => {
      if (key.length < 2) return;
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`(${escaped})`, 'gi'); 
      let match;
      while ((match = regex.exec(str)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          key: match[0], // Use matched string for key
          cache: analysisCache[key]
        });
      }
    });
    return matches;
  };

  const buildTree = (str, index, end, matches) => {
    const nodes = [];
    let cursor = index;
    const sortedMatches = matches.filter(m => m.start >= cursor && m.end <= end).sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.a.end));

    while (cursor < end) {
      const match = sortedMatches.find(m => m.start >= cursor);
      if (!match) { nodes.push(str.substring(cursor, end)); break; }
      if (match.start > cursor) nodes.push(str.substring(cursor, match.start));

      const isSentence = match.key.split(/\s+/).length > 3; 
      
      let style = { cursor: 'pointer', transition: 'all 0.2s', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', color: COLORS.midnightGreen };
      
      if (isSentence) {
        // Sentence: Light Sea Green Underline (#00A8A8)
        style.borderBottom = `2px solid ${COLORS.lightSeaGreen}`;
        style.paddingBottom = '0px'; // No padding for close to text
      } else {
        style.borderRadius = '2px';
        style.padding = '0 2px';
        
        // Unified Atomic Tangerine (FF924D) for all vocabulary backgrounds (50% opacity)
        style.backgroundColor = `${COLORS.atomicTangerine}80`; 
      }

      const innerMatches = matches.filter(m => m.start >= match.start && m.end <= match.end && m !== match);
      
      nodes.push(
        <span 
          key={`${match.key}-${match.start}`}
          style={style}
          onClick={(e) => {
            e.stopPropagation();
            onClickCache(match.cache, match.key);
          }}
        >
          {buildTree(str, match.start, match.end, innerMatches)}
        </span>
      );
      cursor = match.end;
    }
    return nodes;
  };

  const allMatches = getMatches(text);
  return <>{buildTree(text, 0, text.length, allMatches)}</>;
};


// --- Main App ---

const App = () => {
  const [articles, setArticles] = useState([]); 
  const [activeArticleId, setActiveArticleId] = useState(null); 
  const [selection, setSelection] = useState(null); 
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('analysis'); 
  const [showHistory, setShowHistory] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [wordBank, setWordBank] = useState([]);
  const [sentenceBank, setSentenceBank] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [expandedMeanings, setExpandedMeanings] = useState({}); 
  const [analysisCache, setAnalysisCache] = useState({});
  const readingAreaRef = useRef(null);
  // ====== 1. OpenAI Key 逻辑开始 ======
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [hasKey, setHasKey] = useState(!!localStorage.getItem('user_openai_key'));

  // 自动检查：如果没有 Key，就弹出窗口
  useEffect(() => {
    if (!localStorage.getItem('user_openai_key')) {
      setShowKeyModal(true);
    }
  }, []);

  // 保存 Key 的功能
  const handleSaveKey = (key) => {
    localStorage.setItem('user_openai_key', key);
    setHasKey(true);
    setShowKeyModal(false);
    triggerToast(); 
  };
  
  // ====== OpenAI Key 逻辑结束 ======

  // --- Persistence ---
  useEffect(() => {
    const savedWords = localStorage.getItem('english_word_bank');
    const savedSentences = localStorage.getItem('english_sentence_bank');
    const savedNotes = localStorage.getItem('english_notes_list'); 
    const savedArticles = localStorage.getItem('english_articles');
    const savedCache = localStorage.getItem('english_analysis_cache');
    if (savedWords) setWordBank(JSON.parse(savedWords));
    if (savedSentences) setSentenceBank(JSON.parse(savedSentences));
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedCache) setAnalysisCache(JSON.parse(savedCache));
    if (savedArticles) {
      const parsed = JSON.parse(savedArticles);
      setArticles(parsed);
      if (parsed.length > 0) setActiveArticleId(parsed[0].id);
    }
  }, []);

  useEffect(() => { localStorage.setItem('english_word_bank', JSON.stringify(wordBank)); }, [wordBank]);
  useEffect(() => { localStorage.setItem('english_sentence_bank', JSON.stringify(sentenceBank)); }, [sentenceBank]);
  useEffect(() => { localStorage.setItem('english_notes_list', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('english_analysis_cache', JSON.stringify(analysisCache)); }, [analysisCache]);
  useEffect(() => { const timer = setTimeout(() => { localStorage.setItem('english_articles', JSON.stringify(articles)); }, 500); return () => clearTimeout(timer); }, [articles]);

  const triggerToast = () => { setShowToast(true); setTimeout(() => setShowToast(false), 2000); };
  const handleCacheClick = (cachedResult, key) => { setSelection({ text: key, context: 'Cached', type: 'cache_hit' }); setAnalysisResult(cachedResult); setSidebarTab('analysis'); };
  
  // Fixed paragraph click handler reference
  const handleParagraphClick = (e) => {
    const target = e.target.closest('span[style*="background-color"], span[style*="border-bottom"]');
    if (target) { /* Handled by child */ }
  };

  const handleStart = (text) => {
    const rawParagraphs = text.split(/\n+/).filter(p => p.trim() !== '');
    // Use first line as title, no truncation in logic, let UI handle it
    const title = rawParagraphs[0]?.trim() || "Untitled";
    const newArticleId = Date.now().toString();
    const initialParagraphs = rawParagraphs.map((p) => ({ en: p.trim(), cn: '', translating: false }));
    setArticles(prev => [{ id: newArticleId, title, date: new Date().toLocaleString(), paragraphs: initialParagraphs }, ...prev]);
    setActiveArticleId(newArticleId);
  };

  const handleDeleteArticle = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete?")) {
      setArticles(prev => prev.filter(a => a.id !== id));
      if (activeArticleId === id) { setActiveArticleId(null); setSelection(null); setAnalysisResult(null); }
    }
  };

  const handleTranslateParagraph = async (index, text) => {
    if (!activeArticleId) return;
    const updatePara = (updates) => setArticles(prev => prev.map(a => a.id === activeArticleId ? { ...a, paragraphs: a.paragraphs.map((p, i) => i === index ? { ...p, ...updates } : p) } : a));
    updatePara({ translating: true });
    try {
      const translation = await callOpenAI(`Translate to Chinese (Simplified): "${text}"`, "", false);
      updatePara({ cn: translation, translating: false });
    } catch (e) { updatePara({ translating: false }); }
  };

  const handleAnalyzeFullText = async () => {
    const activeArticle = articles.find(a => a.id === activeArticleId);
    if (!activeArticle) return;
    setLoadingAnalysis(true);
    setSelection({ text: "Full Article Analysis", type: "fulltext" }); 
    setSidebarTab('analysis');
    setAnalysisResult(null);
    try {
      const fullText = activeArticle.paragraphs.map(p => p.en).join('\n');
      const prompt = `Analyze logic/viewpoints: ${fullText.substring(0, 8000)}... Output JSON: { "type": "fulltext", "core_viewpoint": "Chinese summary", "logic_flow": "Chinese logic breakdown" }`;
      const resJson = cleanJson(await callOpenAI(prompt, "Expert tutor", true));
      if (resJson) setAnalysisResult({ ...resJson, original: "Full Text Analysis" });
    } catch (e) { setAnalysisResult({ type: 'error', content: "分析失败" }); } 
    finally { setLoadingAnalysis(false); }
  };

  const handleExportWords = () => {
    if (wordBank.length === 0) return alert("Empty");
    const cleanText = (html) => { const tmp = document.createElement("DIV"); tmp.innerHTML = html || ""; return (tmp.textContent || tmp.innerText || "").replace(/\*\*/g, ''); };
    try {
      const content = wordBank.map(w => `${w.word} - ${cleanText(w.example?.en)} ${cleanText(w.example?.cn)}`).join('\n');
      const blob = new Blob(['\ufeff', content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `Vocabulary.txt`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (e) { alert("Export failed"); }
  };

  const analyzeSelection = async (text, context, targetType) => {
    if (analysisCache[text]) { setAnalysisResult(analysisCache[text]); setSidebarTab('analysis'); return; }
    setLoadingAnalysis(true); setAnalysisResult(null); setExpandedMeanings({}); 
    try {
      let prompt = "";
      if (targetType === 'grammar') {
        prompt = `
      You are an English sentence analysis assistant for Chinese learners. 
      Your job is to break down long, difficult English sentences in a way that is clear, intuitive, and easy to understand (no grammar jargon).
      
      Analyze the sentence: "${text}"
      Context: "${context}"
      
      Output JSON in this format (no extra text):
      {
        "type": "grammar",
        "main_structure": "Chinese explanation of the core meaning. Identify the main clause. Use natural Chinese, not grammar terminology.",
        "internal_structure": "Break the sentence into smaller parts using bullet points. For each part: show the English fragment + give a simple Chinese explanation of what it does (e.g., 表示结果, 补充说明, 描述动作对象). Avoid grammar jargon.",
        "visual_structure": "Provide a tree-style hierarchical breakdown. Use only Chinese functional labels such as [主干], [补充], [说明], [结果], [动作对象]. Each level on a new line with indentation. Do not use grammar terms."
      }
      
      Rules:
      - 中文必须作为解释语言；英文只用于呈现句子片段。
      - Avoid terms like: non-restrictive clause, participle clause, adverbial modifier, gerund, etc.
      - Use intuitive functional descriptions: “表示结果”, “导致…”, “补充说明”, “进一步解释…”.
      - The visual structure must clearly show indentation and layers like:
      
      [主干] ...
          [补充] ...
              [说明] ...
      
      Do NOT use curly braces {} inside the JSON values. Bold key English terms.
        `;
      } else {
        // UPDATED PROMPT: Simplified rewrite (under 30 words) and restricted common meanings. 
        // Changed instruction to prefer natural translation over dictionary definition.
        prompt = `Analyze: "${text}" Context: "${context}". 
        
        If Proper Noun (Entity): 
        Return JSON: { "type": "entity", "explanation": "Encyclopedic explanation in Chinese." } 

        If General Word/Phrase:
        Return JSON:
        {
          "type": "word",
          "synonyms": "2-3 Chinese synonyms",
          "context_meaning": "The most natural, smooth Chinese translation of this text in the given context. Avoid stiff dictionary definitions.",
          "other_meanings": ["Chinese Meaning A", "Chinese Meaning B"], 
          "examples": [
             { "en": "Rewrite the ORIGINAL sentence from context. Keep it concise (under 30 words). You may simplify or slightly alter the original meaning to make it a clear example.", "cn": "Natural Chinese translation" },
             { "en": "A new example sentence for the context meaning.", "cn": "Natural Chinese translation" },
             { "en": "Another new example sentence.", "cn": "Natural Chinese translation" }
          ]
        }
        
        Constraints:
        1. "other_meanings": List 0 to 3 other COMMON meanings. Only list meanings that are significantly different from the "context_meaning". Do NOT list rare meanings. If no distinct common meanings exist, return an empty array.
        2. Wrap the target word in **double asterisks** in all English examples.
        `;
      }
      const resJson = cleanJson(await callOpenAI(prompt, "Expert English Teacher JSON", true));
      if (resJson) {
        if (!resJson.type) resJson.type = targetType; 
        const newResult = { ...resJson, original: text };
        setAnalysisResult(newResult);
        setAnalysisCache(prev => ({ ...prev, [text]: newResult }));
      }
    } catch (error) { setAnalysisResult({ type: 'error', content: '分析失败' }); } 
    finally { setLoadingAnalysis(false); }
  };

  const generateExamplesForMeaning = async (meaningLabel, index) => {
    setExpandedMeanings(prev => ({ ...prev, [index]: { loading: true, examples: [] } }));
    try {
      const prompt = `Generate 3 examples for "${selection.text}" meaning "${meaningLabel}". JSON: { "examples": [ { "en": "...", "cn": "..." }... ] } Wrap target in **stars**.`;
      const res = cleanJson(await callOpenAI(prompt, "", true));
      if (res?.examples) setExpandedMeanings(prev => ({ ...prev, [index]: { loading: false, examples: res.examples } }));
    } catch (e) { setExpandedMeanings(prev => ({ ...prev, [index]: { loading: false, examples: [] } })); }
  };

  const handleTextSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (!text) return;
    const readingArea = readingAreaRef.current;
    if (readingArea && (!readingArea.contains(sel.anchorNode) || !readingArea.contains(sel.focusNode))) return;
    const context = sel.anchorNode?.parentElement?.textContent || "";
    const type = text.split(/\s+/).length > 5 || /[.!?]/.test(text) ? 'sentence' : 'word';
    setSelection({ text, context, type }); setSidebarTab('analysis'); analyzeSelection(text, context, type === 'sentence' ? 'grammar' : 'word');
  }, [analysisCache]);

  const saveWordToNotebook = (exampleItem) => {
    const newEntry = { id: Date.now(), word: selection.text, example: exampleItem, date: new Date().toLocaleString() };
    setWordBank(prev => [newEntry, ...prev]); triggerToast(); 
  };

  const saveEntityToNotebook = () => {
    const content = `<div><b>${selection.text}</b></div><div style="margin-top: 8px;">${analysisResult.explanation}</div>`;
    const newNote = { id: Date.now(), title: selection.text, content: content, date: new Date().toLocaleString(), type: 'entity' };
    setNotes(prev => [newNote, ...prev]); setSidebarTab('notes'); setActiveNoteId(newNote.id); triggerToast();
  };

  const saveSentenceToNotebook = () => {
    const content = `【主干】\n${analysisResult.main_structure}\n\n【内部分析】\n${analysisResult.internal_structure}\n\n【结构图示】\n${analysisResult.visual_structure}`;
    const newEntry = { id: Date.now(), text: selection.text, structure: content, date: new Date().toLocaleString() };
    setSentenceBank(prev => [newEntry, ...prev]); triggerToast();
  };

  const handleSaveNote = (content, title) => {
    const ts = new Date().toLocaleString();
    if (activeNoteId) { setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content, title: title || n.title, date: ts } : n)); } 
    else { const newNote = { id: Date.now(), title: title || "Untitled", content, date: ts, type: 'user' }; setNotes(prev => [newNote, ...prev]); setActiveNoteId(newNote.id); }
    triggerToast();
  };

  // Notes Actions
  const handleCreateNote = () => setActiveNoteId(null);
  const handleDeleteNote = (id) => { if (window.confirm("Delete?")) { setNotes(prev => prev.filter(n => n.id !== id)); if (activeNoteId === id) setActiveNoteId(null); } };

  const activeArticle = articles.find(a => a.id === activeArticleId);

  return (
    <div className="flex h-screen w-full overflow-hidden relative" style={{ backgroundColor: COLORS.offWhite, fontFamily: 'Arial, sans-serif' }}>
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full shadow-lg transition-opacity duration-300 z-50 flex items-center gap-2 pointer-events-none ${showToast ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundColor: `${COLORS.midnightGreen}E6`, color: COLORS.offWhite, fontFamily: FONT_CN }}>
        <CheckCircle2 size={16} style={{ color: COLORS.lightSeaGreen }} /> <span className="text-sm font-medium">已保存</span>
      </div>

      <div className={`flex flex-col transition-all duration-300 ${showHistory ? 'w-64' : 'w-0 overflow-hidden'}`} style={{ backgroundColor: COLORS.midnightGreen }}>
        <div className="h-16 px-4 border-b flex items-center justify-between shrink-0" style={{ borderColor: `${COLORS.offWhite}20` }}>
          <span className="font-bold flex items-center gap-2" style={{ color: COLORS.offWhite, fontFamily: FONT_CN }}><BookOpen size={18}/> 文章库</span>
          <button onClick={() => setActiveArticleId(null)} className="p-1 hover:bg-white/10 rounded" style={{ color: COLORS.offWhite }}><Plus size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* New Article Link */}
          <div onClick={() => setActiveArticleId(null)} className={`w-full relative px-3 py-3 rounded-lg cursor-pointer transition-colors ${activeArticleId === null ? 'bg-white/20' : 'hover:bg-white/10'}`} style={{ color: COLORS.offWhite }}>
            <div className="font-bold flex items-center gap-2" style={{ color: COLORS.offWhite, fontFamily: FONT_CN, fontSize: '14px' }}>
                <FilePlus size={16} /> 新文章
            </div>
          </div>

          {articles.map(article => (
            <div key={article.id} onClick={() => setActiveArticleId(article.id)} className={`group w-full relative px-3 py-3 rounded-lg cursor-pointer transition-colors ${activeArticleId === article.id ? 'bg-white/20' : 'hover:bg-white/10'}`} style={{ color: activeArticleId === article.id ? COLORS.offWhite : `${COLORS.offWhite}99` }}>
              <div className="flex items-start gap-2 pr-6">
                <MessageSquare size={14} className="mt-1 shrink-0 opacity-70" />
                <div><div className="text-sm font-medium line-clamp-1">{article.title}</div><div className="text-[10px] opacity-60 flex items-center gap-1 mt-1"><Clock size={10} /> {article.date.split(' ')[0]}</div></div>
              </div>
              <button onClick={(e) => handleDeleteArticle(e, article.id)} className="absolute right-2 top-3 p-1.5 rounded hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: COLORS.spanishOrange }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full relative" style={{ backgroundColor: COLORS.offWhite }}>
        <header className="h-16 border-b flex items-center px-4 shrink-0 justify-between" style={{ borderColor: `${COLORS.midnightGreen}20` }}>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowHistory(!showHistory)} className="p-2 hover:bg-black/5 rounded-lg" style={{ color: COLORS.midnightGreen }}><Menu size={20} /></button>{/* 新增：API Key 设置按钮 */}
             <button 
               onClick={() => setShowKeyModal(true)} 
               className={`p-2 hover:bg-black/5 rounded-lg ml-2 ${!hasKey ? 'animate-bounce text-red-500' : ''}`} 
               style={{ color: hasKey ? COLORS.midnightGreen : '#E66414' }}
               title="设置 OpenAI API Key"
             >
               <Bot size={20} />
             </button>
             {activeArticle ? (
               <div className="flex items-center gap-3">
                 <h2 className="font-bold text-lg line-clamp-1 max-w-md font-sans" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}>{activeArticle.title}</h2>
                 <button onClick={handleAnalyzeFullText} className="p-2 rounded-lg transition-colors" style={{ color: COLORS.atomicTangerine, backgroundColor: `${COLORS.atomicTangerine}15` }} title="AI 全文深度分析"><FileText size={18} /></button>
               </div>
             ) : (
                <div 
                    className="font-bold"
                    style={{ 
                        color: COLORS.midnightGreen,
                        fontFamily: FONT_CN,
                        fontSize: '16px'
                    }}
                >
                    新文章
                </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {!activeArticleId ? <ImportView onStart={handleStart} /> : activeArticle ? (
            <div ref={readingAreaRef} id="reading-area" className="max-w-4xl mx-auto p-8 space-y-8 min-h-full border-x border-transparent" style={{ backgroundColor: COLORS.offWhite }}>
              {activeArticle.paragraphs.map((para, index) => (
                <div key={index} className="group relative">
                  <div 
                    className="text-xl leading-8 mb-3 transition-colors rounded cursor-text" 
                    style={{ color: COLORS.midnightGreen, fontFamily: `${FONT_EN}, ${FONT_CN}` }} 
                    onMouseUp={handleTextSelection}
                  >
                    <HighlightedText text={para.en} analysisCache={analysisCache} onClickCache={handleCacheClick} />
                  </div>
                  <div className="min-h-[24px]">
                    {para.cn ? <p className="text-base leading-relaxed p-3 rounded-lg border-l-4 animate-fade-in" style={{ backgroundColor: `${COLORS.nonPhotoBlue}15`, borderColor: `${COLORS.lightSeaGreen}60`, color: `${COLORS.midnightGreen}CC`, fontFamily: FONT_CN }}>{para.cn}</p> : 
                      <div className="flex items-center gap-2 text-sm py-2 px-3">{para.translating ? <><span className="animate-spin h-3 w-3 border-2 border-t-transparent rounded-full" style={{ borderColor: COLORS.lightSeaGreen }}></span><span className="italic" style={{ color: COLORS.lightSeaGreen, fontFamily: FONT_CN }}>正在翻译...</span></> : 
                        <button onClick={() => handleTranslateParagraph(index, para.en)} className="text-xs font-medium px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 hover:opacity-80" style={{ borderColor: `${COLORS.lightSeaGreen}40`, color: COLORS.lightSeaGreen, fontFamily: FONT_CN }}><Languages size={14} /> 点击翻译</button>}
                      </div>}
                  </div>
                </div>
              ))}
              <div className="h-20"></div>
            </div>
          ) : <div className="flex items-center justify-center h-full" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN }}>文章加载错误</div>}
        </div>
      </div>

      <div className="w-[450px] flex flex-col h-full shadow-xl z-20 border-l" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}>
        <div className="h-16 border-b shrink-0 flex" style={{ borderColor: `${COLORS.midnightGreen}10` }}>
          {['analysis', 'words', 'sentences', 'notes'].map(tab => (
            <button key={tab} onClick={() => setSidebarTab(tab)} className={`flex-1 h-full flex items-center justify-center gap-2 transition-colors border-b-2 font-bold text-sm`} style={{ color: sidebarTab === tab ? COLORS.midnightGreen : `${COLORS.midnightGreen}80`, borderColor: sidebarTab === tab ? COLORS.lightSeaGreen : 'transparent', backgroundColor: sidebarTab === tab ? `${COLORS.lightSeaGreen}10` : 'transparent', fontFamily: FONT_CN }}> {/* Added font-bold */}
              {tab === 'analysis' && <Sparkles size={16}/>} {tab === 'words' && <BookMarked size={16}/>} {tab === 'sentences' && <Highlighter size={16}/>} {tab === 'notes' && <PenTool size={16}/>}
              {tab === 'analysis' ? '分析' : tab === 'words' ? '生词' : tab === 'sentences' ? '句库' : '笔记'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: `${COLORS.nonPhotoBlue}10` }}>
          {sidebarTab === 'analysis' && (
            <div className="space-y-6">
              {!selection && !analysisResult ? <div className="text-center mt-20 flex flex-col items-center" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN, fontSize: '14px' }}><Search size={32} className="mb-2" /><p>选中内容进行分析</p></div> :
                <>
                  {selection && selection.type !== 'fulltext' && <div className="p-4 rounded-xl border" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}><div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN }}>{selection.type === 'cache_hit' ? '已查阅 (Cached)' : '选中内容'}</span>{selection.type === 'cache_hit' && <span className="text-xs font-medium" style={{ color: COLORS.lightSeaGreen, fontFamily: FONT_CN }}>⚡ 即时加载</span>}</div><p className="text-lg border-l-2 pl-3" style={{ borderColor: COLORS.lightSeaGreen, color: COLORS.midnightGreen, fontFamily: `${FONT_EN}, ${FONT_CN}` }}>"{selection.text}"</p></div>}
                  {loadingAnalysis && <div className="flex flex-col items-center justify-center py-10 space-y-3"><div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full" style={{ borderColor: COLORS.lightSeaGreen }}></div><p className="text-sm animate-pulse" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>AI 正在深度解析...</p></div>}
                  {analysisResult && !loadingAnalysis && (
                    <div className="rounded-xl border overflow-hidden animate-slide-up" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}>
                      {analysisResult.type === 'fulltext' && <div className="p-6"><h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><FileText size={20} /> 全文逻辑深度解析</h3><div className="mb-6"><h4 className="text-sm font-bold uppercase mb-2" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>核心观点</h4><p className="text-sm leading-relaxed p-3 rounded-lg" style={{ backgroundColor: `${COLORS.lightSeaGreen}10`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.core_viewpoint} /></p></div><div><h4 className="text-sm font-bold uppercase mb-2" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>逻辑脉络</h4><div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.logic_flow} /></div></div></div>}
                      {analysisResult.type === 'word' && <div className="p-6"><div className="mb-6"><div className="inline-block border-b-2 mb-2" style={{ borderColor: COLORS.lightSeaGreen }}><h2 className="text-xl font-bold" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}>{analysisResult.original}</h2></div><div className="mt-2 font-medium" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.synonyms} /></div><div className="text-sm mt-1 p-2 rounded" style={{ backgroundColor: `${COLORS.nonPhotoBlue}20`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.context_meaning} /></div></div><div><h4 className="text-sm font-bold uppercase mb-3" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>Context Examples</h4><div className="space-y-4">{analysisResult.examples?.map((ex, idx) => (<div key={idx} className="flex gap-3 items-start group"><button onClick={() => saveWordToNotebook(ex)} className="mt-1 transition-colors shrink-0 hover:opacity-80" style={{ color: COLORS.atomicTangerine }}><BookMarked size={18} /></button><div className="text-sm leading-relaxed w-full" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><div className="flex items-baseline"><span className="font-bold mr-2" style={{ color: COLORS.midnightGreen }}>{idx + 1}.</span><span className="flex-1"><RenderText text={ex.en} /></span></div><div className="mt-1 pl-5 border-l-2 ml-1" style={{ borderColor: `${COLORS.midnightGreen}20`, color: `${COLORS.midnightGreen}80` }}><RenderText text={ex.cn} /></div></div></div>))}</div></div>{analysisResult.other_meanings && <div className="mt-8 pt-6 border-t" style={{ borderColor: `${COLORS.midnightGreen}10` }}><h4 className="text-sm font-bold uppercase mb-3" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>Other Common Meanings</h4><div className="space-y-2">{analysisResult.other_meanings.map((meaning, idx) => (<div key={idx} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: `${COLORS.nonPhotoBlue}15` }}><span className="text-sm font-medium" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={meaning} /></span><button onClick={() => generateExamplesForMeaning(meaning, idx)} className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors hover:opacity-80" style={{ backgroundColor: `${COLORS.atomicTangerine}15`, color: COLORS.atomicTangerine, fontFamily: FONT_CN }} disabled={expandedMeanings[idx]?.loading}>{expandedMeanings[idx]?.loading ? '生成中...' : <><Play size={10} fill="currentColor" /> 造句</>}</button></div>))}</div>{Object.keys(expandedMeanings).map(key => expandedMeanings[key].examples && (<div key={key} className="mt-3 space-y-3 pt-2 border-t pl-2" style={{ borderColor: `${COLORS.midnightGreen}10` }}>{expandedMeanings[key].examples.map((ex, exIdx) => (<div key={exIdx} className="flex gap-2 items-start"><button onClick={() => saveWordToNotebook(ex)} className="shrink-0 mt-0.5 hover:opacity-80" style={{ color: COLORS.atomicTangerine }}><Save size={14}/></button><div className="text-xs w-full" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><div className="flex items-baseline"><span className="font-bold mr-1" style={{ color: COLORS.midnightGreen }}>{exIdx + 1}.</span><span><RenderText text={ex.en} /></span></div><div className="mt-0.5 pl-3" style={{ color: `${COLORS.midnightGreen}80` }}><RenderText text={ex.cn} /></div></div></div>))}</div>))}</div>}</div>}
                      {analysisResult.type === 'entity' && <div className="p-6"><div className="flex justify-between items-start"><div className="inline-block border-b-2 mb-4" style={{ borderColor: COLORS.atomicTangerine }}><h4 className="text-lg font-bold" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}>{analysisResult.original}</h4></div><button onClick={saveEntityToNotebook} className="text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors text-white hover:opacity-90" style={{ backgroundColor: COLORS.atomicTangerine, color: COLORS.offWhite, fontFamily: FONT_CN }}><Save size={14} style={{ color: COLORS.offWhite }}/> 保存术语</button></div><h4 className="text-sm font-bold uppercase mb-2" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>百科解释</h4><p className="text-sm leading-relaxed mt-2" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.explanation} /></p></div>}
                      {analysisResult.type === 'grammar' && <div className="p-6 space-y-6"><div className="flex justify-between items-center pb-2 border-b" style={{ borderColor: `${COLORS.midnightGreen}10` }}><h4 className="text-sm font-bold uppercase" style={{ color: `${COLORS.midnightGreen}80`, fontFamily: FONT_CN }}>Sentence Analysis</h4><button onClick={saveSentenceToNotebook} className="text-xs flex items-center gap-1 px-2 py-1 rounded text-white hover:opacity-90" style={{ backgroundColor: COLORS.atomicTangerine, color: COLORS.offWhite, fontFamily: FONT_CN }}><Save size={14} style={{ color: COLORS.offWhite }}/> 保存分析</button></div><div className="space-y-5"><div><div className="text-base font-bold mb-2 flex items-center gap-1" style={{ color: COLORS.spanishOrange, fontFamily: FONT_CN }}><Split size={16}/> 1. 主干结构</div><div className="text-sm p-3 rounded-lg leading-relaxed whitespace-pre-line" style={{ backgroundColor: `${COLORS.spanishOrange}10`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.main_structure} /></div></div><div><div className="text-base font-bold mb-2 flex items-center gap-1" style={{ color: COLORS.lightSeaGreen, fontFamily: FONT_CN }}><Search size={16}/> 2. 短语内部逻辑</div><div className="text-sm p-3 rounded-lg leading-relaxed whitespace-pre-line" style={{ backgroundColor: `${COLORS.lightSeaGreen}10`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.internal_structure} /></div></div><div><div className="text-base font-bold mb-2 flex items-center gap-1" style={{ color: COLORS.atomicTangerine, fontFamily: FONT_CN }}><ArrowRight size={16}/> 3. 结构图示</div><div className="text-xs font-mono p-3 rounded-lg overflow-x-auto whitespace-pre leading-6" style={{ backgroundColor: `${COLORS.atomicTangerine}10`, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><RenderText text={analysisResult.visual_structure} /></div></div></div></div>}
                    </div>
                  )}
                </>}
            </div>
          )}
          {sidebarTab === 'words' && <div className="space-y-3"><div className="flex justify-end pb-2"><button onClick={handleExportWords} className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: COLORS.midnightGreen, fontFamily: FONT_CN }}><Download size={14} /> 导出单词</button></div>{wordBank.length === 0 ? <div className="text-center mt-20" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN }}>暂无生词</div> : wordBank.map((item) => (<div key={item.id} className="p-4 rounded-xl border hover:shadow-md transition-all" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-bold border-b-2" style={{ color: COLORS.spanishOrange, borderColor: `${COLORS.atomicTangerine}80`, fontFamily: FONT_CN }}>{item.word}</h3><button onClick={() => setWordBank(prev => prev.filter(w => w.id !== item.id))} className="hover:text-red-500" style={{ color: `${COLORS.midnightGreen}40` }}><Trash2 size={14} /></button></div><div className="p-3 rounded-lg text-sm border-l-4" style={{ backgroundColor: `${COLORS.nonPhotoBlue}15`, borderColor: COLORS.lightSeaGreen, color: COLORS.midnightGreen, fontFamily: FONT_CN }}><div className="mb-1"><RenderText text={item.example.en} /></div><div className="text-xs pt-1 border-t" style={{ borderColor: `${COLORS.midnightGreen}10`, color: `${COLORS.midnightGreen}80` }}><RenderText text={item.example.cn} /></div></div></div>))}</div>}
          {sidebarTab === 'sentences' && <div className="space-y-3">{sentenceBank.length === 0 ? <div className="text-center mt-20" style={{ color: `${COLORS.midnightGreen}60`, fontFamily: FONT_CN }}>暂无句库</div> : sentenceBank.map((item) => (<div key={item.id} className="p-4 rounded-xl border hover:shadow-md transition-all" style={{ backgroundColor: COLORS.offWhite, borderColor: `${COLORS.midnightGreen}20` }}><div className="flex justify-between items-start mb-2"><p className="text-sm font-serif italic pr-4 line-clamp-2" style={{ color: COLORS.spanishOrange, fontFamily: 'Charter, "Bitstream Charter", serif, "PingFang SC", "Microsoft YaHei", sans-serif' }}>"{item.text}"</p><button onClick={() => setSentenceBank(prev => prev.filter(s => s.id !== item.id))} className="hover:text-red-500 shrink-0" style={{ color: `${COLORS.midnightGreen}40` }}><Trash2 size={14} /></button></div><div className="text-xs mt-2 pt-2 border-t whitespace-pre-wrap leading-relaxed" style={{ borderColor: `${COLORS.midnightGreen}10`, color: `${COLORS.midnightGreen}80`, fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif' }}><RenderText text={item.structure} /></div></div>))}</div>}
          {sidebarTab === 'notes' && <div className="h-full pb-10"><NotesManager notes={notes} activeNoteId={activeNoteId} onSaveNote={handleSaveNote} onCreateNote={handleCreateNote} onDeleteNote={handleDeleteNote} onSelectNote={setActiveNoteId} /></div>}
        </div>
      </div>

      <button onClick={() => setIsChatOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all z-40" style={{ backgroundColor: COLORS.atomicTangerine }}><MessageSquare size={28} style={{ color: COLORS.offWhite }} /></button>
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} contextArticle={articles.find(a => a.id === activeArticleId)?.paragraphs.map(p => p.en).join('\n')} />
      {/* 新增：渲染 API Key 弹窗 */}
      <ApiKeyModal 
        isOpen={showKeyModal} 
        onClose={() => setShowKeyModal(false)} 
        onSave={handleSaveKey} 
      />
    </div>
  );
};

export default App;