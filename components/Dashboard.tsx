
import React, { useState } from 'react';
import { Idea } from '../types';
import { Card, Badge } from './UIComponents';
import { ArrowRight, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';

interface Props {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
}

const IdeaCard: React.FC<{ idea: Idea; index: number; onSelect: () => void }> = ({ idea, index, onSelect }) => {
  const [imgIndex, setImgIndex] = useState(0);
  
  // Robust safety check: Ensure generatedImageUrls exists and has items, otherwise fallback
  const images = (idea.generatedImageUrls && idea.generatedImageUrls.length > 0) 
    ? idea.generatedImageUrls 
    : [null, null, null];

  const currentImage = images[imgIndex];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % 3);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <Card className="hover:border-zinc-600 transition-all group cursor-pointer overflow-hidden p-0 flex flex-col md:flex-row" onClick={onSelect}>
      {/* Thumbnail / Carousel Section */}
      <div className="w-full md:w-56 h-56 bg-zinc-900 shrink-0 relative border-r border-zinc-800 group/image">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt={`Preview ${imgIndex + 1}`} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 p-4 text-center bg-zinc-950/50">
            <ImageIcon size={24} className="mb-2 text-indigo-400 opacity-60" />
            <span className="text-xs text-zinc-300 font-medium">Imagem {imgIndex + 1} não gerada</span>
            <span className="text-[10px] text-zinc-500 mt-1.5 leading-snug">Acesse os Detalhes para gerar via IA individualmente</span>
          </div>
        )}
        
        {/* Controls */}
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
            <button onClick={prevImage} className="p-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full backdrop-blur"><ChevronLeft size={16}/></button>
            <button onClick={nextImage} className="p-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full backdrop-blur"><ChevronRight size={16}/></button>
        </div>
        
        {/* Indicators */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
           {[0, 1, 2].map(i => (
             <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/30'}`} />
           ))}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">{idea.title}</h3>
            {idea.visualStrategy?.artStyle && (
              <Badge color="purple">{idea.visualStrategy.artStyle}</Badge>
            )}
          </div>
          <p className="text-zinc-400 mb-4 line-clamp-2">{idea.description}</p>
          <div className="flex gap-2 flex-wrap">
            {idea.copywriting?.hashtags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{tag}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <span className="text-sm text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 font-medium">
            Detalhes & Produção <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Card>
  );
};

export const Dashboard: React.FC<Props> = ({ ideas = [], onSelectIdea }) => {
  if (!ideas || ideas.length === 0) {
    return (
      <div className="text-center py-20 text-zinc-500 animate-pulse">
        <Loader2 className="mx-auto mb-4 animate-spin" size={32} />
        <p>Preparando estratégias...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Conceitos Gerados</h2>
        <p className="text-zinc-400">Selecione um conceito para acessar o estúdio de criação.</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {ideas.map((idea, index) => (
          <IdeaCard key={idea.id || index} idea={idea} index={index} onSelect={() => onSelectIdea(idea)} />
        ))}
      </div>
    </div>
  );
};
