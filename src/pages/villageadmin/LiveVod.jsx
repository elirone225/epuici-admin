import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function LiveVod() {
  const [chargement, setChargement] = useState(true);
  const [lien, setLien] = useState('');
  const [lienEnregistre, setLienEnregistre] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await axiosClient.get('/live-vod/mon-direct');
        setLien(data.lien || '');
        setLienEnregistre(data.lien || '');
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const enregistrer = async (nouveauLien) => {
    setEnregistrement(true);
    try {
      const { data } = await axiosClient.put('/live-vod/direct', { lien: nouveauLien.trim() });
      setLien(data.lien || '');
      setLienEnregistre(data.lien || '');
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'enregistrement du direct.");
    } finally {
      setEnregistrement(false);
    }
  };

  const terminer = () => {
    if (!confirm('Terminer le direct ? Les fidèles verront « Direct terminé ».')) return;
    enregistrer('');
  };

  const enDirect = Boolean(lienEnregistre);

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-gray-800">Lien du direct</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">
          Donnez le lien de votre direct (culte, évènement...) pour que les fidèles absents de votre
          église puissent le suivre dans l'onglet « Live & VOD » de l'application.
        </p>

        {chargement ? (
          <p className="text-gray-400">Chargement...</p>
        ) : (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Radio size={18} className="text-red-600" /> Lien du direct
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  enDirect ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {enDirect ? 'En direct' : 'Direct terminé'}
              </span>
            </div>

            <input
              type="url"
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="https://www.youtube.com/live/...  ou  https://www.facebook.com/..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => enregistrer(lien)}
                disabled={enregistrement || !lien.trim() || lien.trim() === lienEnregistre}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {enDirect ? 'Mettre à jour le lien' : 'Diffuser le direct'}
              </button>
              {enDirect && (
                <button
                  onClick={terminer}
                  disabled={enregistrement}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Terminer le direct
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Liens acceptés : YouTube, Facebook ou lien direct vers une vidéo. Le direct est visible
              uniquement par les fidèles de votre église. Sans lien, ils voient « Direct terminé ».
            </p>
          </section>
        )}
      </div>
    </MiseEnPageVillageAdmin>
  );
}
