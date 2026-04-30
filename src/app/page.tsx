"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Heart, Loader2, Lock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaderName, setUploaderName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!uploaderName.trim()) {
      alert("Por favor, nos diga seu nome antes de enviar as fotos!");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wedding_photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('wedding_photos')
          .getPublicUrl(filePath);

        await supabase.from('photos').insert([
          {
            url: publicUrl,
            uploader_name: uploaderName,
          }
        ]);
      }

      setUploadSuccess(true);
      setFiles([]);
      setUploaderName("");
    } catch (error) {
      console.error("Error saving photos:", error);
      alert("Houve um erro ao enviar as fotos. Tente novamente.");
    } finally {
      setIsUploading(false);
      // Ocultar mensagem de sucesso após alguns segundos
      setTimeout(() => setUploadSuccess(false), 5000);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center p-6 sm:p-12 max-w-3xl mx-auto w-full">
      <div className="w-full flex justify-end mb-4">
        <Link 
          href="/galeria" 
          className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-primary/5"
        >
          <Lock size={14} />
          <span>Acesso dos Noivos</span>
        </Link>
      </div>

      <header className="text-center space-y-4 mb-12 mt-4">
        <h1 className="font-serif text-5xl sm:text-6xl text-primary-dark font-medium tracking-tight">
          Sandrinha <span className="text-primary">&</span> Fred
        </h1>
        <p className="text-text-muted text-lg font-sans">
          Compartilhe os momentos do nosso grande dia!
        </p>
      </header>

      {uploadSuccess ? (
        <div className="w-full bg-green-50 text-green-800 p-6 rounded-2xl text-center animate-in fade-in zoom-in duration-500 border border-green-200">
          <Heart size={48} className="mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-serif mb-2">Muito Obrigado!</h2>
          <p>Suas fotos foram enviadas para os noivos com sucesso.</p>
          <button 
            onClick={() => setUploadSuccess(false)}
            className="mt-6 px-6 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors"
          >
            Enviar mais fotos
          </button>
        </div>
      ) : (
        <div className="w-full space-y-8">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-primary/30 hover:border-primary/60 bg-white"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              if (e.dataTransfer.files) {
                setFiles((prev) => [
                  ...prev,
                  ...Array.from(e.dataTransfer.files),
                ]);
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,video/*"
            />
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-background p-4 rounded-full text-primary">
                <Camera size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-text-main">
                  Toque para escolher fotos
                </p>
                <p className="text-sm text-text-muted">ou arraste as fotos aqui</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-dark transition-colors shadow-sm active:scale-95"
              >
                Selecionar Arquivos
              </button>
            </div>
          </div>

          {/* Selected Files Preview */}
          {files.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <label className="block">
                  <span className="text-text-main font-medium block mb-2">Seu Nome</span>
                  <input 
                    type="text" 
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                    placeholder="Como os noivos devem te chamar?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-gray-50 focus:bg-white"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-medium text-text-main">
                  {files.length} arquivo{files.length !== 1 ? "s" : ""} selecionado{files.length !== 1 ? "s" : ""}
                </h3>
                <button
                  onClick={() => setFiles([])}
                  className="text-sm text-text-muted hover:text-red-500 transition-colors"
                >
                  Limpar tudo
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    <div className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-text-muted break-all">
                      {file.name}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className="w-full py-4 bg-primary-dark text-white rounded-xl font-medium text-lg hover:bg-primary transition-colors shadow-md flex items-center justify-center gap-2 active:scale-95 mt-8 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Enviar para os Noivos
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="mt-auto pt-16 pb-8 text-center text-text-muted flex items-center gap-2 text-sm">
        Feito com <Heart size={14} className="text-primary" /> para Sandrinha e Fred
      </footer>
    </main>
  );
}
