
import React from 'react';
import { Square, RectangleVertical, RectangleHorizontal, Download } from 'lucide-react';

export const TransparentPngGenerator: React.FC = () => {
  const presets = [
    { 
      id: 'square', 
      filename: '1_1_quadrado', 
      label: 'Quadrado (1:1)', 
      width: 1080, 
      height: 1080, 
      icon: Square,
      desc: '1080x1080 • Instagram Feed' 
    },
    { 
      id: 'story', 
      filename: '9_16_story', 
      label: 'Story (9:16)', 
      width: 1080, 
      height: 1920, 
      icon: RectangleVertical,
      desc: '1080x1920 • TikTok / Reels' 
    },
    { 
      id: 'wide', 
      filename: '16_9_widescreen', 
      label: 'Widescreen (16:9)', 
      width: 1920, 
      height: 1080, 
      icon: RectangleHorizontal,
      desc: '1920x1080 • YouTube / Vídeo' 
    }
  ];

  const generateAndDownload = (width: number, height: number, filename: string) => {
    // Create an invisible canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Get context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height); // Ensure transparency
    }

    // Create download link
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-zinc-400 text-sm">
          Selecione um formato para baixar instantaneamente um arquivo PNG 100% transparente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => generateAndDownload(preset.width, preset.height, preset.filename)}
            className="flex flex-col items-center justify-center p-6 bg-zinc-950 border border-zinc-800 rounded-xl hover:bg-zinc-900 hover:border-indigo-500 hover:scale-[1.02] transition-all group duration-200"
          >
            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-900/20 group-hover:text-indigo-400 text-zinc-500 transition-colors">
              <preset.icon size={24} />
            </div>
            <span className="text-white font-bold mb-1">{preset.label}</span>
            <span className="text-xs text-zinc-500 mb-4">{preset.desc}</span>
            
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <Download size={12} />
              Baixar PNG
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
