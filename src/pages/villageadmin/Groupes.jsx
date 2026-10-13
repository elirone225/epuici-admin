import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Pencil, Trash2, Users, UserCheck, Search } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function Groupes() {
  const { user } = useAuth();
  const [groupes, setGroupes] = useState([]);
  const [chargement, setChargement] = useState(true);
  // null = fermé, {} = nouveau groupe, objet groupe = modification
  const [groupeEnEdition, setGroupeEnEdition] = useState(null);

  const abonnementActif =
    user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  const charger = () =>
    axiosClient
      .get('/groupes/mon-eglise')
      .then(({ data }) => setGroupes(data))
      .catch(() => {})
      .finally(() => setChargement(false));

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (groupe) => {
    if (
      !confirm(
        `Supprimer le groupe "${groupe.nom}" ?\n\nTous ses messages seront définitivement effacés.`
      )
    )
      return;
    try {
      await axiosClient.delete(`/groupes/${groupe._id}`);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Groupes</h1>
            <p className="text-gray-500 text-sm mt-1">
              Créez les groupes de votre église et désignez leurs responsables. Les fidèles
              demandent à les rejoindre depuis l'application ; les responsables valident.
            </p>
          </div>
          <button
            onClick={() => setGroupeEnEdition({})}
            disabled={!abonnementActif}
            title={!abonnementActif ? 'Abonnement requis pour créer un groupe' : ''}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={18} />
            Nouveau groupe
          </button>
        </div>

        {!abonnementActif && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
            Votre abonnement n'est pas actif. Rendez-vous sur la page "Abonnement" pour pouvoir
            créer des groupes.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargement && <p className="text-gray-400 col-span-full">Chargement...</p>}

          {!chargement && groupes.length === 0 && (
            <p className="text-gray-400 col-span-full">Aucun groupe pour le moment.</p>
          )}

          {groupes.map((groupe) => (
            <div
              key={groupe._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-800">{groupe.nom}</h3>
                {groupe.nbDemandesEnAttente > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-epuici-accent/10 text-epuici-accent whitespace-nowrap">
                    {groupe.nbDemandesEnAttente} demande{groupe.nbDemandesEnAttente > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {groupe.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{groupe.description}</p>
              )}

              <div className="mt-4 space-y-2 text-sm flex-1">
                <div className="flex items-center gap-2 text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  {groupe.nbMembres} membre{groupe.nbMembres > 1 ? 's' : ''}
                </div>
                <div className="flex items-start gap-2 text-gray-600">
                  <UserCheck size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  {groupe.responsables.length > 0 ? (
                    <span>{groupe.responsables.map((r) => r.nom || r.telephone).join(', ')}</span>
                  ) : (
                    <span className="text-orange-500">Aucun responsable</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setGroupeEnEdition(groupe)}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-epuici-blue border border-epuici-blue/30 rounded-lg py-2 hover:bg-epuici-blue/5 transition"
                >
                  <Pencil size={15} />
                  Modifier
                </button>
                <button
                  onClick={() => supprimer(groupe)}
                  title="Supprimer le groupe"
                  className="flex items-center justify-center text-red-500 border border-red-200 rounded-lg px-3 hover:bg-red-50 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {groupeEnEdition && (
        <ModalGroupe
          groupe={groupeEnEdition}
          onFermer={() => setGroupeEnEdition(null)}
          onSucces={() => {
            setGroupeEnEdition(null);
            charger();
          }}
        />
      )}
    </MiseEnPageVillageAdmin>
  );
}

// Création ou modification d'un groupe, avec choix des responsables
// parmi les fidèles abonnés à l'église
function ModalGroupe({ groupe, onFermer, onSucces }) {
  const modification = Boolean(groupe._id);
  const [nom, setNom] = useState(groupe.nom || '');
  const [description, setDescription] = useState(groupe.description || '');
  const [responsables, setResponsables] = useState(
    new Set((groupe.responsables || []).map((r) => r._id))
  );
  const [abonnes, setAbonnes] = useState([]);
  const [recherche, setRecherche] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    axiosClient
      .get('/utilisateurs/mon-village/abonnes')
      .then(({ data }) => setAbonnes(data.abonnes))
      .catch(() => {});
  }, []);

  const abonnesFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return abonnes;
    return abonnes.filter(
      (a) => (a.nom || '').toLowerCase().includes(terme) || (a.telephone || '').includes(terme)
    );
  }, [abonnes, recherche]);

  const basculerResponsable = (id) => {
    setResponsables((actuels) => {
      const suivants = new Set(actuels);
      if (suivants.has(id)) suivants.delete(id);
      else suivants.add(id);
      return suivants;
    });
  };

  const enregistrer = async () => {
    if (!nom.trim()) {
      setErreur('Le nom du groupe est obligatoire.');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      const donnees = { nom, description, responsables: [...responsables] };
      if (modification) {
        await axiosClient.put(`/groupes/${groupe._id}`, donnees);
      } else {
        await axiosClient.post('/groupes', donnees);
      }
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800 text-lg">
            {modification ? 'Modifier le groupe' : 'Nouveau groupe'}
          </h3>
          <button onClick={onFermer} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Nom du groupe (ex : Chorale, Jeunesse, Femmes...)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-epuici-blue/30"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (facultative)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-epuici-blue/30"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Responsables ({responsables.size})
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Ils valident les demandes d'adhésion. Seuls les fidèles abonnés à votre église
              apparaissent ici.
            </p>
            <div className="relative mb-2">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un fidèle (nom ou téléphone)"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-epuici-blue/30"
              />
            </div>
            <div className="border border-gray-100 rounded-lg max-h-56 overflow-y-auto divide-y divide-gray-50">
              {abonnesFiltres.length === 0 && (
                <p className="text-sm text-gray-400 p-3">Aucun fidèle trouvé.</p>
              )}
              {abonnesFiltres.map((a) => (
                <label
                  key={a._id}
                  className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={responsables.has(a._id)}
                    onChange={() => basculerResponsable(a._id)}
                    className="accent-epuici-blue"
                  />
                  <span className="flex-1 text-gray-800">{a.nom || 'Sans nom'}</span>
                  <span className="text-gray-400 text-xs">{a.telephone}</span>
                </label>
              ))}
            </div>
          </div>

          {erreur && <p className="text-sm text-red-500">{erreur}</p>}

          <button
            onClick={enregistrer}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {envoi ? 'Enregistrement...' : modification ? 'Enregistrer' : 'Créer le groupe'}
          </button>
        </div>
      </div>
    </div>
  );
}
