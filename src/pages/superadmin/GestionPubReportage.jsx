import { useEffect, useState } from 'react';
import { Plus, X, Trash2, Video } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

const TYPES = [
  { valeur: 'reportage', label: 'Reportage' },
  { valeur: 'publicite', label: 'Publicité' },
];

export default function GestionPubReportage() {
  const [videos, setVideos] = useState([]);
  const [villages, setVillages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);

  const charger = async () => {
    setChargement(true);
    try {
      const [{ data: donneesVideos }, { data: donneesVillages }] = await Promise.all([
        axiosClient.get('/pub-reportages'),
        axiosClient.get('/villages/tous'),
      ]);
      setVideos(donneesVideos.pubReportages);
      setVillages(donneesVillages);
    } catch (err) {
      // silencieux
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (video) => {
    if (!confirm(`Supprimer la vidéo "${video.titre}" ?`)) return;
    try {
      await axiosClient.delete(`/pub-reportages/${video._id}`);
      setVideos((liste) => liste.filter((v) => v._id !== video._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Pub & Reportage</h1>
            <p className="text-gray-500 text-sm mt-1">
              Vidéos publicitaires et reportages visibles par tous les utilisateurs de l'app.
            </p>
          </div>
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={18} />
            Nouvelle vidéo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargement && <p className="text-gray-400 col-span-full">Chargement...</p>}

          {!chargement && videos.length === 0 && (
            <p className="text-gray-400 col-span-full">Aucune vidéo pour le moment.</p>
          )}

          {videos.map((video) => (
            <div
              key={video._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <video src={video.videoUrl} className="w-full h-40 object-cover bg-black" controls />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      video.type === 'publicite'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {video.type === 'publicite' ? 'Publicité' : 'Reportage'}
                  </span>
                  {video.village && (
                    <span className="text-xs text-gray-500">{video.village.nom}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{video.titre}</h3>
                {video.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{video.description}</p>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => supprimer(video)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOuvert && (
        <ModalNouvelleVideo
          villages={villages}
          onFermer={() => setModalOuvert(false)}
          onSucces={() => {
            setModalOuvert(false);
            charger();
          }}
        />
      )}
    </MiseEnPageSuperAdmin>
  );
}

function ModalNouvelleVideo({ villages, onFermer, onSucces }) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('reportage');
  const [villageId, setVillageId] = useState('');
  const [video, setVideo] = useState(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const publier = async () => {
    setErreur('');

    if (!video) {
      setErreur('Ajoutez un fichier vidéo (mp4, mov ou webm, 80 Mo max).');
      return;
    }

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('description', description);
    formData.append('type', type);
    if (villageId) formData.append('villageId', villageId);
    formData.append('video', video);

    setEnvoi(true);
    try {
      await axiosClient.post('/pub-reportages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'envoi de la vidéo.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">Nouvelle vidéo</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {TYPES.map((t) => (
              <option key={t.valeur} value={t.valeur}>
                {t.label}
              </option>
            ))}
          </select>

          <select
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Église concernée (optionnel)</option>
            {villages.map((v) => (
              <option key={v._id} value={v._id}>
                {v.nom}
              </option>
            ))}
          </select>

          <div>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-500 cursor-pointer hover:border-epuici-blue transition">
              <Video size={18} />
              {video ? video.name : 'Ajouter une vidéo (mp4, mov, webm - 80 Mo max)'}
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}

          <button
            onClick={publier}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Envoi en cours...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}
