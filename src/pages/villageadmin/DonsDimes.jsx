import { useEffect, useMemo, useState } from 'react';
import {
  Wallet,
  HandCoins,
  Landmark,
  Search,
  FileSpreadsheet,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Lock,
  Download,
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

// Menu "Dons & Dîmes" : réservé au trésorier de l'église. Seuls les
// paiements réussis comptent dans les totaux.

const PERIODES = [
  { code: 'jour', libelle: "Aujourd'hui" },
  { code: '7jours', libelle: '7 jours' },
  { code: 'mois', libelle: 'Ce mois' },
  { code: 'annee', libelle: 'Cette année' },
  { code: 'perso', libelle: 'Plage personnalisée' },
];

const STATUTS = {
  reussi: { libelle: 'Réussi', classe: 'bg-green-100 text-green-700' },
  en_attente: { libelle: 'En attente', classe: 'bg-amber-100 text-amber-700' },
  echoue: { libelle: 'Échoué', classe: 'bg-red-100 text-red-700' },
  annule: { libelle: 'Annulé', classe: 'bg-gray-100 text-gray-600' },
};

const fcfa = (montant) => `${Number(montant || 0).toLocaleString('fr-FR')} FCFA`;
const dateHeure = (date) =>
  new Date(date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

// Date locale au format AAAA-MM-JJ
const isoJour = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const bornesPeriode = (periode, plage) => {
  const aujourdhui = new Date();
  switch (periode) {
    case 'jour':
      return { debut: isoJour(aujourdhui), fin: isoJour(aujourdhui) };
    case '7jours': {
      const debut = new Date(aujourdhui);
      debut.setDate(debut.getDate() - 6);
      return { debut: isoJour(debut), fin: isoJour(aujourdhui) };
    }
    case 'mois':
      return { debut: isoJour(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1)), fin: isoJour(aujourdhui) };
    case 'annee':
      return { debut: isoJour(new Date(aujourdhui.getFullYear(), 0, 1)), fin: isoJour(aujourdhui) };
    default:
      return { debut: plage.debut || undefined, fin: plage.fin || undefined };
  }
};

// Télécharge une réponse binaire (export, reçu) sous le nom donné par le serveur
const telecharger = (reponse, nomParDefaut) => {
  const disposition = reponse.headers['content-disposition'] || '';
  const nom = disposition.match(/filename="([^"]+)"/)?.[1] || nomParDefaut;
  const url = URL.createObjectURL(reponse.data);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

// Le message d'erreur d'une requête "blob" est lui-même dans un blob
const messageErreur = async (err, parDefaut) => {
  const donnees = err.response?.data;
  if (donnees instanceof Blob) {
    try {
      return JSON.parse(await donnees.text()).message || parDefaut;
    } catch {
      return parDefaut;
    }
  }
  return donnees?.message || parDefaut;
};

export default function DonsDimes() {
  const { user } = useAuth();
  const estTresorier = user?.fonction === 'tresorier';

  const [periode, setPeriode] = useState('mois');
  const [plage, setPlage] = useState({ debut: '', fin: '' });
  const [type, setType] = useState('');
  const [statut, setStatut] = useState('');
  const [categorie, setCategorie] = useState('');
  const [saisieRecherche, setSaisieRecherche] = useState('');
  const [recherche, setRecherche] = useState('');
  const [page, setPage] = useState(1);

  const [resume, setResume] = useState(null);
  const [liste, setListe] = useState({ transactions: [], page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState({ don: [], dime: [] });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [export_, setExport] = useState('');
  const [detailId, setDetailId] = useState(null);

  const { debut, fin } = useMemo(() => bornesPeriode(periode, plage), [periode, plage]);
  const plageIncomplete = periode === 'perso' && (!plage.debut || !plage.fin);

  // Recherche lancée 400 ms après la dernière frappe
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRecherche(saisieRecherche.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(minuteur);
  }, [saisieRecherche]);

  // Tout changement de filtre ramène à la première page
  const filtrer = (modifier) => (valeur) => {
    modifier(valeur);
    setPage(1);
  };

  useEffect(() => {
    if (!estTresorier) return;
    axiosClient
      .get('/dons/config')
      .then(({ data }) => setCategories(data.categories || { don: [], dime: [] }))
      .catch(() => {});
  }, [estTresorier]);

  const parametres = useMemo(() => {
    const p = { debut, fin, type, statut, categorie, recherche };
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v));
  }, [debut, fin, type, statut, categorie, recherche]);

  useEffect(() => {
    if (!estTresorier || plageIncomplete) return;
    let annule = false;
    const charger = async () => {
      setChargement(true);
      setErreur('');
      try {
        const [r, l] = await Promise.all([
          axiosClient.get('/dons/eglise/resume', { params: { debut, fin } }),
          axiosClient.get('/dons/eglise/transactions', { params: { ...parametres, page } }),
        ]);
        if (annule) return;
        setResume(r.data);
        setListe(l.data);
      } catch (err) {
        if (!annule) setErreur(err.response?.data?.message || 'Impossible de charger les transactions.');
      } finally {
        if (!annule) setChargement(false);
      }
    };
    charger();
    return () => {
      annule = true;
    };
  }, [estTresorier, plageIncomplete, debut, fin, parametres, page]);

  const exporter = async (format) => {
    setExport(format);
    try {
      const reponse = await axiosClient.get('/dons/eglise/export', {
        params: { ...parametres, format },
        responseType: 'blob',
      });
      telecharger(reponse, `dons-dimes.${format}`);
    } catch (err) {
      alert(await messageErreur(err, "Impossible d'exporter les transactions."));
    } finally {
      setExport('');
    }
  };

  if (!estTresorier) {
    return (
      <MiseEnPageVillageAdmin>
        <div className="p-8">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 max-w-lg text-center mx-auto mt-10">
            <Lock className="mx-auto text-gray-400 mb-3" size={36} />
            <h1 className="font-display text-xl font-bold text-gray-800 mb-1">Accès réservé au trésorier</h1>
            <p className="text-sm text-gray-500">
              Les dons et dîmes de l'église sont consultés par le trésorier. Connectez-vous avec son
              compte pour y accéder.
            </p>
          </div>
        </div>
      </MiseEnPageVillageAdmin>
    );
  }

  const listeCategories = type ? categories[type] || [] : [...categories.don, ...categories.dime];

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Dons & Dîmes</h1>
            <p className="text-gray-500 text-sm mt-1">
              Paiements Wave des fidèles de votre église. Seuls les paiements réussis sont comptés.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exporter('csv')}
              disabled={!!export_ || plageIncomplete}
              className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <FileSpreadsheet size={16} />
              {export_ === 'csv' ? 'Export...' : 'Export CSV'}
            </button>
            <button
              onClick={() => exporter('pdf')}
              disabled={!!export_ || plageIncomplete}
              className="flex items-center gap-2 bg-epuici-blue text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <FileText size={16} />
              {export_ === 'pdf' ? 'Export...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Période */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {PERIODES.map((p) => (
            <button
              key={p.code}
              onClick={() => filtrer(setPeriode)(p.code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                periode === p.code
                  ? 'bg-epuici-blue text-white border-epuici-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-epuici-blue'
              }`}
            >
              {p.libelle}
            </button>
          ))}
          {periode === 'perso' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="date"
                value={plage.debut}
                max={plage.fin || undefined}
                onChange={(e) => filtrer(setPlage)((p) => ({ ...p, debut: e.target.value }))}
                className="rounded-lg border border-gray-300 px-2 py-1.5"
              />
              au
              <input
                type="date"
                value={plage.fin}
                min={plage.debut || undefined}
                onChange={(e) => filtrer(setPlage)((p) => ({ ...p, fin: e.target.value }))}
                className="rounded-lg border border-gray-300 px-2 py-1.5"
              />
            </div>
          )}
        </div>

        {plageIncomplete && (
          <p className="text-sm text-gray-500 mb-4">Choisissez une date de début et une date de fin.</p>
        )}

        {/* Totaux */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <CarteTotal
            icone={Wallet}
            couleur="bg-epuici-blue"
            titre="Total général"
            montant={resume?.totalGeneral}
            detail={resume && `${resume.nombreReussis} paiement(s) réussi(s)`}
            chargement={chargement && !resume}
          />
          <CarteTotal
            icone={HandCoins}
            couleur="bg-epuici-accent"
            titre="Total dons"
            montant={resume?.totalDons}
            detail={resume && `${resume.nombreDons} don(s)`}
            chargement={chargement && !resume}
          />
          <CarteTotal
            icone={Landmark}
            couleur="bg-indigo-600"
            titre="Total dîmes"
            montant={resume?.totalDimes}
            detail={resume && `${resume.nombreDimes} dîme(s)`}
            chargement={chargement && !resume}
          />
        </div>

        {resume && (resume.nombreParStatut.en_attente > 0 || resume.nombreParStatut.echoue > 0) && (
          <p className="text-xs text-gray-500 -mt-3 mb-5">
            Sur la période : {resume.nombreParStatut.en_attente} en attente,{' '}
            {resume.nombreParStatut.echoue} échoué(s), {resume.nombreParStatut.annule} annulé(s) — non
            comptés.
          </p>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={saisieRecherche}
              onChange={(e) => setSaisieRecherche(e.target.value)}
              placeholder="Rechercher un membre, un téléphone, un n° de reçu..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={type}
            onChange={(e) => {
              filtrer(setType)(e.target.value);
              setCategorie('');
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tous les types</option>
            <option value="don">Dons</option>
            <option value="dime">Dîmes</option>
          </select>
          <select
            value={categorie}
            onChange={(e) => filtrer(setCategorie)(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Toutes les catégories</option>
            {listeCategories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.libelle}
              </option>
            ))}
          </select>
          <select
            value={statut}
            onChange={(e) => filtrer(setStatut)(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS).map(([code, s]) => (
              <option key={code} value={code}>
                {s.libelle}
              </option>
            ))}
          </select>
        </div>

        {erreur && <p className="text-red-600 text-sm mb-4">{erreur}</p>}

        {/* Liste */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Membre</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Catégorie</th>
                <th className="px-5 py-3 font-medium text-right">Montant</th>
                <th className="px-5 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chargement &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-3 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!chargement && liste.transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    Aucune transaction ne correspond à ces critères.
                  </td>
                </tr>
              )}

              {!chargement &&
                liste.transactions.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setDetailId(t._id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{dateHeure(t.createdAt)}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{t.membre?.nom || 'Compte supprimé'}</p>
                      <p className="text-xs text-gray-400">{t.membre?.telephone}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{t.type === 'dime' ? 'Dîme' : 'Don'}</td>
                    <td className="px-5 py-3 text-gray-600">{t.libelleCategorie}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                      {fcfa(t.montant)}
                    </td>
                    <td className="px-5 py-3">
                      <BadgeStatut statut={t.statut} />
                      {t.simulation && <span className="ml-1 text-xs text-amber-600">(test)</span>}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!chargement && liste.total > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
              {liste.total} transaction{liste.total > 1 ? 's' : ''} — page {liste.page} / {liste.pages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 border border-gray-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Précédent
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= liste.pages}
                className="flex items-center gap-1 border border-gray-200 bg-white px-3 py-1.5 rounded-lg disabled:opacity-40"
              >
                Suivant <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailId && <ModalDetail id={detailId} onFermer={() => setDetailId(null)} />}
    </MiseEnPageVillageAdmin>
  );
}

function CarteTotal({ icone: Icone, couleur, titre, montant, detail, chargement }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`${couleur} text-white p-3 rounded-lg`}>
        <Icone size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{titre}</p>
        {chargement ? (
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-800 truncate">{fcfa(montant)}</p>
        )}
        {detail && <p className="text-xs text-gray-400">{detail}</p>}
      </div>
    </div>
  );
}

function BadgeStatut({ statut }) {
  const s = STATUTS[statut] || STATUTS.en_attente;
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.classe}`}>{s.libelle}</span>;
}

