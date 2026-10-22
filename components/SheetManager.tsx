import React, { useState } from 'react';
import { SheetRow } from '../types';
import { Button, Label, Modal } from './UIComponents';
import { parseExcel } from '../services/sheetService';
import { FileSpreadsheet, Upload, AlertCircle, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (row: SheetRow) => void;
}

export const SheetManager: React.FC<Props> = ({ isOpen, onClose, onImport }) => {
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      setLoading(true);
      setError(null);
      try {
        const data = await parseExcel(file);
        if (data.length === 0) {
          setError("A planilha parece vazia ou em formato inválido.");
        } else {
          setRows(data);
        }
      } catch (err: any) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal 
      title="Importar do Excel" 
      isOpen={isOpen} 
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl p-8 text-center relative group hover:border-indigo-500 transition-colors">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center gap-3">
             <div className="w-12 h-12 bg-indigo-900/20 text-indigo-400 rounded-full flex items-center justify-center">
               <Upload size={24} />
             </div>
             <div>
                <p className="text-white font-medium">{fileName || "Clique para selecionar o arquivo .xlsx"}</p>
                <p className="text-zinc-500 text-sm">Planilhas geradas anteriormente por este sistema.</p>
             </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/10 p-3 rounded border border-red-900/30 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-4 animate-in slide-in-from-bottom fade-in duration-300">
            <div className="flex justify-between items-center">
              <Label>Selecione um Projeto da Lista</Label>
              <span className="text-xs text-green-400 flex items-center gap-1"><Check size={12}/> {rows.length} registros encontrados</span>
            </div>
            
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
              {rows.map((row, i) => (
                <button 
                  key={i}
                  onClick={() => onImport(row)}
                  className="w-full text-left p-3 bg-zinc-800/50 border border-zinc-700 hover:border-indigo-500 hover:bg-zinc-800 rounded-lg transition-all group"
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-bold text-white group-hover:text-indigo-300">{row.clientName || "Sem Nome"}</span>
                    <span className="text-xs text-zinc-500">{row.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{row.objective || "Sem objetivo definido"}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-zinc-500 text-center mt-4 border-t border-zinc-800 pt-4">
          A importação preencherá automaticamente os campos de input (Cliente, Público, Objetivo) com base na linha selecionada.
        </div>
      </div>
    </Modal>
  );
};