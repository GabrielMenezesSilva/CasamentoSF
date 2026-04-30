"use client";

import { useState, useEffect } from "react";
import { Lock, Image as ImageIcon, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Photo = {
  id: string;
  url: string;
  uploader_name: string;
  created_at: string;
};

export default function Galeria() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha provisória
    if (password === "casamento123") {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full text-center space-y-6">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-primary">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="font-serif text-3xl text-primary-dark mb-2">Acesso dos Noivos</h2>
            <p className="text-text-muted text-sm">Digite a senha para ver a galeria</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {error && <p className="text-red-500 text-sm">Senha incorreta.</p>}
            <button
              type="submit"
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors active:scale-95"
            >
              Entrar
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 sm:p-12 max-w-6xl mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <h1 className="font-serif text-4xl text-primary-dark font-medium flex items-center gap-3">
            Galeria de Fotos
            <button 
              onClick={fetchPhotos} 
              disabled={isLoading}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              title="Atualizar galeria"
            >
              <RefreshCw size={20} className={`text-text-muted ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </h1>
          <p className="text-text-muted mt-2">
            Todas as fotos compartilhadas pelos seus convidados. ({photos.length} fotos recebidas)
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-main hover:bg-gray-50 transition-colors shadow-sm">
          <Download size={18} />
          Baixar Todas
        </button>
      </header>

      {photos.length === 0 && !isLoading ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-text-muted">Nenhuma foto recebida ainda.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo) => (
            <div key={photo.id} className="break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-100 shadow-sm border border-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photo.url} 
                alt={`Foto de ${photo.uploader_name}`} 
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <div className="text-white">
                  <p className="text-sm font-medium">Enviado por: {photo.uploader_name}</p>
                  <p className="text-xs text-gray-300">
                    {new Date(photo.created_at).toLocaleDateString('pt-BR', { 
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
