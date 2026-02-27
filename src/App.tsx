import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Image as ImageIcon,
  Type,
  Sparkles,
  Download,
  RefreshCw,
  Layout,
  Zap,
  ChevronRight,
  Plus,
  Trash2,
  Settings2,
  Key,
  ExternalLink
} from 'lucide-react';
import { BlogSection, GenerationConfig, ImageStyle } from './types';
import { summarizeSection, generateIllustration } from './services/gemini';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [blogText, setBlogText] = useState('');
  const [sections, setSections] = useState<BlogSection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [config, setConfig] = useState<GenerationConfig>({
    style: 'cinematic',
    isCinematicMode: true,
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for local dev if window.aistudio is missing
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success as per guidelines
    }
  };

  const parseBlog = useCallback(() => {
    if (!blogText.trim()) return;

    // Split by markdown headings or common heading patterns
    const lines = blogText.split('\n');
    const newSections: BlogSection[] = [];
    let currentHeading = 'Introduction';
    let currentContent: string[] = [];

    lines.forEach((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/) || line.match(/^([A-Z][^a-z]*)$/);

      if (headingMatch) {
        if (currentContent.length > 0 || currentHeading !== 'Introduction') {
          newSections.push({
            id: crypto.randomUUID(),
            heading: currentHeading,
            content: currentContent.join('\n').trim(),
          });
        }
        currentHeading = headingMatch[2] || headingMatch[1];
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    // Add final section
    if (currentContent.length > 0 || currentHeading !== 'Introduction') {
      newSections.push({
        id: crypto.randomUUID(),
        heading: currentHeading,
        content: currentContent.join('\n').trim(),
      });
    }

    setSections(newSections);
  }, [blogText]);

  const generateAll = async () => {
    if (sections.length === 0) return;
    setIsProcessing(true);

    const updatedSections = [...sections].map(s => ({ ...s, isGenerating: true }));
    setSections(updatedSections);

    const promises = updatedSections.map(async (section) => {
      try {
        const summary = await summarizeSection(section.content);
        const imageUrl = await generateIllustration(section.heading, summary, config);

        setSections(prev => prev.map(s =>
          s.id === section.id
            ? { ...s, summary, imageUrl, isGenerating: false }
            : s
        ));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error generating for ${section.heading}:`, error);
        setSections(prev => prev.map(s =>
          s.id === section.id
            ? { ...s, isGenerating: false, error: message }
            : s
        ));
      }
    });

    await Promise.all(promises);
    setIsProcessing(false);
  };

  const regenerateSingle = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, isGenerating: true, error: undefined } : s
    ));

    try {
      const summary = section.summary || await summarizeSection(section.content);
      const imageUrl = await generateIllustration(section.heading, summary, config);

      setSections(prev => prev.map(s =>
        s.id === sectionId
          ? { ...s, summary, imageUrl, isGenerating: false }
          : s
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error regenerating for ${sectionId}:`, error);
      setSections(prev => prev.map(s =>
        s.id === sectionId
          ? { ...s, isGenerating: false, error: message }
          : s
      ));
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename.replace(/\s+/g, '-').toLowerCase()}-illustration.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (hasApiKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass max-w-md w-full p-10 rounded-[2.5rem] text-center"
        >
          <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-500/20">
            <Key className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-4">API Key Required</h1>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            To use the high-quality <span className="text-emerald-400 font-semibold">Gemini 3.1 Flash</span> image model, you need to select a paid Google Cloud project API key.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleOpenKeySelector}
              className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              Select API Key
            </button>
            <a
              href="https://ai.google.dev/gemini-api/docs/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Learn about billing <ExternalLink size={12} />
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (hasApiKey === null) return null;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 mb-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ImageIcon className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Blog-to-Image <span className="gradient-text">AI</span></h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Visual Storytelling Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setConfig(prev => ({ ...prev, style: prev.style === 'cinematic' ? 'flat' : 'cinematic' }))}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${config.style === 'flat' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
            >
              <Layout size={14} />
              {config.style === 'flat' ? 'Flat Illustration' : 'Cinematic Style'}
            </button>
            <button
              onClick={() => setConfig(prev => ({ ...prev, isCinematicMode: !prev.isCinematicMode }))}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${config.isCinematicMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
            >
              <Zap size={14} />
              {config.isCinematicMode ? 'Cinematic Lighting ON' : 'Standard Lighting'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {/* Input Section */}
        <section className="mb-16">
          <div className="glass rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Type size={200} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-emerald-400 w-5 h-5" />
                <h2 className="text-lg font-medium">Paste your blog content</h2>
              </div>

              <textarea
                value={blogText}
                onChange={(e) => setBlogText(e.target.value)}
                placeholder="Paste your full blog post here... Use # for headings to help the AI detect sections."
                className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-6 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none font-sans leading-relaxed"
              />

              <div className="mt-8 flex items-center justify-between">
                <div className="flex gap-4">
                  <button
                    onClick={parseBlog}
                    className="px-8 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition-all flex items-center gap-2"
                  >
                    <Layout size={18} />
                    Analyze Sections
                  </button>
                  {sections.length > 0 && (
                    <button
                      onClick={generateAll}
                      disabled={isProcessing}
                      className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                    >
                      {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
                      Generate All Visuals
                    </button>
                  )}
                </div>

                {sections.length > 0 && (
                  <p className="text-sm text-zinc-500">
                    Detected <span className="text-zinc-100 font-bold">{sections.length}</span> sections
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="glass rounded-3xl overflow-hidden flex flex-col h-full transition-all hover:border-white/20">
                  {/* Image Container */}
                  <div className="aspect-video bg-zinc-900 relative overflow-hidden">
                    {section.imageUrl ? (
                      <img
                        src={section.imageUrl}
                        alt={section.heading}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
                        {section.isGenerating ? (
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Generating Illustration...</p>
                          </div>
                        ) : (
                          <>
                            <ImageIcon size={48} strokeWidth={1} />
                            <p className="text-sm">Waiting for generation</p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Image Actions Overlay */}
                    {section.imageUrl && !section.isGenerating && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                          onClick={() => downloadImage(section.imageUrl!, section.heading)}
                          className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform"
                          title="Download Image"
                        >
                          <Download size={20} />
                        </button>
                        <button
                          onClick={() => regenerateSingle(section.id)}
                          className="p-3 bg-white/10 text-white backdrop-blur-md rounded-full hover:scale-110 transition-transform border border-white/20"
                          title="Regenerate"
                        >
                          <RefreshCw size={20} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded uppercase tracking-widest">
                          Section {index + 1}
                        </span>
                        <h3 className="text-xl font-bold tracking-tight text-white">{section.heading}</h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {section.summary ? (
                        <p className="text-zinc-400 leading-relaxed italic">
                          "{section.summary}"
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                          <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs text-zinc-600 line-clamp-3">
                          {section.content}
                        </p>
                      </div>
                    </div>

                    {section.error && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                        <Trash2 size={14} />
                        {section.error}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sections.length === 0 && !isProcessing && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
              <Layout size={32} strokeWidth={1} />
            </div>
            <h3 className="text-lg font-medium text-zinc-300 mb-2">No sections analyzed yet</h3>
            <p className="text-sm max-w-xs text-center">Paste your blog content above and click "Analyze Sections" to get started.</p>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-xs font-medium text-zinc-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            AI Engine Ready
          </div>
          <div className="flex items-center gap-2">
            <Settings2 size={14} />
            Gemini 3.1 Flash
          </div>
        </div>
        <p className="text-xs text-zinc-600">
          Crafted for high-impact social media storytelling.
        </p>
      </footer>
    </div>
  );
}
