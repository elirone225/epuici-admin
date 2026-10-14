import { useEffect, useState } from 'react';
import { Radio, Plus, Trash2, ExternalLink } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function LiveVod() {
  const [chargement, setChargement] = useState(true);
  const [lienDirect, setLienDirect] = useState('');
  const [directEnCours, setDirectEnCours] = useState(false);
  const [videos, setVideos] = useState([]);
  const [enregistrementDirect, setEnregistrementDirect] = useState(false);
  const [titre, setTitre] = useState('');
  const [lienVideo, setLienVideo] = useState('');
  const [ajoutVideo, setAjoutVideo] = useState(false);

  const appliquer = (data) => {
    setLienDirect(data.direct?.lien || '');
    setDirectEnCours(Boolean(data.direct?.enCours));
    setVideos(data.videos || []);
  };

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await axiosClient.get('/live-vod/mon-village');
        appliquer(data);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const enregistrerDirect = async (enCours) => {
    setEnregistrementDirect(true);
    try {
      const { data } = await axiosClient.put('/live-vod/direct', {
        lien: lienDirect.trim(),
        enCours,
      });
      appliquer(data);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement du direct.");
    } finally {
      setEnregistrementDirect(false);
    }
  };

  const ajouterVideo = async (e) => {
    e.preventDefault();
    setAjoutVideo(true);
    try {
      const { data } = await axiosClient.post('/live-vod/videos', {
        titre: titre.trim(),
        lien: lienVideo.trim(),
      });
      setVideos((precedent) => [data, ...precedent]);
      setTitre('');
      setLienVideo('');
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'ajout de la vidéo.");
    } finally {
      setAjoutVideo(false);
    }
  };

  const supprimerVideo = async (id) => {
    if (!confirm('Supprimer cette vidéo ?')) return;
    try {
      await axiosClient.delete(`/live-vod/videos/${id}`);
      setVideos((precedent) => precedent.filter((v) => v._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-gray-800">Live & VOD</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          Le direct et les vidéos de votre église, affichés dans l'onglet « Live & VOD » de l'application.
          Liens acceptés : YouTube, Facebook ou lien direct vers une vidéo (.mp4).
        </p>

        {chargement ? (
          <p className="text-gray-400">Chargement...</p>
        ) : (
          <>
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Radio size={18} className="text-red-600" /> Direct
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    directEnCours ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {directEnCours ? 'En direct' : 'Direct terminé'}
                </span>
              </div>

              <label className="block text-sm text-gray-600 mb-1">Lien du direct</label>
              <input
                type="url"
                value={lienDirect}
                onChange={(e) => setLienDirect(e.target.value)}
                placeholder="https://www.youtube.com/live/..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
              />

              <div className="flex flex-wrap gap-2">
                {directEnCours ? (
                  <>
                    <button
                      onClick={() => enregistrerDirect(true)}
                      disabled={enregistrementDirect}
                      className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Mettre à jour le lien
                    </button>
                    <button
                      onClick={() => enregistrerDirect(false)}
                      disabled={enregistrementDirect}
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-gray-800 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Terminer le direct
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => enregistrerDirect(true)}
                      disabled={enregistrementDirect || !lienDirect.trim()}
                      className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Lancer le direct
                    </button>
                    <button
                      onClick={() => enregistrerDirect(false)}
                      disabled={enregistrementDirect}
                      className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Enregistrer le lien sans lancer
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Tant que le direct n'est pas lancé, les fidèles voient « Direct terminé » dans le lecteur.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-gray-800 mb-3">Vidéos (VOD)</h2>

              <form
                onSubmit={ajouterVideo}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-4 space-y-3"
              >
                <input
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Titre de la vidéo (ex : Culte du dimanche 12 octobre)"
                  maxLength={200}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="url"
                  value={lienVideo}
                  onChange={(e) => setLienVideo(e.target.value)}
                  placeholder="Lien de la vidéo (YouTube, Facebook, .mp4)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={ajoutVideo || !titre.trim() || !lienVideo.trim()}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-epuici-blue text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Plus size={16} /> Ajouter la vidéo
                </button>
              </form>

              {videos.length === 0 && (
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
                        className="text-xs text-gray-400 hover:text-epuici-blue flex items-center gap-1 truncate"
                      >
                        <ExternalLink size={12} className="shrink-0" />
                        <span className="truncate">{video.lien}</span>
                      </a>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {new Date(video.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    <button
                      onClick={() => supprimerVideo(video._id)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 shrink-0"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </MiseEnPageVillageAdmin>
  );
}
