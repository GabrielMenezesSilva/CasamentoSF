"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Lock,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Photo = {
  id: string;
  url: string;
  uploader_name: string;
  created_at: string;
};

// Download individual photo via fetch → blob → anchor click
async function downloadPhoto(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export default function Galeria() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error("Error fetching photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchPhotos();
  }, [isAuthenticated]);

  // Exit selection mode and clear selection
  const exitSelection = useCallback(() => {
    setIsSelecting(false);
    setSelected(new Set());
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === photos.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  };

  const handleDeleteSingle = async (photoId: string, photoUrl: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta foto?")) return;
    try {
      const urlParts = photoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      await supabase.storage.from("wedding_photos").remove([fileName]);
      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);
      if (error) throw error;
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error("Erro ao deletar foto:", err);
      alert("Ocorreu um erro ao excluir a foto.");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (
      !window.confirm(
        `Tem certeza que deseja excluir ${selected.size} foto(s) selecionada(s)?`
      )
    )
      return;
    setIsBulkLoading(true);
    try {
      const toDelete = photos.filter((p) => selected.has(p.id));
      const fileNames = toDelete.map((p) => {
        const parts = p.url.split("/");
        return parts[parts.length - 1];
      });
      await supabase.storage.from("wedding_photos").remove(fileNames);
      await supabase
        .from("photos")
        .delete()
        .in("id", Array.from(selected));
      setPhotos((prev) => prev.filter((p) => !selected.has(p.id)));
      exitSelection();
    } catch (err) {
      console.error("Erro ao deletar fotos:", err);
      alert("Ocorreu um erro ao excluir as fotos.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDownload = async () => {
    if (selected.size === 0) return;
    setIsBulkLoading(true);
    try {
      const toDownload = photos.filter((p) => selected.has(p.id));

      if (toDownload.length === 1) {
        // Single file — download directly
        const photo = toDownload[0];
        const ext = photo.url.split(".").pop() || "jpg";
        await downloadPhoto(photo.url, `foto_${photo.uploader_name}.${ext}`);
      } else {
        // Multiple files — use JSZip loaded from CDN
        // @ts-ignore
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        const folder = zip.folder("casamento_sf_fotos");

        await Promise.all(
          toDownload.map(async (photo, idx) => {
            const res = await fetch(photo.url);
            const blob = await res.blob();
            const ext = photo.url.split(".").pop() || "jpg";
            const name = `foto_${String(idx + 1).padStart(3, "0")}_${photo.uploader_name}.${ext}`;
            folder?.file(name, blob);
          })
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const blobUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = "casamento_sf_fotos.zip";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }
      exitSelection();
    } catch (err) {
      console.error("Erro ao baixar fotos:", err);
      alert("Ocorreu um erro ao baixar as fotos.");
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0) return;
    setIsLoading(true);
    try {
      // @ts-ignore
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const folder = zip.folder("casamento_sf_todas_fotos");

      await Promise.all(
        photos.map(async (photo, idx) => {
          const res = await fetch(photo.url);
          const blob = await res.blob();
          const ext = photo.url.split(".").pop() || "jpg";
          const name = `foto_${String(idx + 1).padStart(3, "0")}_${photo.uploader_name}.${ext}`;
          folder?.file(name, blob);
        })
      );

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "casamento_sf_todas_fotos.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erro ao baixar todas as fotos:", err);
      alert("Ocorreu um erro ao baixar as fotos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error: fetchError } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "gallery_password")
        .single();
      if (fetchError) {
        console.error("Erro ao verificar senha:", fetchError);
        setError(true);
        return;
      }
      if (data && password === data.value) {
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
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
            <h2 className="font-serif text-3xl text-primary-dark mb-2">
              Acesso dos Noivos
            </h2>
            <p className="text-text-muted text-sm">
              Digite a senha para ver a galeria
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {error && (
              <p className="text-red-500 text-sm">Senha incorreta.</p>
            )}
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

  const allSelected = selected.size === photos.length && photos.length > 0;

  return (
    <main className="flex-1 p-6 sm:p-12 max-w-6xl mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-4xl text-primary-dark font-medium flex items-center gap-3">
            Galeria de Fotos
            <button
              onClick={fetchPhotos}
              disabled={isLoading}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              title="Atualizar galeria"
            >
              <RefreshCw
                size={20}
                className={`text-text-muted ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
          </h1>
          <p className="text-text-muted mt-2">
            {photos.length} foto{photos.length !== 1 ? "s" : ""} recebida
            {photos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isSelecting ? (
            <>
              <button
                onClick={() => setIsSelecting(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-main hover:bg-gray-50 transition-colors shadow-sm"
              >
                <CheckSquare size={18} />
                Selecionar
              </button>
              <button
                onClick={handleDownloadAll}
                disabled={isLoading || photos.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-text-main hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={18} />
                Baixar Todas
              </button>
            </>
          ) : (
            <>
              {/* Select all */}
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-main hover:bg-gray-50 transition-colors shadow-sm text-sm"
              >
                {allSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                {allSelected ? "Desmarcar tudo" : "Selecionar tudo"}
              </button>

              {/* Download selected */}
              <button
                onClick={handleBulkDownload}
                disabled={selected.size === 0 || isBulkLoading}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-50"
              >
                {isBulkLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Baixar ({selected.size})
              </button>

              {/* Delete selected */}
              <button
                onClick={handleBulkDelete}
                disabled={selected.size === 0 || isBulkLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {isBulkLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Apagar ({selected.size})
              </button>

              {/* Cancel */}
              <button
                onClick={exitSelection}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-text-muted hover:bg-gray-50 transition-colors shadow-sm"
              >
                <X size={16} />
                Cancelar
              </button>
            </>
          )}
        </div>
      </header>

      {photos.length === 0 && !isLoading ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-2xl">
          <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-text-muted">Nenhuma foto recebida ainda.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6 space-y-6">
          {photos.map((photo) => {
            const isChecked = selected.has(photo.id);
            return (
              <div
                key={photo.id}
                className={`break-inside-avoid relative group rounded-xl overflow-hidden bg-gray-100 shadow-sm border-2 transition-all duration-200 cursor-pointer ${
                  isSelecting
                    ? isChecked
                      ? "border-primary shadow-md"
                      : "border-transparent hover:border-primary/40"
                    : "border-gray-200"
                }`}
                onClick={() => isSelecting && toggleSelect(photo.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={`Foto de ${photo.uploader_name}`}
                  className={`w-full h-auto object-cover transition-transform duration-500 ${
                    isSelecting ? "" : "group-hover:scale-105"
                  }`}
                />

                {/* Selection checkbox overlay */}
                {isSelecting && (
                  <div className="absolute top-3 left-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow ${
                        isChecked
                          ? "bg-primary text-white"
                          : "bg-white/80 text-gray-400"
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare size={16} />
                      ) : (
                        <Square size={16} />
                      )}
                    </div>
                  </div>
                )}

                {/* Hover overlay (only in normal mode) */}
                {!isSelecting && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSingle(photo.id, photo.url);
                        }}
                        className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                        title="Excluir foto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="text-white">
                      <p className="text-sm font-medium">
                        Enviado por: {photo.uploader_name}
                      </p>
                      <p className="text-xs text-gray-300">
                        {new Date(photo.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
