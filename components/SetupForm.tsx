
import React, { useState } from 'react';
import { Upload, Lock, Palette, ArrowRight, Loader2, FileSpreadsheet, Sparkles, X, Plus, Type, Image as ImageIcon, Smartphone, Monitor, Square, Minus, RectangleVertical, RectangleHorizontal } from 'lucide-react';
import { MarketingInputs, GenerationMode } from '../types';
import { Button, Card, Input, Label, TextArea, VisualSelect } from './UIComponents';
import { improveInputText } from '../services/geminiService';

interface Props {
  inputs: MarketingInputs;
  setInputs: React.Dispatch<React.SetStateAction<MarketingInputs>>;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenSheetImport: () => void;
}

export const SetupForm: React.FC<Props> = ({ inputs, setInputs, onGenerate, isGenerating, onOpenSheetImport }) => {
  const [improvingField, setImprovingField] = useState<string | null>(null);

  // Utility to resize image
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 800; 
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            reject("Canvas Context Error");
          }
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      const newBase64s: string[] = [];

      for (const file of newFiles) {
        try {
          const resized = await resizeImage(file);
          newBase64s.push(resized);
        } catch (error) {
          console.error("Error resizing image:", error);
        }
      }

      setInputs(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles],
        imagesBase64: [...prev.imagesBase64, ...newBase64s]
      }));
    }
  };

  const removeImage = (index: number) => {
    setInputs(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagesBase64: prev.imagesBase64.filter((_, i) => i !== index)
    }));
  };

  const handleImproveText = async (field: keyof MarketingInputs, label: string) => {
    const currentText = inputs[field] as string;
    if (!currentText || currentText.length < 3) return;

    setImprovingField(field);
    try {
      const improved = await improveInputText(currentText, label);
      setInputs(prev => ({ ...prev, [field]: improved }));
    } catch (error) {
      console.error(error);
    } finally {
      setImprovingField(null);
    }
  };

  const updateConceptCount = (delta: number) => {
    setInputs(prev => {
      const newVal = (prev.conceptCount || 3) + delta;
      if (newVal < 1) return prev;
      if (newVal > 10) return prev;
      return { ...prev, conceptCount: newVal };
    });
  };

  // Determine if Generate button should be enabled
  const canGenerate = inputs.clientName && inputs.projectName && inputs.targetAudience && (
    (inputs.inputType === 'image' && inputs.imagesBase64.length > 0) ||
    (inputs.inputType === 'text' && inputs.textPrompt && inputs.textPrompt.length > 5)
  );

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="text-center mb-10 flex flex-col items-center relative">
        <h1 className="text-4xl font-bold text-white mb-3">Novo Projeto</h1>
        <p className="text-zinc-400 mb-6">Comece enviando imagens do produto ou descrevendo sua ideia.</p>
        
        <Button 
          variant="secondary" 
          onClick={onOpenSheetImport} 
          className="text-sm border-dashed border-zinc-700 text-zinc-400 hover:text-white hover:border-green-500 hover:bg-green-900/10"
        >
          <FileSpreadsheet size={14} /> Importar Excel
        </Button>
      </div>

      <Card className="space-y-8">
        {/* INPUT TYPE TABS */}
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setInputs(prev => ({ ...prev, inputType: 'image' }))}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              inputs.inputType === 'image' 
                ? 'bg-zinc-800 text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ImageIcon size={16} /> Upload de Produto
          </button>
          <button 
            onClick={() => setInputs(prev => ({ ...prev, inputType: 'text', mode: GenerationMode.CREATIVE }))}
            className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              inputs.inputType === 'text' 
                ? 'bg-indigo-600/20 text-indigo-400 shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Type size={16} /> Criar via Prompt
          </button>
        </div>

        {/* --- IMAGE UPLOAD FLOW --- */}
        {inputs.inputType === 'image' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
            <div>
              <Label>Imagens do Produto (Múltiplos Ângulos)</Label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {inputs.imagesBase64.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-700 group">
                    <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded font-bold">
                        Capa
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="relative aspect-square border-2 border-dashed border-zinc-700 rounded-xl hover:bg-zinc-900/50 transition-colors flex flex-col items-center justify-center cursor-pointer text-zinc-500 hover:text-indigo-400 group">
                  <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-medium">Adicionar</span>
                </div>
              </div>
              <p className="text-xs text-zinc-500">
                Adicione até 4 imagens de ângulos diferentes para melhor precisão.
              </p>
            </div>

            {/* Added Aspect Ratio Selector for Image Mode */}
            <div>
                <Label>Formato de Saída (Aspect Ratio)</Label>
                <VisualSelect 
                  options={[
                    { id: '1:1', label: 'Quadrado (1:1)', icon: Square, description: 'Instagram Feed' },
                    { id: '9:16', label: 'Vertical (9:16)', icon: RectangleVertical, description: 'Stories / Reels' },
                    { id: '16:9', label: 'Widescreen (16:9)', icon: RectangleHorizontal, description: 'YouTube / Vídeo' }
                  ]}
                  value={inputs.aspectRatio}
                  onChange={(val) => setInputs(prev => ({ ...prev, aspectRatio: val as any }))}
                />
            </div>
          </div>
        )}

        {/* --- TEXT PROMPT FLOW --- */}
        {inputs.inputType === 'text' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
             <div className="relative">
                <div className="flex justify-between items-center mb-1">
                  <Label className="mb-0 text-indigo-400">Descrição Visual da Ideia</Label>
                  <button 
                    onClick={() => handleImproveText('textPrompt', 'Descrição Visual do Produto')}
                    disabled={!inputs.textPrompt || improvingField === 'textPrompt'}
                    className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    {improvingField === 'textPrompt' ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} 
                    Melhorar com IA
                  </button>
                </div>
                <TextArea 
                  placeholder="Descreva o produto, cenário e estilo visual com detalhes. Ex: Um tênis de corrida futurista flutuando sobre uma pista de neon..."
                  value={inputs.textPrompt}
                  onChange={(e) => setInputs(prev => ({ ...prev, textPrompt: e.target.value }))}
                  className="min-h-[140px] border-indigo-500/30 focus:border-indigo-500"
                />
             </div>

             <div>
                <Label>Formato da Imagem (Aspect Ratio)</Label>
                <VisualSelect 
                  options={[
                    { id: '1:1', label: 'Quadrado (1:1)', icon: Square, description: 'Instagram Feed' },
                    { id: '9:16', label: 'Vertical (9:16)', icon: RectangleVertical, description: 'Stories / Reels' },
                    { id: '16:9', label: 'Widescreen (16:9)', icon: RectangleHorizontal, description: 'YouTube / Vídeo' }
                  ]}
                  value={inputs.aspectRatio}
                  onChange={(val) => setInputs(prev => ({ ...prev, aspectRatio: val as any }))}
                />
             </div>

             <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl text-sm text-indigo-300 flex items-start gap-3">
               <Palette className="shrink-0 mt-0.5" size={18} />
               <div>
                 <strong className="block mb-1 text-white">Modo Criativo Ativado</strong>
                 Como não há imagem de referência, o sistema usará o modo de Exploração Criativa para gerar conceitos visuais do zero baseados no seu prompt.
               </div>
             </div>
          </div>
        )}

        {/* Common Inputs */}
        <div className="border-t border-zinc-800 pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Nome do Cliente</Label>
              <Input 
                placeholder="Ex: Nike"
                value={inputs.clientName}
                onChange={(e) => setInputs(prev => ({ ...prev, clientName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Nome do Projeto</Label>
              <Input 
                placeholder="Ex: Verão 2025"
                value={inputs.projectName}
                onChange={(e) => setInputs(prev => ({ ...prev, projectName: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* MODE SELECTOR (Only if Image Input is selected) */}
              {inputs.inputType === 'image' && (
                <div>
                  <Label>Modo de Geração</Label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setInputs(prev => ({ ...prev, mode: GenerationMode.FIDELITY }))}
                      className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex items-center gap-3 ${
                        inputs.mode === GenerationMode.FIDELITY 
                          ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500/50' 
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <Lock size={16} className={inputs.mode === GenerationMode.FIDELITY ? 'text-indigo-400' : 'text-zinc-500'} />
                      <div>
                         <span className={`block text-sm font-bold ${inputs.mode === GenerationMode.FIDELITY ? 'text-white' : 'text-zinc-300'}`}>Fidelidade</span>
                         <span className="text-xs text-zinc-500">Preserva o produto</span>
                      </div>
                    </button>

                    <button
                      onClick={() => setInputs(prev => ({ ...prev, mode: GenerationMode.CREATIVE }))}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                        inputs.mode === GenerationMode.CREATIVE 
                          ? 'bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500/50' 
                          : 'bg-zinc-950 border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <Palette size={16} className={inputs.mode === GenerationMode.CREATIVE ? 'text-purple-400' : 'text-zinc-500'} />
                      <div>
                        <span className={`block text-sm font-bold ${inputs.mode === GenerationMode.CREATIVE ? 'text-white' : 'text-zinc-300'}`}>Criativo</span>
                        <span className="text-xs text-zinc-500">Liberdade artística</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* CONCEPT COUNT */}
              <div>
                <Label>Quantidade de Conceitos</Label>
                <div className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 rounded-lg p-3 h-[92px]">
                   <button 
                    onClick={() => updateConceptCount(-1)}
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors"
                   >
                     <Minus size={18} />
                   </button>
                   <div className="flex-1 text-center">
                     <span className="text-3xl font-bold text-white">{inputs.conceptCount || 3}</span>
                     <span className="block text-xs text-zinc-500">Conceitos</span>
                   </div>
                   <button 
                    onClick={() => updateConceptCount(1)}
                    className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors"
                   >
                     <Plus size={18} />
                   </button>
                </div>
              </div>
          </div>

          {/* Text Inputs with AI Enhancement */}
          <div className="space-y-6">
            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Público Alvo</Label>
                <button 
                  onClick={() => handleImproveText('targetAudience', 'Público Alvo')}
                  disabled={!inputs.targetAudience || improvingField === 'targetAudience'}
                  className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  title="Melhorar com IA"
                >
                  {improvingField === 'targetAudience' ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} 
                  Melhorar Texto
                </button>
              </div>
              <Input 
                placeholder="Ex: Jovens entusiastas de fitness"
                value={inputs.targetAudience}
                onChange={(e) => setInputs(prev => ({ ...prev, targetAudience: e.target.value }))}
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                <Label className="mb-0">Objetivo</Label>
                <button 
                  onClick={() => handleImproveText('objective', 'Objetivo da Campanha')}
                  disabled={!inputs.objective || improvingField === 'objective'}
                  className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  {improvingField === 'objective' ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} 
                  Melhorar Texto
                </button>
              </div>
              <Input 
                placeholder="Ex: Aumentar reconhecimento da marca"
                value={inputs.objective}
                onChange={(e) => setInputs(prev => ({ ...prev, objective: e.target.value }))}
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1">
                 <Label className="mb-0">Diretrizes Adicionais</Label>
                 <button 
                    onClick={() => handleImproveText('guidance', 'Diretrizes Criativas')}
                    disabled={!inputs.guidance || improvingField === 'guidance'}
                    className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    {improvingField === 'guidance' ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} 
                    Melhorar Texto
                  </button>
              </div>
              <TextArea 
                placeholder="Cores específicas, humor, elementos a evitar?"
                value={inputs.guidance}
                onChange={(e) => setInputs(prev => ({ ...prev, guidance: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={onGenerate} 
            className="w-full py-4 text-lg" 
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" /> Analisando & Gerando Estratégia...
              </>
            ) : (
              <>
                Gerar Estratégia <ArrowRight size={20} />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
