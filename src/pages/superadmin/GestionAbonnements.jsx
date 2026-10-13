import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Trash2, Search } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function GestionAbonnements() {
  const [abonnements, setAbonnements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [validationEnCours, setValidationEnCours] = useState(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState(null);
  const [erreur, setErreur] = useState('');

  const [recherche, setRecherche] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('tous');
  const [formuleFiltre, setFormuleFiltre] = useState('tous');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await axiosClient.get('/abonnements');
      setAbonnements(data);
    } catch (err) {
      setErreur('Impossible de charger les abonnements.');
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const validerManuellement = async (id) => {
    setValidationEnCours(id);
    setErreur('');
    try {
      await axiosClient.post(`/abonnements/${id}/valider-manuellement`);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la validation.');
    } finally {
      setValidationEnCours(null);
    }
  };

  const supprimerAbonnement = async (abonnement) => {
    const confirme = window.confirm(
      `Supprimer cet abonnement (${abonnement.villageAdmin?.village?.nom || 'église inconnue'}) ? Cette action est irréversible.`
    );
    if (!confirme) return;

    setSuppressionEnCours(abonnement._id);
    setErreur('');
    try {
      await axiosClient.delete(`/abonnements/${abonnement._id}`);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de la suppression.");
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const formules = useMemo(
    () => [...new Set(abonnements.map((a) => a.formule))].sort(),
    [abonnements]
  );

  const abonnementsFiltres = useMemo(() => {
    const rechercheNormalisee = recherche.trim().toLowerCase();
    const debut = dateDebut ? new Date(dateDebut) : null;
    const fin = dateFin ? new Date(dateFin) : null;
    if (fin) fin.setHours(23, 59, 59, 999);

    return abonnements.filter((a) => {
      if (rechercheNormalisee) {
        const villageNom = a.villageAdmin?.village?.nom?.toLowerCase() || '';
        const adminNom = a.villageAdmin?.nom?.toLowerCase() || '';
        if (!villageNom.includes(rechercheNormalisee) && !adminNom.includes(rechercheNormalisee)) {
          return false;
        }
      }

      if (statutFiltre !== 'tous' && a.statutPaiement !== statutFiltre) return false;
      if (formuleFiltre !== 'tous' && a.formule !== formuleFiltre) return false;

      const dateCreation = new Date(a.createdAt);
      if (debut && dateCreation < debut) return false;
      if (fin && dateCreation > fin) return false;

      return true;
    });
  }, [abonnements, recherche, statutFiltre, formuleFiltre, dateDebut, dateFin]);

  const reinitialiserFiltres = () => {
    setRecherche('');
    setStatutFiltre('tous');
    setFormuleFiltre('tous');
    setDateDebut('');
    setDateFin('');
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">Abonnements</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tous les paiements des administrateurs d'église. Utilise "Valider" pour les paiements
          reçus hors Wave (test, espèces, Orange Money...).
        </p>

        {erreur && <p className="text-red-600 text-sm mb-4">{erreur}</p>}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Rechercher (église ou admin)
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Ex : Koumassi"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
            <select
              value={statutFiltre}
              onChange={(e) => setStatutFiltre(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="tous">Tous</option>
              <option value="en_attente">En attente</option>
              <option value="valide">Validé</option>
              <option value="echoue">Échoué</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Formule</label>
            <select
              value={formuleFiltre}
              onChange={(e) => setFormuleFiltre(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="tous">Toutes</option>
              {formules.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Du</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Au</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={reinitialiserFiltres}
            className="text-gray-500 text-sm font-medium hover:text-gray-700 px-2 py-2"
          >
            Réinitialiser
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Église</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Formule</th>
                <th className="px-6 py-3 font-medium">Montant</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Date</th>
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

              {!chargement && abonnementsFiltres.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                    {abonnements.length === 0
                      ? 'Aucun abonnement pour le moment.'
                      : 'Aucun abonnement ne correspond à ces critères.'}
                  </td>
                </tr>
              )}

              {abonnementsFiltres.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 font-medium text-gray-800">
                    {a.villageAdmin?.village?.nom || '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{a.villageAdmin?.nom || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{a.formule}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {a.montant.toLocaleString('fr-FR')} F
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        a.statutPaiement === 'valide'
                          ? 'bg-green-100 text-green-700'
                          : a.statutPaiement === 'echoue'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {a.statutPaiement}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {a.statutPaiement !== 'valide' && (
                        <button
                          onClick={() => validerManuellement(a._id)}
                          disabled={validationEnCours === a._id}
                          className="flex items-center gap-1 text-epuici-blue text-sm font-medium hover:underline disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          {validationEnCours === a._id ? 'Validation...' : 'Valider'}
                        </button>
                      )}
                      <button
                        onClick={() => supprimerAbonnement(a)}
                        disabled={suppressionEnCours === a._id}
                        title="Supprimer l'abonnement"
                        className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MiseEnPageSuperAdmin>
  );
}
