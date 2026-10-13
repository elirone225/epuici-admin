import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

const FORMULES = [
  { id: '1mois', label: '1 mois', prix: 25000 },
  { id: '3mois', label: '3 mois', prix: 70000 },
  { id: '6mois', label: '6 mois', prix: 130000 },
  { id: '12mois', label: '12 mois', prix: 250000, populaire: true },
];

export default function Abonnement() {
  const { user } = useAuth();
  const [historique, setHistorique] = useState([]);
  const [formuleChoisie, setFormuleChoisie] = useState('1mois');
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState('');

  const abonnementActif =
    user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  const chargerHistorique = async () => {
    try {
      const { data } = await axiosClient.get('/abonnements/mon-historique');
      setHistorique(data);
    } catch (err) {
      // silencieux, pas critique
    }
  };

  useEffect(() => {
    chargerHistorique();
  }, []);

  const souscrire = async () => {
    setErreur('');
    setResultat(null);
    setEnvoi(true);
    try {
      const { data } = await axiosClient.post('/abonnements/souscrire', {
        formule: formuleChoisie,
      });
      setResultat(data);
      chargerHistorique();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la souscription.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8 max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">Mon abonnement</h1>
        <p className="text-gray-500 text-sm mb-6">
          Un abonnement actif est nécessaire pour publier des actualités et des offres.
        </p>

        {/* Statut actuel */}
        <div
          className={`rounded-xl p-5 mb-6 border ${
            abonnementActif
              ? 'bg-green-50 border-green-200'
              : 'bg-orange-50 border-orange-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {abonnementActif ? (
              <CheckCircle2 className="text-green-600" size={22} />
            ) : (
              <Clock className="text-epuici-accent" size={22} />
            )}
            <div>
              <p className="font-medium text-gray-800">
                {abonnementActif ? 'Abonnement actif' : 'Aucun abonnement actif'}
              </p>
              {abonnementActif && user?.abonnementExpireLe && (
                <p className="text-sm text-gray-500">
                  Expire le{' '}
                  {new Date(user.abonnementExpireLe).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Choix de formule */}
        <h2 className="font-display font-semibold text-gray-800 mb-3">
          {abonnementActif ? 'Renouveler / prolonger' : 'Choisir une formule'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {FORMULES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormuleChoisie(f.id)}
              className={`relative border rounded-xl p-4 text-left transition ${
                formuleChoisie === f.id
                  ? 'border-epuici-blue ring-2 ring-epuici-blue bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.populaire && (
                <span className="absolute -top-2 right-2 bg-epuici-secondary text-epuici-blue text-[10px] font-bold px-2 py-0.5 rounded-full">
                  MEILLEUR PRIX
                </span>
              )}
              <p className="font-semibold text-gray-800">{f.label}</p>
              <p className="text-sm text-gray-500 mt-1">{f.prix.toLocaleString('fr-FR')} F</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            onClick={souscrire}
            disabled={envoi}
            className="bg-epuici-accent text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50 shrink-0"
          >
            {envoi ? 'Préparation du paiement...' : 'Payer avec Wave'}
          </button>
          <p className="text-sm text-gray-600">
            Choisissez un abonnement, faites le dépôt Wave au numéro{' '}
            <span className="font-semibold text-gray-800">05 95 20 27 37</span> puis cliquez sur
            le bouton orange <span className="font-semibold text-gray-800">Payer avec Wave</span>.
          </p>
        </div>

        {erreur && <p className="text-red-600 text-sm mt-3">{erreur}</p>}

        {resultat && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">{resultat.message}</p>
            {resultat.lienPaiement && (
              <a
                href={resultat.lienPaiement}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-700 font-medium hover:underline"
              >
                Ouvrir le lien de paiement <ExternalLink size={14} />
              </a>
            )}
            {resultat.simulation && (
              <p className="text-xs text-gray-500 mt-2">
                Mode simulation : Wave n'est pas encore configuré. Le Super Admin peut valider ce
                paiement manuellement depuis son tableau de bord pour les tests.
              </p>
            )}
          </div>
        )}

        {/* Historique */}
        <h2 className="font-display font-semibold text-gray-800 mt-8 mb-3">
          Historique des paiements
        </h2>
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
          {historique.length === 0 && (
            <p className="p-4 text-sm text-gray-400">Aucun paiement pour le moment.</p>
          )}
          {historique.map((h) => (
            <div key={h._id} className="p-4 flex justify-between items-center text-sm">
              <div>
                <p className="font-medium text-gray-800">
                  Formule {h.formule} — {h.montant.toLocaleString('fr-FR')} F
                </p>
                <p className="text-gray-400 text-xs">
                  {new Date(h.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  h.statutPaiement === 'valide'
                    ? 'bg-green-100 text-green-700'
                    : h.statutPaiement === 'echoue'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {h.statutPaiement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
