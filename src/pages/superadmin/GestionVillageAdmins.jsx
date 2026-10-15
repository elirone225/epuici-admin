import { useEffect, useState } from 'react';
import { Plus, X, CheckCircle, Trash2, Pencil } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function GestionVillageAdmins() {
  const [villages, setVillages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  // { village, compte, role } du compte d'église en cours de modification
  const [compteAModifier, setCompteAModifier] = useState(null);
  const [erreur, setErreur] = useState('');

  const chargerVillages = async () => {
    setChargement(true);
    try {
      const { data } = await axiosClient.get('/villages/tous');
      setVillages(data);
    } catch (err) {
      setErreur("Impossible de charger les églises.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerVillages();
  }, []);

  const supprimerVillage = async (village) => {
    const confirme = window.confirm(
      `Supprimer l'église "${village.nom}" ?\n\nCela supprimera aussi ses comptes admin et trésorier. Cette action est irréversible.`
    );
    if (!confirme) return;

    try {
      await axiosClient.delete(`/villages/${village._id}`);
      chargerVillages();
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de la suppression de l'église.");
    }
  };

  const statutAbonnement = (admin) => {
    if (!admin) return null;
    if (!admin.abonnementExpireLe) return { texte: 'Jamais payé', couleur: 'bg-gray-100 text-gray-600' };
    const expire = new Date(admin.abonnementExpireLe) > new Date();
    return expire
      ? { texte: 'Actif', couleur: 'bg-green-100 text-green-700' }
      : { texte: 'Expiré', couleur: 'bg-red-100 text-red-700' };
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Églises & Admins</h1>
            <p className="text-gray-500 text-sm mt-1">
              Gère les églises adhérentes et leurs deux comptes : l'admin et le trésorier.
            </p>
          </div>
          <button
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={18} />
            Ajouter une église
          </button>
        </div>

        {erreur && <p className="text-red-600 mb-4">{erreur}</p>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Église</th>
                <th className="px-6 py-3 font-medium">Région</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Trésorier</th>
                <th className="px-6 py-3 font-medium">Numéro Wave</th>
                <th className="px-6 py-3 font-medium">Abonnement</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chargement && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              )}

              {!chargement && villages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    Aucune église pour le moment.
                  </td>
                </tr>
              )}

              {villages.map((village) => {
                const statut = statutAbonnement(village.admin);
                return (
                  <tr key={village._id}>
                    <td className="px-6 py-4 font-medium text-gray-800">{village.nom}</td>
                    <td className="px-6 py-4 text-gray-600">{village.region}</td>
                    <td className="px-6 py-4">
                      <CelluleCompte
                        village={village}
                        role="admin"
                        onModifier={setCompteAModifier}
                        onSucces={chargerVillages}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <CelluleCompte
                        village={village}
                        role="tresorier"
                        onModifier={setCompteAModifier}
                        onSucces={chargerVillages}
                      />
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {village.numeroWave ? (
                        village.numeroWave
                      ) : (
                        <span className="text-gray-400 italic">Non renseigné</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {statut ? (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statut.couleur}`}>
                          {statut.texte}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => supprimerVillage(village)}
                          title="Supprimer l'église"
                          className="text-red-500 hover:text-red-700 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOuvert && (
        <ModalNouveauVillage
          onFermer={() => setModalOuvert(false)}
          onSucces={() => {
            setModalOuvert(false);
            chargerVillages();
          }}
        />
      )}

      {compteAModifier && (
        <ModalModifierAdmin
          {...compteAModifier}
          onFermer={() => setCompteAModifier(null)}
          onSucces={() => {
            setCompteAModifier(null);
            chargerVillages();
          }}
        />
      )}
    </MiseEnPageSuperAdmin>
  );
}

// Compte admin ou trésorier d'une église : nom + téléphone et bouton de
// modification, ou bouton de création s'il n'existe pas encore
function CelluleCompte({ village, role, onModifier, onSucces }) {
  const compte = role === 'tresorier' ? village.tresorier : village.admin;
  if (!compte) return <BoutonCreerAdmin village={village} role={role} onSucces={onSucces} />;
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <p className="text-gray-800 truncate">{compte.nom}</p>
        <p className="text-xs text-gray-400">{compte.telephone}</p>
      </div>
      <button
        onClick={() => onModifier({ village, compte, role })}
        title={role === 'tresorier' ? 'Modifier le trésorier' : "Modifier l'admin"}
        className="text-gray-400 hover:text-epuici-blue transition"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}

// Bouton + petit formulaire pour créer le compte admin ou trésorier d'une église
function BoutonCreerAdmin({ village, role = 'admin', onSucces }) {
  const libelle = role === 'tresorier' ? 'trésorier' : 'admin';
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const creerAdmin = async () => {
    setErreur('');
    setEnvoi(true);
    try {
      await axiosClient.post('/auth/villageadmin/creer', {
        nom,
        telephone,
        email,
        motDePasse,
        villageId: village._id,
        role,
      });
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setEnvoi(false);
    }
  };

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="text-epuici-blue text-sm font-medium hover:underline"
      >
        + Ajouter {libelle}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">
            {role === 'tresorier' ? 'Trésorier' : 'Admin'} pour {village.nom}
          </h3>
          <button onClick={() => setOuvert(false)}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Email (optionnel)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Mot de passe"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          <button
            onClick={creerAdmin}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Création...' : 'Créer le compte'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de modification d'un compte d'église (admin ou trésorier) :
// identifiant, mot de passe, statut
function ModalModifierAdmin({ village, compte: admin, role, onFermer, onSucces }) {
  const [nom, setNom] = useState(admin.nom || '');
  const [telephone, setTelephone] = useState(admin.telephone || '');
  const [email, setEmail] = useState(admin.email || '');
  const [motDePasse, setMotDePasse] = useState('');
  const [statut, setStatut] = useState(admin.statut || 'actif');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const enregistrer = async () => {
    setErreur('');
    setEnvoi(true);
    try {
      const donnees = { nom, telephone, email, statut };
      if (motDePasse) donnees.motDePasse = motDePasse;

      await axiosClient.put(`/auth/villageadmin/${admin._id}`, donnees);
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la modification.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">
            {role === 'tresorier' ? 'Trésorier' : 'Admin'} de {village.nom}
          </h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Nom complet"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Téléphone"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Email (optionnel)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Nouveau mot de passe (laisser vide pour ne pas changer)"
            type="password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="actif">Actif</option>
            <option value="suspendu">Suspendu</option>
          </select>
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          <button
            onClick={enregistrer}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de création d'un nouveau village
function ModalNouveauVillage({ onFermer, onSucces }) {
  const [nom, setNom] = useState('');
  const [region, setRegion] = useState('');
  const [description, setDescription] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const creerVillage = async () => {
    setErreur('');
    setEnvoi(true);
    try {
      await axiosClient.post('/villages', { nom, region, description });
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">Nouvelle église</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Nom de l'église"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Région"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={3}
          />
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          <button
            onClick={creerVillage}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {envoi ? 'Création...' : (
              <>
                <CheckCircle size={16} />
                Créer l'église
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
