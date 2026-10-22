
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Trash2, X, Loader2, Images } from 'lucide-react';
import { AppStep, GenerationMode, Idea, MarketingInputs, ProjectHistoryItem, SheetRow } from './types';
import { SetupForm } from './components/SetupForm';
import { Dashboard } from './components/Dashboard';
import { IdeaDetail } from './components/IdeaDetail';
import { SheetManager } from './components/SheetManager';
import { TransparentPngGenerator } from './components/TransparentPngGenerator';
import { Modal } from './components/UIComponents';
import { generateStrategy, generateIdeaImage } from './services/geminiService';
import { exportToExcel } from './services/sheetService';

import { saveProjectToFirebase, loadProjectsFromFirebase, deleteProjectFromFirebase } from './firebase';

// Add global definitions for JSZip and FileSaver
declare global {
  interface Window {
    JSZip: any;
    saveAs: any;
  }
}

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.SETUP);
  const [inputs, setInputs] = useState<MarketingInputs>({
    clientName: '',
    projectName: '',
    targetAudience: '',
    objective: '',
    guidance: '',
    images: [],
    imagesBase64: [],
    // New Fields
    inputType: 'image',
    textPrompt: '',
    aspectRatio: '1:1',
    mode: GenerationMode.FIDELITY,
    conceptCount: 1
  });
  
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<ProjectHistoryItem[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Sheet State
  const [showSheetImport, setShowSheetImport] = useState(false);
  
  // PNG Generator State
  const [showPngGenerator, setShowPngGenerator] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        const projects = await loadProjectsFromFirebase();
        setHistoryItems(projects);
      } catch (e: any) {
        console.error("Failed to load history from Firebase", e);
        if (e.message?.includes("Missing or insufficient permissions") || e.code === 'permission-denied') {
          alert("Erro de permissão no Firebase! Acesse o console do Firebase > Firestore Database > Rules e altere para 'allow read, write: if true;' para testar.");
        }
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadData();
  }, []);

  const saveToHistory = async () => {
    if (!inputs.clientName) {
      alert("Por favor, defina um Nome de Cliente antes de salvar.");
      return;
    }
    if (!inputs.projectName) {
      alert("Por favor, defina um Nome de Projeto antes de salvar.");
      return;
    }
    
    setIsSaving(true);
    const newItem: ProjectHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      clientName: inputs.clientName,
      projectName: inputs.projectName,
      inputs: inputs,
      ideas: ideas
    };

    const updatedHistory = [newItem, ...historyItems];
    setHistoryItems(updatedHistory);
    
    try {
      await saveProjectToFirebase(newItem);
      alert("Projeto salvo na nuvem com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar no Firebase:", e);
      alert("Erro ao salvar na nuvem. Verifique o console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportExcel = () => {
    if (!inputs.clientName) {
      alert("Preencha o nome do cliente antes de exportar.");
      return;
    }
    try {
      exportToExcel(inputs, ideas);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar arquivo.");
    }
  };

  const handleDownloadAllImages = async () => {
    if (!window.JSZip || !window.saveAs) {
      alert("Bibliotecas de ZIP não carregadas.");
      return;
    }
    
    if (!ideas || ideas.length === 0) {
      alert("Nenhuma imagem gerada para baixar.");
      return;
    }

    setIsZipping(true);
    try {
      const zip = new window.JSZip();
      const safeClientName = (inputs.clientName || "Client").replace(/[^a-z0-9]/gi, '_');
      let count = 0;

      // Helper to fetch blob from base64/url
      const fetchBlob = async (url: string) => {
         const res = await fetch(url);
         return await res.blob();
      };

      // Loop through all ideas
      for (let i = 0; i < ideas.length; i++) {
        const idea = ideas[i];
        const conceptNum = i + 1;

        // 1. Download Main Variations
        if (idea.generatedImageUrls) {
          for (let j = 0; j < idea.generatedImageUrls.length; j++) {
            const url = idea.generatedImageUrls[j];
            if (url) {
              try {
                const blob = await fetchBlob(url);
                // Format: Client_C1_Var1.png
                const filename = `${safeClientName}_C${conceptNum}_Var${j+1}.png`;
                zip.file(filename, blob);
                count++;
              } catch (e) { console.error("Error adding image to zip", e); }
            }
          }
        }

        // 2. Download Storyboard Scenes
        if (idea.storyboard?.scenes) {
          for (const scene of idea.storyboard.scenes) {
            if (scene.imageUrl) {
              try {
                const blob = await fetchBlob(scene.imageUrl);
                // Format: Client_C1_SB_1.png
                const filename = `${safeClientName}_C${conceptNum}_SB_${scene.sequenceNumber}.png`;
                zip.file(filename, blob);
                count++;
              } catch (e) { console.error("Error adding scene to zip", e); }
            }
          }
        }
      }

      if (count > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        window.saveAs(content, `${safeClientName}_Assets_Gerais.zip`);
      } else {
        alert("Nenhuma imagem encontrada para download.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao criar ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  const loadFromHistory = (item: ProjectHistoryItem) => {
    setInputs(item.inputs);
    setIdeas(item.ideas);
    setStep(AppStep.DASHBOARD);
    setShowHistory(false);
  };

  const loadFromSheetRow = (row: SheetRow) => {
    setInputs(prev => ({
      ...prev,
      clientName: row.clientName,
      targetAudience: row.audience,
      objective: row.objective,
      guidance: row.guidance,
      mode: row.mode === 'fidelity' ? GenerationMode.FIDELITY : GenerationMode.CREATIVE,
      conceptCount: 3
    }));
    setShowSheetImport(false);
    alert(`Dados de "${row.clientName}" carregados! Por favor, faça o upload das imagens do produto novamente para continuar.`);
  };

  const deleteFromHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyItems.filter(item => item.id !== id);
    setHistoryItems(updated);
    
    try {
      await deleteProjectFromFirebase(id);
    } catch (err) {
      console.error("Erro ao excluir do Firebase", err);
    }
  };

  const handleGenerateStrategy = async () => {
    // Validation check based on input type
    if (inputs.inputType === 'image' && inputs.imagesBase64.length === 0) return;
    if (inputs.inputType === 'text' && (!inputs.textPrompt || inputs.textPrompt.length < 5)) return;
    
    setIsGenerating(true);
    try {
      // 1. Generate Strategy (Logic handles Text vs Image inside service)
      const strategy = await generateStrategy(inputs);
      
      setIdeas(strategy.ideas);
      setStep(AppStep.DASHBOARD);
      
      // 2. Auto-save history
      if (inputs.clientName && inputs.projectName) {
         const newItem: ProjectHistoryItem = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          clientName: inputs.clientName,
          projectName: inputs.projectName,
          inputs: inputs,
          ideas: strategy.ideas
        };
        const updatedHistory = [newItem, ...historyItems];
        setHistoryItems(updatedHistory);
        
        saveProjectToFirebase(newItem).catch(err => {
          console.error("Auto-save failed:", err);
          if (err.message?.includes("Missing or insufficient permissions") || err.code === 'permission-denied') {
            alert("Erro ao salvar: O seu banco de dados Firebase está bloqueado. Altere as Regras (Rules) do Firestore para permitir leitura e escrita.");
          }
        });
      }

      // 3. Image generation is now manual and on-demand within each idea's detail view (saves tokens/quota)
      if (strategy.ideas && Array.isArray(strategy.ideas)) {
        setIdeas(strategy.ideas.map(idea => ({
          ...idea,
          generatedImageUrls: idea.generatedImageUrls || [null, null, null]
        })));
      }

    } catch (error) {
      console.error("Strategy generation failed:", error);
      alert("Falha ao gerar estratégia. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setStep(AppStep.DETAIL);
  };

  const handleUpdateIdea = (updatedIdea: Idea) => {
    setSelectedIdea(updatedIdea);
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
  };

  const primaryImage = inputs.imagesBase64.length > 0 ? inputs.imagesBase64[0] : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(AppStep.SETUP)}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <LayoutDashboard className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight">End-to-End <span className="text-indigo-400 font-light">AI</span></span>
          </div>
          
          <div className="flex items-center gap-4">
             {step !== AppStep.SETUP && (
               <>
                <button 
                  onClick={handleDownloadAllImages}
                  disabled={isZipping}
                  className="text-sm flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                  title="Baixar todas as imagens geradas"
                >
                  {isZipping ? <Loader2 size={16} className="animate-spin"/> : <Images size={16} />}
                  {isZipping ? 'Zipando...' : 'Baixar Imagens (ZIP)'}
                </button>
               </>
             )}
             <button 
               onClick={() => {
                 setStep(AppStep.SETUP);
                 setIdeas([]);
                 setInputs(prev => ({
                    ...prev, 
                    clientName: '', 
                    projectName: '',
                    images: [], 
                    imagesBase64: [], 
                    textPrompt: '', 
                    inputType: 'image',
                    conceptCount: 3
                 }));
               }}
               className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-sm text-white transition-colors"
             >
               Novo Projeto
             </button>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SheetManager 
        isOpen={showSheetImport} 
        onClose={() => setShowSheetImport(false)} 
        onImport={loadFromSheetRow}
      />

      <Modal
        title="Gerador de Proporção (PNG Transparente)"
        isOpen={showPngGenerator}
        onClose={() => setShowPngGenerator(false)}
      >
        <TransparentPngGenerator />
      </Modal>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 h-full border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Projetos Salvos (Nuvem)</h2>
              <button onClick={() => setShowHistory(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
            </div>
            
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                <Loader2 className="animate-spin mb-2" size={24} />
                <p>Carregando projetos da nuvem...</p>
              </div>
            ) : historyItems.length === 0 ? (
              <p className="text-zinc-500 text-center py-10">Nenhum projeto salvo na nuvem.</p>
            ) : (
              <div className="space-y-3">
                {historyItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => loadFromHistory(item)}
                    className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-zinc-900 transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-bold text-indigo-400 block">{item.clientName || 'Sem Nome'}</span>
                        <span className="text-sm text-zinc-300 block">{item.projectName || 'Sem Projeto'}</span>
                      </div>
                      <button 
                        onClick={(e) => deleteFromHistory(item.id, e)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{new Date(item.timestamp).toLocaleString('pt-BR')}</p>
                    <div className="mt-2 flex gap-2">
                       <span className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 border border-zinc-700">
                         {item.inputs.inputType === 'text' ? 'Texto' : (item.inputs.mode === GenerationMode.FIDELITY ? 'Fidelidade' : 'Criativo')}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {step === AppStep.SETUP && (
          <SetupForm 
            inputs={inputs} 
            setInputs={setInputs} 
            onGenerate={handleGenerateStrategy} 
            isGenerating={isGenerating}
            onOpenSheetImport={() => setShowSheetImport(true)}
          />
        )}

        {step === AppStep.DASHBOARD && (
          <Dashboard ideas={ideas} onSelectIdea={handleSelectIdea} />
        )}

        {step === AppStep.DETAIL && selectedIdea && (
          <IdeaDetail 
            idea={selectedIdea} 
            mode={inputs.mode} 
            originalImage={primaryImage}
            aspectRatio={inputs.aspectRatio}
            onBack={() => setStep(AppStep.DASHBOARD)}
            onUpdateIdea={handleUpdateIdea}
          />
        )}
      </main>
    </div>
  );
}

export default App;
