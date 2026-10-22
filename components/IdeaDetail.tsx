import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Type, Film, CheckCircle2, Download, RefreshCcw, Copy, Check, Palette, Move, ZoomIn, RefreshCw, Maximize, X, Upload, LayoutTemplate, Camera, Zap, Aperture, MonitorPlay, Sparkles, Cloud, Sun, Building, Home, Tent, Waves, Wind, Star, Tv, Clock, Rewind, Pause, Activity, Ghost, Layers, Droplets, Flame, Snowflake, Video, Mic, Mic2, Clapperboard, Play, AlertCircle, Loader2, Crop, Scan, Square, RectangleVertical, RectangleHorizontal, Wand2 } from 'lucide-react';
import { Idea, GenerationMode, VideoJsonOutput, MentorshipResult, VisualStrategy, CopywritingAttributes, Scene } from '../types';
import { Button, Card, Label, Badge, VisualSelect, Input, TextArea, Modal } from './UIComponents';
import { generateIdeaImage, evaluateArtwork, generateVeoVideo, generateStoryboard, expandImageRatio, applyTextOverlay, generateSingleCanvaPrompt } from '../services/geminiService';

interface Props {
  idea: Idea;
  mode: GenerationMode;
  originalImage: string | null;
  aspectRatio?: string;
  onBack: () => void;
  onUpdateIdea: (updatedIdea: Idea) => void;
}

// --- STATIC OPTIONS ---
const cameraOptions = [
  { id: 'Static', label: 'Estática', icon: Camera, description: 'Câmera parada' },
  { id: 'Pan Right', label: 'Panorâmica', icon: Move, description: 'Move horizontalmente' },
  { id: 'Zoom In', label: 'Zoom In', icon: ZoomIn, description: 'Aproxima lentamente' },
  { id: 'Orbit', label: 'Órbita', icon: RefreshCw, description: 'Gira em torno' },
];

const styleOptions = [
  { id: 'None', label: 'Nenhum', icon: X },
  { id: 'Realistic', label: 'Realista', icon: Aperture },
  { id: 'Cinematic', label: 'Cinemático', icon: Film },
  { id: '3D Render', label: '3D Render', icon: MonitorPlay },
  { id: 'Anime', label: 'Anime', icon: Zap },
];

const voiceOptions = [
    { id: 'Male', label: 'Masculina', icon: Mic },
    { id: 'Female', label: 'Feminina', icon: Mic2 },
];

const environmentOptions = [
  { id: 'Studio', label: 'Estúdio Limpo', icon: LayoutTemplate },
  { id: 'Urban', label: 'Urbano/Rua', icon: Building },
  { id: 'Nature', label: 'Natureza', icon: Cloud },
  { id: 'Luxury Home', label: 'Casa Luxo', icon: Home },
  { id: 'Neon Sci-Fi', label: 'Neon/Futuro', icon: Zap },
  { id: 'Beach', label: 'Praia/Sol', icon: Sun },
];

const vfxOptions = [
  { id: 'None', label: 'Nenhum', icon: X },
  { id: 'Slow Motion', label: 'Slow Motion', icon: Clock, description: 'Câmera lenta padrão' },
  { id: 'Super Slow Motion', label: 'Super Slow Mo', icon: Clock, description: 'Extremamente lenta' },
  { id: 'Timelapse', label: 'Timelapse', icon: Clock, description: 'Tempo acelerado fixo' },
  { id: 'Hyperlapse', label: 'Hyperlapse', icon: Activity, description: 'Tempo acelerado móvel' },
  { id: 'Speed Ramping', label: 'Speed Ramping', icon: Zap, description: 'Rápido p/ lento' },
  { id: 'Reverse Motion', label: 'Reverso', icon: Rewind, description: 'Movimento contrário' },
  { id: 'Freeze Frame', label: 'Congelado', icon: Pause, description: 'Ação congelada' },
  { id: 'Bullet Time', label: 'Bullet Time', icon: Camera, description: 'Estilo Matrix' },
  { id: 'Motion Blur', label: 'Motion Blur', icon: Activity, description: 'Desfoque natural' },
  { id: 'Looping', label: 'Looping', icon: RefreshCw, description: 'Repetição perfeita' },
  { id: 'Glitch Effect', label: 'Glitch', icon: Tv, description: 'Falhas digitais' },
  { id: 'Datamosh', label: 'Datamosh', icon: MonitorPlay, description: 'Pixelização artística' },
  { id: 'Chromatic Aberration', label: 'Cromático', icon: Layers, description: 'Deslocamento RGB' },
  { id: 'VHS Artifacts', label: 'VHS', icon: Tv, description: 'Estilo fita antiga' },
  { id: 'Film Grain', label: 'Granulação', icon: Film, description: 'Filme analógico' },
  { id: 'Double Exposure', label: 'Dupla Exp.', icon: Layers, description: 'Imagens sobrepostas' },
  { id: 'Morphing', label: 'Morphing', icon: Ghost, description: 'Transformação suave' },
  { id: 'Fluid Simulation', label: 'Fluido', icon: Droplets, description: 'Líquidos realistas' },
  { id: 'Shattering', label: 'Quebra', icon: Zap, description: 'Objeto quebrando' },
  { id: 'Explosion', label: 'Explosão', icon: Flame, description: 'Fogo e detonação' },
  { id: 'Smoke Plumes', label: 'Fumaça', icon: Wind, description: 'Colunas de fumaça' },
  { id: 'Floating Dust', label: 'Poeira', icon: Sparkles, description: 'Partículas no ar' },
  { id: 'Sparks', label: 'Faíscas', icon: Sparkles, description: 'Brasas voando' },
  { id: 'Rain', label: 'Chuva', icon: Cloud, description: 'Chuva realista' },
  { id: 'Snowfall', label: 'Neve', icon: Snowflake, description: 'Queda de neve' },
  { id: 'Fog', label: 'Neblina', icon: Cloud, description: 'Densa ou suave' },
  { id: 'Light Leaks', label: 'Vazamento Luz', icon: Sun, description: 'Filme queimado' },
  { id: 'Lens Flare', label: 'Lens Flare', icon: Aperture, description: 'Reflexo na lente' },
  { id: 'God Rays', label: 'God Rays', icon: Sun, description: 'Raios volumétricos' },
  { id: 'Vignette', label: 'Vinheta', icon: Aperture, description: 'Bordas escuras' },
];

