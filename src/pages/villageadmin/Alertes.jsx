import { useEffect, useMemo, useState } from 'react';
import { Trash2, ShieldOff, ShieldCheck, MessageSquareReply } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

// Type d'alerte choisi par le fidèle
const TYPES = {
  deces: { libelle: 'Décès', classe: 'bg-gray-800 text-white' },
  maladie: { libelle: 'Maladie', classe: 'bg-orange-100 text-orange-700' },
  urgence: { libelle: 'Urgence', classe: 'bg-red-600 text-white' },
  autre: { libelle: 'Autre', classe: 'bg-gray-100 text-gray-600' },
};

// Suivi visible par le fidèle dans l'application
const STATUTS = {
  nouvelle: { libelle: 'Reçue', classe: 'bg-epuici-accent/15 text-epuici-accent' },
  en_cours: { libelle: 'Prise en charge', classe: 'bg-blue-100 text-epuici-blue' },
  traitee: { libelle: 'Traitée', classe: 'bg-green-100 text-green-700' },
};

export default function Alertes() {
  const [alertes, setAlertes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [selectionnes, setSelectionnes] = useState(new Set());

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await axiosClient.get('/alertes/mon-village');
      setAlertes(data);
      setSelectionnes(new Set());
    } catch (err) {
      // silencieux
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  // Change le statut suivi par le fidèle (et, si fourni, son message)
  const changerStatut = async (id, statut, reponse) => {
    try {
      const { data } = await axiosClient.put(`/alertes/${id}/statut`, {
        statut,
        ...(reponse !== undefined ? { reponse } : {}),
      });
      setAlertes((precedent) => precedent.map((a) => (a._id === id ? data : a)));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  const repondre = (alerte) => {
    const message = prompt(
      'Message au fidèle (visible dans son suivi d\'alerte) :',
      alerte.reponse || ''
    );
    if (message === null) return;
    changerStatut(alerte._id, alerte.statut, message);
  };

  const basculerSelection = (id) => {
    setSelectionnes((precedent) => {
      const suivant = new Set(precedent);
      if (suivant.has(id)) {
        suivant.delete(id);
      } else {
        suivant.add(id);
      }
      return suivant;
    });
  };

  const toutSelectionner = () => {
    if (selectionnes.size === alertes.length) {
      setSelectionnes(new Set());
    } else {
      setSelectionnes(new Set(alertes.map((a) => a._id)));
    }
  };

  const supprimerAlerte = async (id) => {
    if (!confirm('Supprimer cette alerte ?')) return;
    try {
      await axiosClient.delete(`/alertes/${id}`);
      setAlertes((precedent) => precedent.filter((a) => a._id !== id));
      setSelectionnes((precedent) => {
        const suivant = new Set(precedent);
        suivant.delete(id);
        return suivant;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const supprimerSelection = async () => {
    if (selectionnes.size === 0) return;
    if (!confirm(`Supprimer les ${selectionnes.size} alerte(s) sélectionnée(s) ?`)) return;
    try {
      await axiosClient.delete('/alertes', { data: { ids: Array.from(selectionnes) } });
      await charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const supprimerTout = async () => {
    if (alertes.length === 0) return;
    if (!confirm('Supprimer TOUTES les alertes de votre église ? Cette action est irréversible.')) return;
    try {
      await axiosClient.delete('/alertes', { data: { tout: true } });
      await charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const basculerBlocageUtilisateur = async (alerte) => {
    const utilisateurId = alerte.utilisateur?._id;
    if (!utilisateurId) return;

    const bloqueActuellement = alerte.utilisateur?.alertesBloquees;
    const question = bloqueActuellement
      ? `Autoriser ${alerte.utilisateur?.nom || 'ce fidèle'} à envoyer de nouveau des alertes ?`
      : `Empêcher ${alerte.utilisateur?.nom || 'ce fidèle'} d'envoyer de nouvelles alertes ?`;
    if (!confirm(question)) return;

    try {
      const { data } = await axiosClient.put(`/alertes/utilisateur/${utilisateurId}/bloquer`);
      setAlertes((precedent) =>
        precedent.map((a) =>
          a.utilisateur?._id === utilisateurId
            ? { ...a, utilisateur: { ...a.utilisateur, alertesBloquees: data.alertesBloquees } }
            : a
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  const nouvelles = useMemo(() => alertes.filter((a) => a.statut === 'nouvelle').length, [alertes]);

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Alertes</h1>
            <p className="text-gray-500 text-sm mt-1">
              Évènements signalés par les fidèles de votre église.
              {nouvelles > 0 && (
                <span className="ml-2 text-epuici-accent font-medium">
                  {nouvelles} nouvelle{nouvelles > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {alertes.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={supprimerSelection}
                disabled={selectionnes.size === 0}
                className="text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Supprimer la sélection ({selectionnes.size})
              </button>
              <button
                onClick={supprimerTout}
                className="text-xs font-medium px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              >
                Tout supprimer
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {chargement && <p className="text-gray-400">Chargement...</p>}

          {!chargement && alertes.length === 0 && (
            <p className="text-gray-400">Aucune alerte pour le moment.</p>
          )}

          {!chargement && alertes.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={selectionnes.size === alertes.length}
                onChange={toutSelectionner}
                className="rounded border-gray-300"
              />
              Tout sélectionner
            </label>
          )}

          {alertes.map((alerte) => {
            const utilisateurBloque = alerte.utilisateur?.alertesBloquees;
            return (
              <div
                key={alerte._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4"
              >
                <input
                  type="checkbox"
                  checked={selectionnes.has(alerte._id)}
                  onChange={() => basculerSelection(alerte._id)}
                  className="mt-1 shrink-0 rounded border-gray-300"
                />

                {alerte.photos?.length > 0 && (
                  <div className="flex gap-2 shrink-0">
                    {alerte.photos.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Photo de l'alerte"
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${(TYPES[alerte.type] || TYPES.autre).classe}`}>
                      {(TYPES[alerte.type] || TYPES.autre).libelle}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(STATUTS[alerte.statut] || STATUTS.nouvelle).classe}`}>
                      {(STATUTS[alerte.statut] || STATUTS.nouvelle).libelle}
                    </span>
                    {utilisateurBloque && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">
                        Alertes bloquées
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(alerte.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{alerte.description}</p>
                  {alerte.reponse && (
                    <p className="text-xs text-epuici-blue bg-blue-50 rounded-lg px-2 py-1 mt-2 whitespace-pre-wrap">
                      Votre réponse : {alerte.reponse}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Signalé par {alerte.utilisateur?.nom || 'Fidèle'}
                    {alerte.utilisateur?.telephone ? ` — ${alerte.utilisateur.telephone}` : ''}
                  </p>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <select
                    value={alerte.statut}
                    onChange={(e) => changerStatut(alerte._id, e.target.value)}
                    className="text-xs font-medium px-2 py-2 rounded-lg border border-gray-200 bg-white"
                    title="Statut visible par le fidèle"
                  >
                    {Object.entries(STATUTS).map(([code, st]) => (
                      <option key={code} value={code}>
                        {st.libelle}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => repondre(alerte)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit text-epuici-blue hover:bg-blue-50"
                  >
                    <MessageSquareReply size={14} /> Répondre
                  </button>

                  <button
                    onClick={() => basculerBlocageUtilisateur(alerte)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit ${
                      utilisateurBloque
                        ? 'text-gray-500 hover:bg-gray-100'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {utilisateurBloque ? (
                      <>
                        <ShieldCheck size={14} /> Débloquer
                      </>
                    ) : (
                      <>
                        <ShieldOff size={14} /> Bloquer l'expéditeur
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => supprimerAlerte(alerte._id)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg h-fit text-gray-500 hover:bg-gray-100"
                  >
                    <Trash2 size={14} /> Supprimer
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
