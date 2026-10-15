import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, Trash2, Globe, Lock, EyeOff, Sparkles } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function DemandesPriere() {
  const [demandes, setDemandes] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await axiosClient.get('/demandes-priere/mon-village');
        setDemandes(data);
      } catch {
        // silencieux
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const changerStatut = async (id) => {
    try {
      const { data } = await axiosClient.put(`/demandes-priere/${id}/statut`);
      setDemandes((precedent) => precedent.map((d) => (d._id === id ? data : d)));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  // Modération : la demande disparaît du mur de prière des fidèles
  const retirerDuMur = async (id) => {
    if (!confirm('Retirer cette demande du mur de prière ? Elle restera visible ici.')) return;
    try {
      const { data } = await axiosClient.put(`/demandes-priere/${id}/retirer-du-mur`);
      setDemandes((precedent) => precedent.map((d) => (d._id === id ? data : d)));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modération.');
    }
  };

  const supprimerDemande = async (id) => {
    if (!confirm('Supprimer cette demande de prière ?')) return;
    try {
      await axiosClient.delete(`/demandes-priere/${id}`);
      setDemandes((precedent) => precedent.filter((d) => d._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const nouvelles = useMemo(
    () => demandes.filter((d) => d.statut === 'nouvelle').length,
    [demandes]
  );

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-800">Demandes de prière</h1>
          <p className="text-gray-500 text-sm mt-1">
            Demandes envoyées par les fidèles de votre église depuis l'application.
            {nouvelles > 0 && (
              <span className="ml-2 text-epuici-accent font-medium">
                {nouvelles} nouvelle{nouvelles > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-4">
          {chargement && <p className="text-gray-400">Chargement...</p>}

          {!chargement && demandes.length === 0 && (
            <p className="text-gray-400">Aucune demande de prière pour le moment.</p>
          )}

          {demandes.map((demande) => (
            <div
              key={demande._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      demande.statut === 'traitee'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-epuici-accent/15 text-epuici-accent'
                    }`}
                  >
                    {demande.statut === 'traitee' ? 'Priée' : 'Nouvelle'}
                  </span>
                  {demande.visibilite === 'publique' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-epuici-blue flex items-center gap-1">
                      <Globe size={12} /> Mur de prière{demande.anonyme ? ' (anonyme)' : ''}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 flex items-center gap-1">
                      <Lock size={12} /> Privée
                    </span>
                  )}
                  {demande.nbPriants > 0 && (
                    <span className="text-xs text-gray-500">🙏 {demande.nbPriants}</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(demande.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{demande.texte}</p>
                {demande.exaucee && (
                  <div className="mt-2 bg-green-50 border border-green-100 rounded-lg p-2">
                    <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
                      <Sparkles size={13} /> Prière exaucée
                    </p>
                    {demande.temoignage && (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-1">{demande.temoignage}</p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Envoyée par {demande.utilisateur?.nom || 'Fidèle'}
                  {demande.utilisateur?.telephone ? ` — ${demande.utilisateur.telephone}` : ''}
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => changerStatut(demande._id)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit ${
                    demande.statut === 'traitee'
                      ? 'text-gray-500 hover:bg-gray-100'
                      : 'text-white bg-epuici-blue hover:opacity-90'
                  }`}
                >
                  {demande.statut === 'traitee' ? (
                    <>
                      <RotateCcw size={14} /> Rouvrir
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Marquer priée
                    </>
                  )}
                </button>

                {demande.visibilite === 'publique' && (
                  <button
                    onClick={() => retirerDuMur(demande._id)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit text-gray-500 hover:bg-gray-100"
                  >
                    <EyeOff size={14} /> Retirer du mur
                  </button>
                )}

                <button
                  onClick={() => supprimerDemande(demande._id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit text-gray-500 hover:bg-gray-100"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