// --- LIGHTBOX ---
const ImageLightbox = ({ imageUrl, onClose }: { imageUrl: string | null, onClose: () => void }) => {
  const [copying, setCopying] = useState(false);
  if (!imageUrl) return null;

  const handleCopyImage = async () => {
    try {
      setCopying(true);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert("Imagem copiada!");
    } catch (err) { alert("Erro ao copiar."); } finally { setCopying(false); }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ideia-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full z-50"><X size={32}/></button>
      <div className="max-w-[90vw] max-h-[80vh] relative cursor-default" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Full Screen" className="max-w-full max-h-[80vh] object-contain rounded shadow-2xl" />
      </div>
      <div className="mt-6 flex gap-4 cursor-default" onClick={(e) => e.stopPropagation()}>
        <Button onClick={handleCopyImage} variant="secondary" className="min-w-[120px]">{copying ? <Check size={18} /> : <Copy size={18} />} Copiar</Button>
        <Button onClick={handleDownload} variant="primary" className="min-w-[120px]"><Download size={18} /> Baixar</Button>
      </div>
    </div>
  );
};

// --- ART DIRECTION ---
const ArtDirectionStudio = ({ idea, onUpdateIdea, originalImage, selectedIndex, localImages, aspectRatio }: { idea: Idea, onUpdateIdea: (updatedIdea: Idea) => void, originalImage: string | null, selectedIndex: number, localImages: (string | null)[], aspectRatio?: string }) => {
  const strategy = idea.visualStrategy;
  const ideaContext = idea.description;

  const [userArt, setUserArt] = useState<string | null>(null);
  const [mentorshipResult, setMentorshipResult] = useState<MentorshipResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // New State for Generated Suggested Ad
  const [generatedAdUrl, setGeneratedAdUrl] = useState<string | null>(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [isGeneratingCanvaPrompt, setIsGeneratingCanvaPrompt] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setUserArt(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
      setMentorshipResult(null);
    }
  };

  const runAnalysis = async () => {
    if (!userArt) return;
    setAnalyzing(true);
    try {
      const res = await evaluateArtwork(originalImage, userArt, ideaContext);
      setMentorshipResult(res);
    } catch (err) { alert("Erro na análise."); } finally { setAnalyzing(false); }
  };

  const handleGenerateNewCanvaPrompt = async () => {
    if (!strategy) return;
    setIsGeneratingCanvaPrompt(true);
    try {
      const guide = strategy.specificGuides?.[selectedIndex] || strategy.specificGuides?.[0] || {
        mainHeadline: "Título Principal",
        mainFont: strategy.typographySuggestion || "Inter",
        secondaryText: "Subtítulo",
        secondaryFont: "Inter",
        visualElements: "Elementos visuais",
        ctaButton: "Saiba Mais",
        placementTips: "Centralizado",
        canvaPrompt: ""
      };

      const newPrompt = await generateSingleCanvaPrompt(
        idea.title,
        idea.description,
        {
          mainHeadline: guide.mainHeadline || "",
          mainFont: guide.mainFont || "",
          secondaryText: guide.secondaryText || "",
          secondaryFont: guide.secondaryFont || "",
          visualElements: guide.visualElements || "",
          ctaButton: guide.ctaButton || "",
          placementTips: guide.placementTips || ""
        },
        strategy.colorPalette || [],
        strategy.typographySuggestion || "",
        aspectRatio
      );

      // Create updated strategy clone
      const updatedStrategy = { ...strategy };
      if (!updatedStrategy.specificGuides) {
        updatedStrategy.specificGuides = [];
      }

      // Pad array if needed
      while (updatedStrategy.specificGuides.length <= selectedIndex) {
        updatedStrategy.specificGuides.push({
          mainHeadline: "",
          mainFont: "",
          secondaryText: "",
          secondaryFont: "",
          visualElements: "",
          ctaButton: "",
          placementTips: "",
          canvaPrompt: ""
        });
      }

      // Update specific guide at selectedIndex
      updatedStrategy.specificGuides[selectedIndex] = {
        ...guide,
        canvaPrompt: newPrompt
      };

      onUpdateIdea({
        ...idea,
        visualStrategy: updatedStrategy
      });

    } catch (e: any) {
      console.error(e);
      alert(e.message || "Erro ao gerar o prompt do Canva.");
    } finally {
      setIsGeneratingCanvaPrompt(false);
    }
  };

  // New function to generate the ad with text
  const handleGenerateSuggestedAd = async () => {
    const sourceImage = localImages[selectedIndex];
    
    if (!sourceImage) {
        alert("A imagem da variação ainda não foi gerada. Aguarde ou gere novamente.");
        return;
    }
    
    if (!strategy) return;
    const guide = strategy.specificGuides?.[selectedIndex] || strategy.specificGuides?.[0];
    if (!guide) return;

    setIsGeneratingAd(true);
    try {
      const resultUrl = await applyTextOverlay(
        sourceImage,
        {
          headline: guide.mainHeadline,
          subtitle: guide.secondaryText,
          cta: guide.ctaButton
        },
        {
          font: guide.mainFont || strategy.typographySuggestion,
          colors: strategy.colorPalette || [],
          placement: guide.placementTips
        },
        aspectRatio,
        guide.canvaPrompt
      );
      setGeneratedAdUrl(resultUrl);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar imagem com texto.");
    } finally {
      setIsGeneratingAd(false);
    }
  };

  if (!strategy) return <div className="text-zinc-500">Estratégia visual indisponível.</div>;
  const currentGuide = strategy.specificGuides?.[selectedIndex] || strategy.specificGuides?.[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {lightboxUrl && <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><LayoutTemplate className="text-indigo-400" size={24}/> Guia de Edição</h3>
          <Badge color="indigo">Variação {selectedIndex + 1}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <Card>
             <Label>Tipografia</Label>
             <div className="flex flex-col gap-1 mt-1">
                <span className="text-sm text-white font-bold">{currentGuide?.mainFont || strategy.typographySuggestion}</span>
                <span className="text-xs text-zinc-500">Principal</span>
             </div>
             {currentGuide?.secondaryFont && (
                <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-zinc-800">
                   <span className="text-sm text-zinc-300">{currentGuide.secondaryFont}</span>
                   <span className="text-xs text-zinc-500">Secundária</span>
                </div>
             )}
           </Card>
           <Card>
             <Label>Elementos Visuais</Label>
             <p className="text-zinc-300 text-sm mt-1">{currentGuide?.visualElements || "Formas geométricas"}</p>
             <div className="mt-3">
                <Label>Paleta</Label>
                <div className="flex gap-1 mt-1 h-4">
                   {strategy.colorPalette?.map((c, i) => (<div key={i} className="flex-1 rounded-sm" style={{backgroundColor: c}} title={c}/>))}
                </div>
             </div>
           </Card>
        </div>
        <Card className="border-indigo-500/30 bg-indigo-900/10">
           <Label>Overlay de Texto (Conteúdo)</Label>
           <div className="space-y-4 mt-3">
              <div className="bg-zinc-900/80 p-3 rounded border border-zinc-700">
                 <div className="flex justify-between items-start mb-1">
                    <span className="text-xs text-indigo-300 uppercase font-bold">Título Principal</span>
                    <button onClick={() => handleCopy(currentGuide?.mainHeadline || "", "main")} className="text-zinc-500 hover:text-white">{copied === "main" ? <Check size={14}/> : <Copy size={14}/>}</button>
                 </div>
                 <p className="text-white font-serif text-lg italic leading-tight">{currentGuide?.mainHeadline || "Texto não gerado"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-zinc-900/80 p-3 rounded border border-zinc-700">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">Subtítulo</span>
                        <button onClick={() => handleCopy(currentGuide?.secondaryText || "", "sec")} className="text-zinc-500 hover:text-white">{copied === "sec" ? <Check size={12}/> : <Copy size={12}/>}</button>
                    </div>
                    <p className="text-zinc-300 text-sm">{currentGuide?.secondaryText || "-"}</p>
                 </div>
                 <div className="bg-zinc-900/80 p-3 rounded border border-zinc-700">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">CTA</span>
                        <button onClick={() => handleCopy(currentGuide?.ctaButton || "", "cta")} className="text-zinc-500 hover:text-white">{copied === "cta" ? <Check size={12}/> : <Copy size={12}/>}</button>
                    </div>
                    <p className="text-white font-bold text-sm bg-indigo-600 inline-block px-2 py-0.5 rounded mt-1">{currentGuide?.ctaButton || "Saiba Mais"}</p>
                 </div>
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800">
                 <Label>Posicionamento</Label>
                 <p className="text-zinc-300 text-sm mt-1 leading-relaxed flex items-start gap-2"><Move size={14} className="mt-0.5 text-indigo-400 shrink-0"/>{currentGuide?.placementTips || "Centralizado."}</p>
              </div>
           </div>
        </Card>

        <Card className="border-purple-500/30 bg-purple-900/10 flex flex-col gap-3">
           <div className="flex justify-between items-center">
             <Label className="flex items-center gap-2 mb-0">
               <Sparkles size={14} className="text-purple-400"/>
               Prompt para Canva IA 2.0
             </Label>
             <div className="flex gap-2">
               {currentGuide?.canvaPrompt && (
                 <button 
                   onClick={() => handleCopy(currentGuide?.canvaPrompt || "", "canva")} 
                   className="text-zinc-400 hover:text-white flex items-center gap-1.5 text-xs bg-zinc-900/80 px-2.5 py-1.5 rounded border border-zinc-800 transition-all font-semibold"
                 >
                   {copied === "canva" ? <Check size={14}/> : <Copy size={14}/>} 
                   Copiar
                 </button>
               )}
               <button 
                 onClick={handleGenerateNewCanvaPrompt}
                 disabled={isGeneratingCanvaPrompt}
                 className="text-white hover:text-white flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 px-3 py-1.5 rounded font-bold shadow-md shadow-purple-900/30 transition-all disabled:opacity-50"
               >
                 {isGeneratingCanvaPrompt ? (
                   <>
                     <Loader2 size={14} className="animate-spin" />
                     Gerando...
                   </>
                 ) : (
                   <>
                     <Sparkles size={14} />
                     {currentGuide?.canvaPrompt ? "Regerar Prompt" : "Gerar Canva Prompt"}
                   </>
                 )}
               </button>
             </div>
           </div>
           <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto custom-scrollbar italic">
             <div className="whitespace-pre-wrap">
               {currentGuide?.canvaPrompt || "Prompt ainda não gerado. Clique no botão acima para gerar o prompt via IA individualmente no formato estruturado do Canva 2.0!"}
             </div>
           </div>
        </Card>
      </div>

      <div className="space-y-6 border-l border-zinc-800 pl-0 lg:pl-8">
        {/* NEW SECTION: AI SUGGESTED IMAGE GENERATION */}
        <div className="pb-8 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-bold text-white flex items-center gap-2">
               <Wand2 className="text-purple-400" size={24}/> Gerar Imagem Sugerida
             </h3>
             <Badge color="purple">AI Mockup</Badge>
          </div>
          <p className="text-zinc-400 text-sm mb-4">
            A IA aplicará automaticamente os textos (Título, Subtítulo, CTA) e o estilo visual definido no guia sobre a imagem selecionada.
          </p>
          
          {!generatedAdUrl ? (
             <Button 
                onClick={handleGenerateSuggestedAd} 
                disabled={isGeneratingAd || !localImages[selectedIndex]}
                className="w-full py-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-500/30 hover:border-purple-400 text-white"
             >
                {isGeneratingAd ? <><Loader2 className="animate-spin mr-2"/> Aplicando Texto & Design...</> : <><Sparkles className="mr-2"/> Aplicar Edição com IA</>}
             </Button>
          ) : (
             <div className="space-y-3 animate-in fade-in zoom-in-95">
               <div className="relative group rounded-xl overflow-hidden border border-zinc-700 bg-black">
                  <img src={generatedAdUrl} className="w-full object-contain max-h-80" alt="Generated Ad" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <Button variant="secondary" onClick={() => setLightboxUrl(generatedAdUrl)}><Maximize size={16}/></Button>
                     <Button variant="secondary" onClick={() => { const a = document.createElement('a'); a.href = generatedAdUrl!; a.download = `mockup-${Date.now()}.png`; a.click(); }}><Download size={16}/></Button>
                  </div>
                  <div className="absolute top-2 right-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded">Gerado por IA</div>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 text-xs" onClick={handleGenerateSuggestedAd} disabled={isGeneratingAd}><RefreshCw size={12} className="mr-1"/> Gerar Novamente</Button>
                  <Button variant="secondary" className="flex-1 text-xs" onClick={() => setGeneratedAdUrl(null)}><X size={12} className="mr-1"/> Limpar</Button>
               </div>
             </div>
          )}
        </div>

        {/* EXISTING MENTORSHIP SECTION */}
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2"><CheckCircle2 className="text-green-400" size={24}/> Mentoria & Feedback</h3>
          <p className="text-zinc-400 text-sm mb-4">Upload da sua arte final manual da <strong>Variação {selectedIndex + 1}</strong>.</p>
          <div className="border-2 border-dashed border-zinc-700 rounded-xl p-6 text-center hover:bg-zinc-900/50 transition-colors relative group">
            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
            {userArt ? (<img src={userArt} alt="User Art" className="max-h-48 mx-auto rounded shadow-lg" />) : (<div className="py-8 text-zinc-500"><Upload className="mx-auto mb-2" size={24}/><p className="font-medium text-zinc-300">Upload da Arte Final</p></div>)}
          </div>
          <Button onClick={runAnalysis} disabled={!userArt || analyzing} className="w-full mt-4">{analyzing ? 'Avaliando...' : 'Avaliar Minha Arte'}</Button>
          {mentorshipResult && (
            <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 animate-in fade-in mt-4">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-4 ${mentorshipResult.score >= 8 ? 'border-green-500/20 text-green-400' : 'border-amber-500/20 text-amber-400'}`}>{mentorshipResult.score}</div>
                <div><h4 className="font-bold text-white">Nota</h4><p className="text-xs text-zinc-500">Aderência ao guia.</p></div>
              </div>
              <p className="text-zinc-300 text-sm">{mentorshipResult.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- SOCIAL COPY ---
const SocialCopySuite = ({ copy, selectedIndex }: { copy?: CopywritingAttributes, selectedIndex: number }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };
  
  if (!copy) return <div className="p-4 text-zinc-500">Copy não disponível para esta variação.</div>;
  
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><Type className="text-indigo-400" size={24}/> Copy para Redes Sociais</h3>
          <Badge color="indigo">Adaptado à Variação {selectedIndex + 1}</Badge>
        </div>

       <div>
          <Label>Hooks / Manchetes (Para Legenda)</Label>
          <div className="space-y-2 mt-2">
             {copy.socialCaptionHeadlines?.map((hl, i) => (
               <div key={i} className="flex justify-between bg-zinc-900/50 p-3 rounded border border-zinc-800"><span className="text-white italic">"{hl}"</span><button onClick={() => handleCopy(hl, `hl-${i}`)} className="text-zinc-500 hover:text-white">{copied === `hl-${i}` ? <Check size={16}/> : <Copy size={16}/>}</button></div>
             ))}
          </div>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex justify-between mb-2">
                <Label>Legenda Completa</Label>
                <button onClick={() => handleCopy(copy.caption, "cap")} className="text-xs text-zinc-500 hover:text-white flex gap-1">{copied === "cap" ? <Check size={12}/> : <Copy size={12}/>} Copiar</button>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{copy.caption}</p>
          </Card>
          <Card>
            <div className="flex justify-between mb-2">
                <Label>Hashtags</Label>
                <button onClick={() => handleCopy(copy.hashtags.join(" "), "tags")} className="text-xs text-indigo-400 hover:text-white flex gap-1">{copied === "tags" ? <Check size={12}/> : <Copy size={12}/>} Copiar Todas</button>
            </div>
            <div className="flex flex-wrap gap-2">{copy.hashtags?.map((tag, i) => (<span key={i} className="text-blue-400 text-xs bg-blue-900/10 px-2 py-1 rounded">{tag}</span>))}</div>
          </Card>
       </div>
    </div>
  );
};

// --- VIDEO DIRECTOR (UPDATED) ---
const VideoDirector = ({ initialJson, generatedImages }: { initialJson?: VideoJsonOutput, generatedImages: (string | null)[] }) => {
   // State maps to new Nested JSON Structure
   const [subjectDetails, setSubjectDetails] = useState(initialJson?.scene_elements?.subject_details || "Product shot");
   const [environment, setEnvironment] = useState("Studio");
   const [vfx, setVfx] = useState("None");
   
   const [camera, setCamera] = useState(initialJson?.cinematography?.camera_movement || "Static");
   const [artStyle, setArtStyle] = useState(initialJson?.cinematography?.art_style || "Realistic");
   
   const [narrative, setNarrative] = useState(initialJson?.audio_production?.script_pt_br || "");
   const [voice, setVoice] = useState(initialJson?.audio_production?.voice_profile?.gender || "Male");
   const [extraGuidance, setExtraGuidance] = useState("");

   const [finalJson, setFinalJson] = useState<VideoJsonOutput>(initialJson || {} as any);
   const [selectedRefImage, setSelectedRefImage] = useState<string | null>(null);
   const [videoUrl, setVideoUrl] = useState<string | null>(null);
   const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

   useEffect(() => {
     if (!selectedRefImage && generatedImages[0]) setSelectedRefImage(generatedImages[0]);
   }, [generatedImages, selectedRefImage]);
   
   useEffect(() => {
      // Reconstruct the nested JSON object
      const updatedJson: VideoJsonOutput = {
        _meta: {
          type: "Product Commercial",
          aspect_ratio: "16:9",
          target_output: "Hyper-realistic video with localized audio"
        },
        scene_elements: {
          subject_details: subjectDetails,
          environment_context: environment,
          visual_effects: vfx
        },
        cinematography: {
          camera_movement: camera,
          shot_type: "Wide/Medium", 
          lighting_style: "Cinematic",
          art_style: artStyle
        },
        audio_production: {
          voice_profile: {
            gender: voice as 'Male'|'Female',
            tone: "Professional",
            is_voiceover: true
          },
          script_pt_br: narrative
        }
      };
      setFinalJson(updatedJson);
   }, [subjectDetails, environment, vfx, camera, artStyle, narrative, voice]);

   const handleGenerateVeoVideo = async () => {
     if (!selectedRefImage) { alert("Selecione uma imagem de referência."); return; }
     setIsGeneratingVideo(true);
     setVideoUrl(null);
     
     const envText = environment !== 'None' ? `, set in a ${environment} environment` : '';
     const vfxText = vfx !== 'None' ? `, featuring ${vfx} visual effects` : '';
     const styleText = artStyle !== 'None' ? `${artStyle} style` : '';
     const extraText = extraGuidance ? `, ${extraGuidance}` : '';
     
     const promptString = `${styleText} video of ${subjectDetails}${envText}${vfxText}. Shot with ${camera} camera movement.${extraText}. High quality, 4k.`;

     try {
       const url = await generateVeoVideo(promptString, selectedRefImage);
       setVideoUrl(url);
     } catch (error: any) {
       alert(error.message || "Erro ao gerar vídeo");
     } finally {
       setIsGeneratingVideo(false);
     }
   };

   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files && e.target.files[0]) {
       const reader = new FileReader();
       reader.onloadend = () => setSelectedRefImage(reader.result as string);
       reader.readAsDataURL(e.target.files[0]);
     }
   };

   return (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
           <div>
              <Label>Subject Details (English)</Label>
              <TextArea value={subjectDetails} onChange={(e) => setSubjectDetails(e.target.value)} className="min-h-[80px]" placeholder="Detailed description of the product action..." />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                 <Label>Script / Roteiro (Português PT-BR)</Label>
                 <TextArea value={narrative} onChange={(e) => setNarrative(e.target.value)} className="min-h-[60px]" placeholder="Texto falado em português..." />
              </div>
              <div className="md:col-span-2"><Label className="mb-2">Voice Gender</Label><VisualSelect options={voiceOptions} value={voice} onChange={(v) => setVoice(v as 'Male' | 'Female')} /></div>
           </div>
           <div>
              <Label>Extra Guidance (Prompt Append)</Label>
              <Input value={extraGuidance} onChange={(e) => setExtraGuidance(e.target.value)} placeholder="Additional instructions for the video model..." />
           </div>
           <div><Label className="mb-3">Environment (English)</Label><VisualSelect options={environmentOptions} value={environment} onChange={setEnvironment} /></div>
           <div><Label className="mb-3">Visual Effects (English)</Label><VisualSelect options={vfxOptions} value={vfx} onChange={setVfx} /></div>
           <div><Label className="mb-3">Camera Movement (English)</Label><VisualSelect options={cameraOptions} value={camera} onChange={setCamera} /></div>
           <div><Label className="mb-3">Art Style (English)</Label><VisualSelect options={styleOptions} value={artStyle} onChange={setArtStyle} /></div>
        </div>
        <div className="flex flex-col gap-6">
           <div>
              <Label className="mb-2">JSON Structure (Product Ads Format)</Label>
              <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 font-mono text-xs text-green-400 max-h-60 overflow-auto flex-1 relative group">
                 <button onClick={() => navigator.clipboard.writeText(JSON.stringify(finalJson, null, 2))} className="absolute top-2 right-2 p-2 bg-zinc-800 rounded text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" title="Copiar JSON"><Copy size={14}/></button>
                 <pre>{JSON.stringify(finalJson, null, 2)}</pre>
              </div>
           </div>
           <div className="p-6 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
              <h3 className="text-white font-bold flex items-center gap-2 mb-4"><Video className="text-indigo-400" size={20}/> Gerar Vídeo Real (Google Veo)</h3>
              <Label className="mb-3">Referência (First Frame)</Label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                 {generatedImages.map((img, i) => img && (
                    <button key={i} onClick={() => setSelectedRefImage(img)} className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedRefImage === img ? 'border-indigo-500' : 'border-transparent opacity-60 hover:opacity-100'}`}><img src={img} className="w-full h-full object-cover" alt={`Ref ${i}`}/>{selectedRefImage === img && <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center"><CheckCircle2 className="text-white drop-shadow-md"/></div>}</button>
                 ))}
                 <div className="relative aspect-square bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center hover:bg-zinc-800 cursor-pointer"><input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={20} className="text-zinc-400"/></div>
              </div>
              <Button onClick={handleGenerateVeoVideo} disabled={isGeneratingVideo} className="w-full py-3 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-none shadow-lg shadow-indigo-900/20">{isGeneratingVideo ? <span className="animate-pulse">Criando Vídeo (aguarde ~1-2 min)...</span> : 'Gerar Vídeo 720p'}</Button>
              <p className="text-xs text-zinc-500 text-center mb-4">*Requer chave de API com acesso ao Veo (Cobrança por vídeo).</p>
              {videoUrl && (<div className="mt-4 rounded-xl overflow-hidden border border-zinc-700 bg-black shadow-2xl animate-in fade-in zoom-in-95"><video controls className="w-full aspect-video" src={videoUrl} autoPlay loop /><div className="p-3 bg-zinc-900 flex justify-between items-center"><span className="text-xs text-green-400 font-bold">Vídeo Gerado com Sucesso!</span><a href={videoUrl} download="veo_video.mp4" className="text-xs text-white hover:underline flex gap-1 items-center"><Download size={12}/> Baixar MP4</a></div></div>)}
           </div>
        </div>
     </div>
   );
};

// --- STORYBOARD STUDIO (NEW) ---
const StoryboardStudio = ({ 
  idea, 
  localImages, 
  onUpdateIdea,
  aspectRatio
}: { 
  idea: Idea, 
  localImages: (string|null)[], 
  onUpdateIdea: (i: Idea) => void,
  aspectRatio?: string
}) => {
  const [sceneCount, setSceneCount] = useState(4);
  const [baseImageIdx, setBaseImageIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [refinements, setRefinements] = useState<{[key:number]: string}>({});
  const [regeneratingScene, setRegeneratingScene] = useState<number | null>(null);

  const handleGenerateStoryboard = async () => {
    if (!localImages[baseImageIdx]) {
      alert("Imagem base não disponível. Gere a imagem primeiro.");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Pass video settings from the idea template to ensure style consistency
      const generatedScenes = await generateStoryboard(
        localImages[baseImageIdx]!,
        sceneCount,
        idea.description,
        idea.videoJsonTemplate, // Injecting style context
        aspectRatio // Propagating aspect ratio
      );
      
      const newStoryboard = {
        baseImageIndex: baseImageIdx,
        scenes: generatedScenes
      };
      
      onUpdateIdea({ ...idea, storyboard: newStoryboard });
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar storyboard.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateScene = async (sceneIndex: number) => {
     if (!idea.storyboard) return;
     const scene = idea.storyboard.scenes[sceneIndex];
     const adjustment = refinements[sceneIndex] || "";
     
     setRegeneratingScene(sceneIndex);
     try {
        const newImage = await generateIdeaImage(
           `${scene.visualPrompt}. ${adjustment}`,
           localImages[baseImageIdx],
           GenerationMode.FIDELITY,
           undefined, // refinement (using base logic here)
           aspectRatio // Propagating aspect ratio
        );
        
        const updatedScenes = [...idea.storyboard.scenes];
        updatedScenes[sceneIndex] = { ...scene, imageUrl: newImage };
        
        onUpdateIdea({ ...idea, storyboard: { ...idea.storyboard, scenes: updatedScenes }});
     } catch(e) {
        alert("Erro ao regerar cena");
     } finally {
        setRegeneratingScene(null);
     }
  };

  const handleDownloadAll = async () => {
     if (!idea.storyboard) return;
     // Sequential download helper
     for (let i = 0; i < idea.storyboard.scenes.length; i++) {
        const scene = idea.storyboard.scenes[i];
        if (scene.imageUrl) {
           const link = document.createElement('a');
           link.href = scene.imageUrl;
           link.download = `cena_${scene.sequenceNumber}_${Date.now()}.png`;
           link.click();
           await new Promise(r => setTimeout(r, 500)); // small delay to prevent browser blocking
        }
     }
  };

  const handleGenerateSceneVideo = async (scene: Scene) => {
     alert(`Iniciar geração Veo para a cena ${scene.sequenceNumber} usando prompt JSON: ${JSON.stringify(scene.videoJson._meta)}... (Simulação)`);
  };

  return (
    <div className="space-y-8">
       {lightboxUrl && <ImageLightbox imageUrl={lightboxUrl} onClose={() => setLightboxUrl(null)}/>}
       
       <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
             <Clapperboard className="text-indigo-400" size={24}/> 
             Storyboard & Múltiplas Cenas
          </h3>
          <div className="flex gap-2">
             {idea.storyboard && (
                <>
                 <Button variant="secondary" onClick={handleDownloadAll}><Download size={16}/> Baixar Todas</Button>
                 <Button variant="outline" onClick={() => onUpdateIdea({...idea, storyboard: undefined})}>Novo Storyboard</Button>
                </>
             )}
          </div>
       </div>

       {!idea.storyboard ? (
         <Card className="max-w-2xl mx-auto text-center py-10">
            <h4 className="text-lg font-bold text-white mb-2">Criar Sequência de Vídeo</h4>
            <p className="text-zinc-400 mb-8">Gere múltiplas cenas consistentes baseadas em uma imagem, prontas para animação.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-8">
               <div>
                  <Label>1. Imagem Base (Referência de Estilo)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                     {localImages.map((img, i) => img ? (
                        <div key={i} onClick={() => setBaseImageIdx(i)} className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${baseImageIdx === i ? 'border-indigo-500' : 'border-transparent opacity-60'}`}>
                           <img src={img} className="w-full h-full object-cover" />
                        </div>
                     ) : null)}
                  </div>
               </div>
               <div>
                  <Label>2. Número de Cenas</Label>
                  <div className="flex gap-2 mt-2">
                     {[3, 4, 5, 6].map(n => (
                        <button key={n} onClick={() => setSceneCount(n)} className={`px-4 py-2 rounded border ${sceneCount === n ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'}`}>{n}</button>
                     ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Inclui: Intro, Cenas de Ação e CTA Final.</p>
                  <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-xs text-indigo-300">
                     <Sparkles size={12} className="inline mr-1"/> 
                     Estilos definidos na aba <strong>Vídeo</strong> serão aplicados.
                  </div>
               </div>
            </div>
            
            <Button onClick={handleGenerateStoryboard} disabled={isGenerating} className="w-full py-4">
               {isGenerating ? <><Sparkles className="animate-spin mr-2"/> Criando Cenas (Isso leva ~30s)...</> : 'Gerar Cenas'}
            </Button>
         </Card>
       ) : (
         <div className="overflow-x-auto pb-6">
            <div className="flex gap-6 min-w-max px-2">
               {idea.storyboard.scenes.map((scene, idx) => (
                  <div key={idx} className="w-96 flex-shrink-0 flex flex-col h-full">
                     <div className="flex items-center justify-between mb-2">
                        <Badge color={scene.type === 'CTA' ? 'green' : 'zinc'}>Cena {scene.sequenceNumber}: {scene.type}</Badge>
                     </div>
                     
                     {/* Image Area */}
                     <div className="group relative aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-indigo-500 transition-all mb-3">
                        {scene.imageUrl ? (
                           <>
                              <img src={scene.imageUrl} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                 <Button variant="secondary" onClick={() => setLightboxUrl(scene.imageUrl)}><Maximize size={16}/></Button>
                                 <Button variant="secondary" onClick={() => { const a = document.createElement('a'); a.href = scene.imageUrl!; a.download = `cena_${scene.sequenceNumber}.png`; a.click(); }}><Download size={16}/></Button>
                              </div>
                           </>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-2">
                              <AlertCircle size={24}/>
                              <span className="text-xs">Falha na geração</span>
                              <Button className="text-xs px-2 py-1" variant="outline" onClick={() => handleRegenerateScene(idx)}>Tentar Novamente</Button>
                           </div>
                        )}
                        {regeneratingScene === idx && (
                           <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                              <Loader2 className="animate-spin text-indigo-500"/>
                           </div>
                        )}
                     </div>
                     
                     {/* Controls Area */}
                     <div className="flex-1 flex flex-col gap-3">
                        <div className="min-h-[40px]">
                           <p className="text-sm text-white font-medium leading-snug">{scene.description}</p>
                        </div>

                        <div className="flex gap-2">
                           <Input 
                              placeholder="Ajuste (ex: adicionar chuva)" 
                              className="text-xs h-8"
                              value={refinements[idx] || ""}
                              onChange={(e) => setRefinements(prev => ({...prev, [idx]: e.target.value}))}
                           />
                           <button 
                              onClick={() => handleRegenerateScene(idx)}
                              disabled={regeneratingScene === idx}
                              className="h-8 w-8 flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-colors"
                              title="Regerar Cena"
                           >
                              <RefreshCcw size={14}/>
                           </button>
                        </div>
                        
                        <div className="bg-zinc-900 p-3 rounded border border-zinc-800 flex-1 max-h-32 overflow-y-auto custom-scrollbar">
                           <div className="flex justify-between items-center mb-1 sticky top-0 bg-zinc-900 pb-1">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase">Prompt / JSON</span>
                              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(scene.videoJson))} className="text-zinc-500 hover:text-white"><Copy size={12}/></button>
                           </div>
                           <pre className="text-[10px] text-zinc-500 font-mono whitespace-pre-wrap">{JSON.stringify(scene.videoJson, null, 2)}</pre>
                        </div>

                        <Button variant="primary" className="w-full text-xs mt-auto" onClick={() => handleGenerateSceneVideo(scene)}>
                           <Play size={12} className="mr-1"/> Gerar Vídeo (Veo)
                        </Button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
       )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const IdeaDetail: React.FC<Props> = ({ idea, mode, originalImage, aspectRatio, onBack, onUpdateIdea }) => {
  const [activeTab, setActiveTab] = useState<'design' | 'copy' | 'video' | 'storyboard'>('design');
  const [localImages, setLocalImages] = useState<(string | null)[]>(idea.generatedImageUrls || [null, null, null]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Ratio Modal State
  const [showRatioModal, setShowRatioModal] = useState(false);
  const [selectedImageForRatio, setSelectedImageForRatio] = useState<string | null>(null);
  const [selectedRatioIndex, setSelectedRatioIndex] = useState<number | null>(null);
  const [ratioTargetImage, setRatioTargetImage] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  useEffect(() => {
    if (idea.generatedImageUrls) {
      setLocalImages(idea.generatedImageUrls);
    }
  }, [idea.generatedImageUrls]);

  const handleRegenerate = async (index: number, refinement: string) => {
     if (!idea.visualPrompts?.[index]) return;
     setLoadingIndex(index);
     try {
        const sourceImage = localImages[index] || originalImage;
        // CORREÇÃO CRÍTICA: Passando aspectRatio como 5º argumento
        const img = await generateIdeaImage(idea.visualPrompts[index], sourceImage, mode, refinement, aspectRatio);
        const newImages = [...localImages];
        newImages[index] = img;
        setLocalImages(newImages);
        onUpdateIdea({ ...idea, generatedImageUrls: newImages });
     } catch (e) { alert("Erro ao gerar imagem"); }
     setLoadingIndex(null);
  };

  const handleCopyFromGallery = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert("Imagem copiada!");
    } catch (err) { console.error(err); }
  };
  const handleDownloadFromGallery = (url: string) => {
    const link = document.createElement('a'); link.href = url; link.download = `var-${Date.now()}.png`; link.click();
  };

  const openRatioModal = (imgUrl: string, index: number) => {
    setSelectedImageForRatio(imgUrl);
    setSelectedRatioIndex(index);
    setRatioTargetImage(null); // Reset target
    setShowRatioModal(true);
  };

  const handleRatioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setRatioTargetImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const generateTransparentCanvas = (ratioStr: string) => {
    let width = 1080;
    let height = 1080;
    
    // Parse ratio string (e.g. "9:16", "16:9", "1:1")
    if (ratioStr === '9:16') {
      width = 1080; height = 1920;
    } else if (ratioStr === '16:9') {
      width = 1920; height = 1080;
    } else if (ratioStr === '4:3') {
      width = 1440; height = 1080;
    } else if (ratioStr === '3:4') {
      width = 1080; height = 1440;
    }
    
    // Create invisible canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Context is transparent by default
    const dataUrl = canvas.toDataURL('image/png');
    
    // 1. Auto-fill Field B
    setRatioTargetImage(dataUrl);
    
    // Removed automatic download logic
  };

  const handleExpandImage = async () => {
    if (!selectedImageForRatio || !ratioTargetImage || selectedRatioIndex === null) return;
    setIsExpanding(true);
    try {
        const newImg = await expandImageRatio(selectedImageForRatio, ratioTargetImage);
        if (newImg) {
            const newImages = [...localImages];
            newImages[selectedRatioIndex] = newImg;
            setLocalImages(newImages);
            onUpdateIdea({ ...idea, generatedImageUrls: newImages });
            setShowRatioModal(false);
        } else {
            alert("Falha ao expandir imagem.");
        }
    } catch (error) {
        console.error(error);
        alert("Erro na IA ao ajustar proporção.");
    } finally {
        setIsExpanding(false);
    }
  };

  return (
    <div className="animate-fade-in pb-20">
      {lightboxImage && <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)}/>}
      
      {/* Ratio Adjustment Modal */}
      <Modal isOpen={showRatioModal} onClose={() => setShowRatioModal(false)} title="Ajuste de Proporção">
         <div className="space-y-6">
            {/* Section A: Fast Download */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
               <Label>A. Gerar Canvas Automático</Label>
               <div className="flex items-center justify-between mt-2">
                  <span className="text-zinc-400 text-sm">Proporção Atual: <strong className="text-white">{aspectRatio || "1:1"}</strong></span>
                  <Button variant="secondary" onClick={() => generateTransparentCanvas(aspectRatio || "1:1")}>
                     <Scan size={14}/> Gerar Canvas {aspectRatio || "1:1"}
                  </Button>
               </div>
               <p className="text-xs text-zinc-500 mt-2">Gera um canvas transparente e aplica automaticamente no Campo B.</p>
            </div>

            {/* Section B: Reference Image */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
               <Label>B. Imagem de Referência (Novo Canvas)</Label>
               <p className="text-xs text-zinc-500 mb-3">Anexe uma imagem transparente com a proporção desejada. Se usar o botão acima, este campo será preenchido automaticamente.</p>
               
               <div className="border-2 border-dashed border-zinc-800 rounded-lg p-4 text-center hover:bg-zinc-900 transition-colors relative">
                   <input type="file" accept="image/*" onChange={handleRatioUpload} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                   {ratioTargetImage ? (
                      <div className="relative h-32 mx-auto">
                        <img src={ratioTargetImage} className="h-full mx-auto object-contain border border-zinc-700 bg-[url('https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,e_colorize,co_rgb:27272a/checkerboard.png')]" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-bold opacity-0 hover:opacity-100 transition-opacity">Trocar Imagem</div>
                        <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 rounded font-bold">Carregado</div>
                      </div>
                   ) : (
                      <div className="text-zinc-500 py-4">
                        <Upload className="mx-auto mb-2" size={20} />
                        <span className="text-sm">Adicionar Imagem de Referência</span>
                      </div>
                   )}
               </div>
            </div>

            {/* Section C: AI Action */}
            <div className="pt-2">
                <Button onClick={handleExpandImage} disabled={!ratioTargetImage || isExpanding} className="w-full py-3">
                    {isExpanding ? <><Sparkles className="animate-spin" /> Ajustando Proporção...</> : 'Ajustar Proporção'}
                </Button>
            </div>
         </div>
      </Modal>

      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"><ArrowLeft size={24}/></button>
        <div><h1 className="text-3xl font-bold text-white">{idea.title}</h1><p className="text-zinc-400 text-sm">{idea.description}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
         {idea.visualPrompts?.map((prompt, i) => (
           <div key={i} className="group/card">
              <div onClick={() => setSelectedImageIndex(i)} className={`relative aspect-square bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer transition-all ${selectedImageIndex === i ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black shadow-lg shadow-indigo-900/20' : 'border border-zinc-800 hover:border-zinc-600'}`}>
                 {localImages[i] ? (
                    <>
                      <img src={localImages[i]!} className="w-full h-full object-cover" alt={`Var ${i}`}/>
                      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2 p-6">
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); setLightboxImage(localImages[i]) }} className="w-full text-xs bg-zinc-800/80 hover:bg-indigo-600 border-zinc-700 text-white justify-start pl-6"><Maximize size={14}/> Visualizar</Button>
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); handleCopyFromGallery(localImages[i]!) }} className="w-full text-xs bg-zinc-800/80 hover:bg-indigo-600 border-zinc-700 text-white justify-start pl-6"><Copy size={14}/> Copiar</Button>
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); handleDownloadFromGallery(localImages[i]!) }} className="w-full text-xs bg-zinc-800/80 hover:bg-indigo-600 border-zinc-700 text-white justify-start pl-6"><Download size={14}/> Baixar</Button>
                        {/* New Ratio Button */}
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openRatioModal(localImages[i]!, i); }} className="w-full text-xs bg-zinc-800/80 hover:bg-purple-600 border-zinc-700 text-white justify-start pl-6"><Scan size={14}/> Proporção</Button>
                      </div>
                      {selectedImageIndex === i && (<div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">Editando</div>)}
                    </>
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                      {loadingIndex === i ? (
                        <div className="flex flex-col items-center text-indigo-400">
                          <Loader2 className="animate-spin mb-2 text-indigo-500" size={24} />
                          <span className="text-xs font-semibold animate-pulse">Gerando Arte...</span>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRegenerate(i, ""); }}
                          className="flex flex-col items-center gap-1.5 p-3 hover:bg-zinc-800/40 rounded-xl transition-all group/btn w-full h-full justify-center"
                        >
                          <Sparkles className="text-indigo-400 group-hover/btn:scale-110 transition-transform" size={22} />
                          <span className="text-xs font-bold text-zinc-200">Gerar com IA</span>
                          <span className="text-[10px] text-zinc-500">Variação {i + 1}</span>
                        </button>
                      )}
                    </div>
                  )}
              </div>
              <div className="mt-3 flex gap-2">
                 <input id={`refine-${i}`} placeholder="Ajuste (ex: mais luz)" disabled={loadingIndex === i} className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50" onKeyDown={(e) => { if (e.key === 'Enter') handleRegenerate(i, e.currentTarget.value); }} />
                 <button onClick={() => handleRegenerate(i, (document.getElementById(`refine-${i}`) as HTMLInputElement).value)} disabled={loadingIndex === i} className="p-1.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-50" title="Regerar com ajuste"><RefreshCcw size={14}/></button>
              </div>
           </div>
         ))}
      </div>
      <div className="flex border-b border-zinc-800 mb-8 overflow-x-auto">
        {[
          {id: 'design', label: `Direção de Arte (Var ${selectedImageIndex + 1})`, icon: Palette}, 
          {id: 'copy', label: `Social Copy (Var ${selectedImageIndex + 1})`, icon: Type}, 
          {id: 'video', label: 'Vídeo Prompt & Veo', icon: Film},
          {id: 'storyboard', label: 'Storyboard', icon: Clapperboard}
        ].map(tab => (
           <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}><tab.icon size={18}/> {tab.label}</button>
        ))}
      </div>
      <div className="min-h-[400px]">
         {activeTab === 'design' && (<ArtDirectionStudio idea={idea} onUpdateIdea={onUpdateIdea} originalImage={originalImage} selectedIndex={selectedImageIndex} localImages={localImages} aspectRatio={aspectRatio} />)}
         {activeTab === 'copy' && (<SocialCopySuite copy={idea.specificCopywriting?.[selectedImageIndex] || idea.copywriting} selectedIndex={selectedImageIndex} />)}
         {activeTab === 'video' && (<VideoDirector initialJson={idea.videoJsonTemplate} generatedImages={localImages}/>)}
         {activeTab === 'storyboard' && (<StoryboardStudio idea={idea} localImages={localImages} onUpdateIdea={onUpdateIdea} aspectRatio={aspectRatio} />)}
      </div>
    </div>
  );
};