import React, { useState, useRef } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Search,
  Image as ImageIcon,
  Camera,
  Volume2,
  Mic,
  MicOff,
  ArrowRight,
  Loader2,
  CheckCircle,
  Copy,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface GeminiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'maps' | 'search' | 'image' | 'analyze' | 'tts' | 'voice';
}

export const GeminiAssistantModal: React.FC<GeminiAssistantModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'maps',
}) => {
  const [activeTab, setActiveTab] = useState<'maps' | 'search' | 'image' | 'analyze' | 'tts' | 'voice'>(initialTab);

  // Maps Grounding
  const [mapsQuery, setMapsQuery] = useState('');
  const [mapsLocation, setMapsLocation] = useState('Dhaka, Bangladesh');
  const [mapsResult, setMapsResult] = useState<string | null>(null);

  // Search Grounding
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);

  // Image Creator & Editor
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [editImageInput, setEditImageInput] = useState<string | null>(null);

  // Image Analysis
  const [inspectImg, setInspectImg] = useState<string | null>(null);
  const [inspectQuestion, setInspectQuestion] = useState('Inspect this listing item: verify authenticity, condition, estimated fair market price, and key flaws or highlights.');
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // TTS
  const [ttsText, setTtsText] = useState('Welcome to FindX. Discover properties, verified services, marketplace items, and local professionals near you with instant real-time updates.');
  const [ttsVoice, setTtsVoice] = useState('Zephyr');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Voice Assistant
  const [voiceQuery, setVoiceQuery] = useState('');
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Google Maps Grounding
  const handleMapsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsQuery.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await geminiService.searchMaps(mapsQuery, mapsLocation);
      setMapsResult(res.text);
    } catch (err: any) {
      setError(err?.message || 'Failed to search Google Maps grounding.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Google Search Grounding
  const handleWebSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await geminiService.searchWeb(searchQuery);
      setSearchResult(res.text);
    } catch (err: any) {
      setError(err?.message || 'Failed to search Google Search grounding.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Image Creator & Editor
  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await geminiService.generateOrEditImage(
        imagePrompt,
        editImageInput ? editImageInput.split(',')[1] : undefined,
        editImageInput ? 'image/jpeg' : undefined
      );
      if (res.imageUrl) {
        setGeneratedImg(res.imageUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create image.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Image Inspector / Analysis
  const handleAnalyzeImage = async () => {
    if (!inspectImg) {
      setError('Please upload a photo to inspect.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const base64Data = inspectImg.split(',')[1] || inspectImg;
      const res = await geminiService.analyzeImage(base64Data, 'image/jpeg', inspectQuestion);
      setAnalysisResult(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze image.');
    } finally {
      setLoading(false);
    }
  };

  // 5. TTS
  const handleTTS = async () => {
    if (!ttsText.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const base64Audio = await geminiService.convertTextToSpeech(ttsText, ttsVoice);
      const audioSrc = `data:audio/wav;base64,${base64Audio}`;
      setAudioUrl(audioSrc);
      if (audioRef.current) {
        audioRef.current.src = audioSrc;
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to generate speech audio.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Voice Assistant Query
  const handleVoiceQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!voiceQuery.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const reply = await geminiService.sendVoiceQuery(voiceQuery);
      setVoiceReply(reply);
      // Auto speak the reply using TTS
      try {
        const audio = await geminiService.convertTextToSpeech(reply, 'Kore');
        if (audioRef.current) {
          audioRef.current.src = `data:audio/wav;base64,${audio}`;
          audioRef.current.play();
          setIsPlayingAudio(true);
        }
      } catch (e) {
        // audio optional
      }
    } catch (err: any) {
      setError(err?.message || 'Voice assistant error.');
    } finally {
      setLoading(false);
    }
  };

  // Speech Recognition for Voice Tab
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. You can type your voice query instead.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setVoiceQuery(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'inspect') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        if (target === 'edit') setEditImageInput(ev.target.result as string);
        if (target === 'inspect') setInspectImg(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-7 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              FindX Gemini AI Hub
            </h2>
            <p className="text-xs text-slate-500">
              Maps Grounding, Real-time Web Search, Visual Creator, Photo Inspector & Speech Synthesis.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 mb-5 scrollbar-none">
          {[
            { id: 'maps', label: 'Maps Grounding', icon: MapPin },
            { id: 'search', label: 'Web Grounding', icon: Search },
            { id: 'image', label: 'Image Creator', icon: ImageIcon },
            { id: 'analyze', label: 'Photo Inspector', icon: Camera },
            { id: 'tts', label: 'Text-to-Speech', icon: Volume2 },
            { id: 'voice', label: 'Voice Assistant', icon: Mic },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setError(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Maps Grounding Tab */}
        {activeTab === 'maps' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900">
              <span className="font-bold">Google Maps Grounding (gemini-3.5-flash):</span> Query real locations, clinics, verified businesses, neighborhood facilities, and accurate geographic intelligence.
            </div>

            <form onSubmit={handleMapsSearch} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Search Query</label>
                  <input
                    type="text"
                    required
                    value={mapsQuery}
                    onChange={(e) => setMapsQuery(e.target.value)}
                    placeholder="e.g. Best 24/7 diagnostic centers or top hardware shops"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Target Location</label>
                  <input
                    type="text"
                    value={mapsLocation}
                    onChange={(e) => setMapsLocation(e.target.value)}
                    placeholder="e.g. Dhanmondi, Dhaka"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                {loading ? 'Grounding with Google Maps...' : 'Search with Maps Grounding'}
              </button>
            </form>

            {mapsResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Verified Google Maps Grounded Results
                  </span>
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {mapsResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Web Search Grounding Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
              <span className="font-bold">Google Search Grounding (gemini-3.5-flash):</span> Get up-to-date real-time market trends, current pricing for electronics, apartments, and verified facts.
            </div>

            <form onSubmit={handleWebSearch} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Search Question / Topic</label>
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Current average rent for 3 bedroom flat in Banani 2026 or iPhone 15 price in Bangladesh"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Searching with Google Grounding...' : 'Search with Google Grounding'}
              </button>
            </form>

            {searchResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Real-time Google Grounded Answers
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {searchResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Image Creator & Editor Tab */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
              <span className="font-bold">Image Creation & Editing (gemini-3.1-flash-image-preview):</span> Generate photorealistic property mockups, commercial product shots, or edit existing photos with text prompts.
            </div>

            <form onSubmit={handleGenerateImage} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Visual Prompt</label>
                <textarea
                  rows={2}
                  required
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="e.g. Modern minimalist coffee shop interior with warm wooden tables and plant decor, bright natural sunlight"
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Optional Reference Image to Edit</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'edit')}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {loading ? 'Synthesizing with Gemini Image Engine...' : 'Generate / Edit Image'}
              </button>
            </form>

            {generatedImg && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <img
                  src={generatedImg}
                  alt="Generated visual"
                  className="max-h-72 mx-auto rounded-xl shadow-lg border border-slate-200 object-contain"
                />
                <div className="mt-3">
                  <a
                    href={generatedImg}
                    download="findx-visual.png"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs hover:bg-blue-600 transition-colors"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Photo Inspector / Image Understanding Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs text-emerald-900">
              <span className="font-bold">Image Understanding (gemini-3.1-pro-preview):</span> Upload any photo of a property, car, electronics, or document. Gemini inspects condition, verifies authenticity, and estimates fair value.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Upload Photo for Inspection</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'inspect')}
                    className="hidden"
                    id="inspect-upload"
                  />
                  <label htmlFor="inspect-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">Click to select photo (Vehicle, Gadget, Room, Receipt)</span>
                    <span className="text-[11px] text-slate-400">PNG, JPG up to 5MB</span>
                  </label>
                </div>
              </div>

              {inspectImg && (
                <div className="relative w-40 h-32 mx-auto rounded-xl overflow-hidden border border-slate-200 shadow-md">
                  <img src={inspectImg} alt="To Inspect" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Inspection Query</label>
                <input
                  type="text"
                  value={inspectQuestion}
                  onChange={(e) => setInspectQuestion(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyzeImage}
                disabled={loading || !inspectImg}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {loading ? 'Inspecting with Gemini 3.1 Pro...' : 'Inspect & Analyze Photo'}
              </button>
            </div>

            {analysisResult && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Gemini Deep Photo Inspection Report
                </div>
                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {analysisResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Text-to-Speech (TTS) Tab */}
        {activeTab === 'tts' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl text-xs text-amber-900">
              <span className="font-bold">Text-to-Speech (gemini-3.8-flash-tts):</span> Generate ultra-realistic voice audio with natural intonations and clear studio delivery.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Text to Speak</label>
                <textarea
                  rows={3}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="Enter text to synthesize into spoken audio..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Voice Persona</label>
                <div className="flex flex-wrap gap-2">
                  {['Zephyr', 'Kore', 'Puck', 'Charon', 'Fenrir'].map((voice) => (
                    <button
                      key={voice}
                      type="button"
                      onClick={() => setTtsVoice(voice)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        ttsVoice === voice
                          ? 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {voice}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTTS}
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  {loading ? 'Generating Speech...' : 'Generate & Play Audio'}
                </button>

                {audioUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      if (audioRef.current) {
                        if (isPlayingAudio) {
                          audioRef.current.pause();
                          setIsPlayingAudio(false);
                        } else {
                          audioRef.current.play();
                          setIsPlayingAudio(true);
                        }
                      }
                    }}
                    className="p-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-600 transition-colors"
                  >
                    {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. Voice Assistant / Dialogue Tab */}
        {activeTab === 'voice' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-cyan-50/70 border border-cyan-100 rounded-xl text-xs text-cyan-900">
              <span className="font-bold">Voice Dialogue Assistant (gemini-3.8-flash / Live):</span> Speak or ask questions naturally to navigate the platform, find properties, or discover local verified specialists.
            </div>

            <form onSubmit={handleVoiceQuery} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  required
                  value={voiceQuery}
                  onChange={(e) => setVoiceQuery(e.target.value)}
                  placeholder="e.g. Find 2-bedroom flats in Khulna or emergency doctors near me"
                  className="w-full pl-4 pr-12 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  title={isRecording ? 'Listening... click to stop' : 'Click to speak'}
                  className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-700 hover:bg-cyan-100 hover:text-cyan-700'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                {loading ? 'Consulting FindX Voice Navigator...' : 'Ask Assistant'}
              </button>
            </form>

            {voiceReply && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>FindX Voice Assistant:</span>
                  {isPlayingAudio && (
                    <span className="flex items-center gap-1 text-[11px] text-cyan-600 font-semibold animate-pulse">
                      <Volume2 className="w-3.5 h-3.5" /> Speaking response...
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">{voiceReply}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