function ModalDetail({ id, onFermer }) {
  const [t, setT] = useState(null);
  const [erreur, setErreur] = useState('');
  const [telechargement, setTelechargement] = useState(false);

  useEffect(() => {
    axiosClient
      .get(`/dons/eglise/transactions/${id}`)
      .then(({ data }) => setT(data))
      .catch((err) => setErreur(err.response?.data?.message || 'Impossible de charger la transaction.'));
  }, [id]);

  const telechargerRecu = async () => {
    setTelechargement(true);
    try {
      const reponse = await axiosClient.get(`/dons/${id}/recu`, { responseType: 'blob' });
      telecharger(reponse, `recu-${t.numeroRecu || id}.pdf`);
    } catch (err) {
      alert(await messageErreur(err, 'Impossible de télécharger le reçu.'));
    } finally {
      setTelechargement(false);
    }
  };

  const lignes = t
    ? [
        ['Membre', t.membre?.nom || 'Compte supprimé'],
        ['Téléphone', t.membre?.telephone || '—'],
        ['E-mail', t.membre?.email || '—'],
        ['Type', t.type === 'dime' ? 'Dîme' : 'Don'],
        ['Catégorie', t.libelleCategorie],
        ['Moyen de paiement', 'Wave'],
        ['Créé le', dateHeure(t.createdAt)],
        ['Confirmé le', t.dateConfirmation ? dateHeure(t.dateConfirmation) : '—'],
        ['N° de reçu', t.numeroRecu || '—'],
        ['Transaction Wave', t.statut === 'reussi' ? t.referenceWave || '—' : '—'],
        ['Session Wave', t.referenceSession || '—'],
        ...(t.motifEchec && t.statut !== 'reussi' ? [['Motif', t.motifEchec]] : []),
      ]
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFermer}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">Détail de la transaction</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
        {!t && !erreur && <p className="text-gray-400 text-sm">Chargement...</p>}

        {t && (
          <>
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-epuici-blue">{fcfa(t.montant)}</p>
              <div className="mt-2">
                <BadgeStatut statut={t.statut} />
                {t.simulation && <span className="ml-2 text-xs text-amber-600">Paiement de test</span>}
              </div>
            </div>
            <dl className="divide-y divide-gray-100 text-sm">
              {lignes.map(([libelle, valeur]) => (
                <div key={libelle} className="flex justify-between gap-4 py-2">
                  <dt className="text-gray-500">{libelle}</dt>
                  <dd className="text-gray-800 font-medium text-right break-all">{valeur}</dd>
                </div>
              ))}
            </dl>
            {t.statut === 'reussi' && (
              <button
                onClick={telechargerRecu}
                disabled={telechargement}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} />
                {telechargement ? 'Téléchargement...' : 'Télécharger le reçu PDF'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

