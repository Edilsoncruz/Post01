
import { MarketingInputs, Idea, SheetRow } from '../types';

declare global {
  interface Window {
    XLSX: any;
  }
}

/**
 * Exports the current project data (Inputs + Generated Ideas) to a local .xlsx file.
 */
export const exportToExcel = (inputs: MarketingInputs, ideas: Idea[]) => {
  if (!window.XLSX) {
    alert("Erro: Biblioteca XLSX não carregada.");
    return;
  }

  const safeClient = (inputs.clientName || "Client").replace(/[^a-z0-9]/gi, '_');

  // Flatten data structure for Excel
  // If we have ideas, create one row per idea. If not, just one row with inputs.
  const rows = ideas && ideas.length > 0 ? ideas.map((idea, index) => {
    const videoPrompt = idea.videoJsonTemplate 
      ? `${idea.videoJsonTemplate.cinematography.art_style} video of ${idea.videoJsonTemplate.scene_elements.subject_details}`
      : "";

    // Generate File References that match the ZIP download structure
    const conceptNum = index + 1;
    const fileRefs: string[] = [];

    // Main Variations References
    if (idea.generatedImageUrls) {
      idea.generatedImageUrls.forEach((url, idx) => {
        if (url) fileRefs.push(`${safeClient}_C${conceptNum}_Var${idx+1}.png`);
      });
    }

    // Storyboard References
    if (idea.storyboard?.scenes) {
      idea.storyboard.scenes.forEach(scene => {
        if (scene.imageUrl) fileRefs.push(`${safeClient}_C${conceptNum}_SB_${scene.sequenceNumber}.png`);
      });
    }

    return {
      "Data": new Date().toLocaleString('pt-BR'),
      "Cliente": inputs.clientName || "",
      "Modo": inputs.mode || "",
      "Público Alvo": inputs.targetAudience || "",
      "Objetivo": inputs.objective || "",
      "Diretrizes": inputs.guidance || "",
      "ID Ideia": idea.id || "",
      "Título Ideia": idea.title || "",
      "Descrição Ideia": idea.description || "",
      "Headlines": idea.copywriting?.socialCaptionHeadlines?.join(" | ") || "",
      "Legenda": idea.copywriting?.caption || "",
      "Hashtags": idea.copywriting?.hashtags?.join(" ") || "",
      "Prompt Canva (V1)": idea.visualStrategy?.specificGuides?.[0]?.canvaPrompt || "",
      "Video Prompt": videoPrompt,
      "Arquivos Referência (ZIP)": fileRefs.join(", ")
    };
  }) : [{
    "Data": new Date().toLocaleString('pt-BR'),
    "Cliente": inputs.clientName || "",
    "Modo": inputs.mode || "",
    "Público Alvo": inputs.targetAudience || "",
    "Objetivo": inputs.objective || "",
    "Diretrizes": inputs.guidance || "",
    "ID Ideia": "-", "Título Ideia": "-", "Descrição Ideia": "-", "Headlines": "-", "Legenda": "-", "Hashtags": "-", "Prompt Canva (V1)": "-", "Video Prompt": "-", "Arquivos Referência (ZIP)": "-"
  }];

  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "Estratégia");
  
  // Auto-column width (basic approximation)
  const wscols = [
    {wch: 20}, {wch: 20}, {wch: 10}, {wch: 30}, {wch: 30}, {wch: 30},
    {wch: 5}, {wch: 20}, {wch: 40}, {wch: 40}, {wch: 40}, {wch: 30}, {wch: 50}
  ];
  worksheet['!cols'] = wscols;

  const safeName = (inputs.clientName || "Projeto").replace(/[^a-z0-9]/gi, '_').toLowerCase();
  window.XLSX.writeFile(workbook, `${safeName}_estrategia.xlsx`);
};

/**
 * Parses a user-uploaded .xlsx file and returns standardized SheetRows
 */
export const parseExcel = (file: File): Promise<SheetRow[]> => {
  return new Promise((resolve, reject) => {
    if (!window.XLSX) {
      reject("Biblioteca XLSX não disponível.");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        
        // Assume first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const json = window.XLSX.utils.sheet_to_json(worksheet);
        
        // Map fields safely
        const rows: SheetRow[] = json.map((row: any) => ({
          timestamp: row["Data"] || "",
          clientName: row["Cliente"] || "",
          mode: row["Modo"]?.toLowerCase() || "fidelity",
          audience: row["Público Alvo"] || "",
          objective: row["Objetivo"] || "",
          guidance: row["Diretrizes"] || "",
          ideaTitle: row["Título Ideia"],
          ideaDescription: row["Descrição Ideia"],
          copyHeadlines: row["Headlines"],
          copyCaption: row["Legenda"],
          videoPrompt: row["Video Prompt"]
        }));
        
        resolve(rows);
      } catch (err) {
        console.error("Error parsing excel", err);
        reject("Erro ao ler arquivo Excel. Verifique o formato.");
      }
    };
    reader.onerror = () => reject("Erro de leitura do arquivo.");
    reader.readAsBinaryString(file);
  });
};
