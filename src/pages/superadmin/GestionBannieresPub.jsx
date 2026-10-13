import { useEffect, useState } from 'react';
import { Plus, X, Trash2, ImageIcon } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function GestionBannieresPub() {
  const [bannieres, setBannieres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await axiosClient.get('/bannieres-pub');
      setBannieres(data);
    } catch (err) {
      // silencieux
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (banniere) => {
    if (!confirm(`Supprimer la bande pub${banniere.titre ? ` "${banniere.titre}"` : ''} ?`)) return;
    try {
      await axiosClient.delete(`/bannieres-pub/${banniere._id}`);
      setBannieres((liste) => liste.filter((b) => b._id !== banniere._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Bandes pub</h1>
            <p className="text-gray-500 text-sm mt-1">
              Affiches publicitaires (format banderole) affichées en haut du fil d'actualité de
              l'app. S'il y en a plusieurs, elles défilent toutes les 5 secondes.
            </p>
          </div>
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={18} />
            Nouvelle bande pub
          </button>
        </div>

        <div className="space-y-4">
          {chargement && <p className="text-gray-400">Chargement...</p>}

          {!chargement && bannieres.length === 0 && (
            <p className="text-gray-400">Aucune bande pub pour le moment.</p>
          )}

          {bannieres.map((banniere) => (
            <div
              key={banniere._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <img
                src={banniere.imageUrl}
                alt={banniere.titre || 'Bande pub'}
                className="w-full aspect-[4/1] object-cover bg-gray-100"
              />
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 line-clamp-1">
                  {banniere.titre || <span className="text-gray-400 font-normal">Sans titre</span>}
                </h3>
                <button
                  onClick={() => supprimer(banniere)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOuvert && (
        <ModalNouvelleBanniere
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

function ModalNouvelleBanniere({ onFermer, onSucces }) {
  const [titre, setTitre] = useState('');
  const [image, setImage] = useState(null);
  const [apercu, setApercu] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!image) {
      setApercu('');
      return;
    }
    const url = URL.createObjectURL(image);
    setApercu(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const publier = async () => {
    setErreur('');

    if (!image) {
      setErreur('Ajoutez une image (jpg, png ou webp, 5 Mo max).');
      return;
    }

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('image', image);

    setEnvoi(true);
    try {
      await axiosClient.post('/bannieres-pub', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'envoi de l'image.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">Nouvelle bande pub</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Titre / annonceur (optionnel)"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <div>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-500 cursor-pointer hover:border-epuici-blue transition">
              <ImageIcon size={18} />
              {image ? image.name : 'Ajouter une image (jpg, png, webp - 5 Mo max)'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Format banderole conseillé : environ 4 fois plus large que haut (ex. 1200 × 300 px).
            </p>
          </div>

          {apercu && (
            <img
              src={apercu}
              alt="Aperçu"
              className="w-full aspect-[4/1] object-cover rounded-lg bg-gray-100"
            />
          )}

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
