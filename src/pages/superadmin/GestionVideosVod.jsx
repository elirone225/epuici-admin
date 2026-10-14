import { useEffect, useState } from 'react';
import { Plus, Trash2, ExternalLink } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function GestionVideosVod() {
  const [videos, setVideos] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [titre, setTitre] = useState('');
  const [lien, setLien] = useState('');
  const [ajout, setAjout] = useState(false);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await axiosClient.get('/live-vod/videos');
        setVideos(data);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const ajouter = async (e) => {
    e.preventDefault();
    setAjout(true);
    try {
      const { data } = await axiosClient.post('/live-vod/videos', {
        titre: titre.trim(),
        lien: lien.trim(),
      });
      setVideos((precedent) => [data, ...precedent]);
      setTitre('');
      setLien('');
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'ajout de la vidéo.");
    } finally {
      setAjout(false);
    }
  };

  const supprimer = async (video) => {
    if (!confirm(`Supprimer la vidéo "${video.titre}" ?`)) return;
    try {
      await axiosClient.delete(`/live-vod/videos/${video._id}`);
      setVideos((precedent) => precedent.filter((v) => v._id !== video._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-gray-800">Vidéos (VOD)</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          Vidéos affichées sous le direct dans l'onglet « Live & VOD » de l'application, visibles par
          tous les fidèles quelle que soit leur église. Liens acceptés : YouTube, Facebook ou lien
          direct vers une vidéo (.mp4).
        </p>

        <form
          onSubmit={ajouter}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6 space-y-3"
        >
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Titre de la vidéo"
            maxLength={200}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            placeholder="Lien de la vidéo (YouTube, Facebook, .mp4)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={ajout || !titre.trim() || !lien.trim()}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-epuici-blue text-white hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} /> Ajouter la vidéo
          </button>
        </form>

        {chargement && <p className="text-gray-400">Chargement...</p>}
        {!chargement && videos.length === 0 && (
          <p className="text-gray-400 text-sm">Aucune vidéo pour le moment.</p>
        )}

        <div className="space-y-2">
          {videos.map((video) => (
            <div
              key={video._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{video.titre}</p>
                <a
                  href={video.lien}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-400 hover:text-epuici-blue flex items-center gap-1"
                >
                  <ExternalLink size={12} className="shrink-0" />
                  <span className="truncate">{video.lien}</span>
                </a>
              </div>
              <span className="text-xs text-gray-400 shrink-0">
                {new Date(video.createdAt).toLocaleDateString('fr-FR')}
              </span>
              <button
                onClick={() => supprimer(video)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>
    </MiseEnPageSuperAdmin>
  );
}
