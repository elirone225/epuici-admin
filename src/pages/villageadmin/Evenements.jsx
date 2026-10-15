import { useCallback, useEffect, useState } from 'react';
import { Plus, X, CalendarDays, MapPin, Users, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

// Agenda de l'église : les événements apparaissent sur l'accueil de l'app,
// les fidèles indiquent "Je participe" et reçoivent un rappel.

const dateLongue = (date) =>
  new Date(date).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// Date -> valeur d'un champ <input type="datetime-local"> (heure locale)
const versChampDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const deux = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`;
};

export default function Evenements() {
  const { user } = useAuth();
  const [evenements, setEvenements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState('a_venir');
  const [formulaire, setFormulaire] = useState(null); // null | {} (nouveau) | événement
  const [participantsDe, setParticipantsDe] = useState(null);
  // Heure de référence pour séparer "à venir" et "passés"
  const [maintenant] = useState(() => Date.now());

  const abonnementActif = user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  const charger = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/evenements/mon-eglise');
      setEvenements(data);
    } catch {
      // silencieux, comme les autres listes de l'espace église
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    axiosClient
      .get('/evenements/mon-eglise')
      .then(({ data }) => setEvenements(data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  const supprimer = async (evenement) => {
    if (!confirm(`Supprimer l'événement « ${evenement.titre} » ?`)) return;
    try {
      await axiosClient.delete(`/evenements/${evenement._id}`);
      setEvenements((liste) => liste.filter((e) => e._id !== evenement._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const termine = (e) => new Date(e.dateFin || new Date(e.dateDebut).getTime() + 2 * 3600e3) < maintenant;
  const affiches = evenements
    .filter((e) => (onglet === 'a_venir' ? !termine(e) : termine(e)))
    .sort((a, b) =>
      onglet === 'a_venir'
        ? new Date(a.dateDebut) - new Date(b.dateDebut)
        : new Date(b.dateDebut) - new Date(a.dateDebut)
    );

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Événements</h1>
            <p className="text-gray-500 text-sm mt-1">
              L'agenda de votre église, affiché sur l'accueil de l'application.
            </p>
          </div>
          <button
            onClick={() => setFormulaire({})}
            disabled={!abonnementActif}
            title={!abonnementActif ? 'Abonnement requis pour publier' : ''}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Nouvel événement
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            ['a_venir', 'À venir'],
            ['passes', 'Passés'],
          ].map(([code, libelle]) => (
            <button
              key={code}
              onClick={() => setOnglet(code)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                onglet === code
                  ? 'bg-epuici-blue text-white border-epuici-blue'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-epuici-blue'
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {chargement &&
            [0, 1, 2].map((i) => <div key={i} className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
          {!chargement && affiches.length === 0 && (
            <p className="text-gray-400">
              {onglet === 'a_venir' ? 'Aucun événement à venir.' : 'Aucun événement passé.'}
            </p>
          )}
          {affiches.map((e) => (
            <div key={e._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
              {e.photo ? (
                <img src={e.photo} alt="" className="w-24 h-24 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-epuici-secondary/30 text-epuici-blue flex items-center justify-center shrink-0">
                  <CalendarDays size={32} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{e.titre}</h3>
                <p className="text-sm text-epuici-blue font-medium first-letter:uppercase">{dateLongue(e.dateDebut)}</p>
                {e.lieu && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={14} /> {e.lieu}
                  </p>
                )}
                <button
                  onClick={() => setParticipantsDe(e)}
                  className="text-sm text-gray-600 flex items-center gap-1 mt-1 hover:text-epuici-blue"
                >
                  <Users size={14} /> {e.nombreParticipants} participant{e.nombreParticipants > 1 ? 's' : ''}
                </button>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button onClick={() => setFormulaire(e)} title="Modifier" className="text-gray-400 hover:text-epuici-blue">
                  <Pencil size={16} />
                </button>
                <button onClick={() => supprimer(e)} title="Supprimer" className="text-red-500 hover:text-red-700">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {formulaire && (
        <ModalEvenement
          evenement={formulaire._id ? formulaire : null}
          onFermer={() => setFormulaire(null)}
          onSucces={() => {
            setFormulaire(null);
            charger();
          }}
        />
      )}
      {participantsDe && <ModalParticipants evenement={participantsDe} onFermer={() => setParticipantsDe(null)} />}
    </MiseEnPageVillageAdmin>
  );
}

function ModalEvenement({ evenement, onFermer, onSucces }) {
  const [titre, setTitre] = useState(evenement?.titre || '');
  const [description, setDescription] = useState(evenement?.description || '');
  const [lieu, setLieu] = useState(evenement?.lieu || '');
  const [debut, setDebut] = useState(versChampDate(evenement?.dateDebut));
  const [fin, setFin] = useState(versChampDate(evenement?.dateFin));
  const [photo, setPhoto] = useState(null);
  const [notifier, setNotifier] = useState(true);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!titre.trim() || !debut) {
      setErreur('Le titre et la date de début sont obligatoires.');
      return;
    }
    const donnees = new FormData();
    donnees.append('titre', titre);
    donnees.append('description', description);
    donnees.append('lieu', lieu);
    donnees.append('dateDebut', new Date(debut).toISOString());
    donnees.append('dateFin', fin ? new Date(fin).toISOString() : '');
    if (photo) donnees.append('photo', photo);
    if (!evenement) donnees.append('notifier', String(notifier));

    setEnvoi(true);
    try {
      if (evenement) await axiosClient.put(`/evenements/${evenement._id}`, donnees);
      else await axiosClient.post('/evenements', donnees);
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setEnvoi(false);
    }
  };

  const champ = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={enregistrer} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">
            {evenement ? "Modifier l'événement" : 'Nouvel événement'}
          </h3>
          <button type="button" onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="space-y-3">
          <input placeholder="Titre (ex : Veillée de prière)" value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={150} className={champ} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-500">
              Début
              <input type="datetime-local" value={debut} onChange={(e) => setDebut(e.target.value)} className={`${champ} mt-1`} />
            </label>
            <label className="text-xs text-gray-500">
              Fin (facultatif)
              <input type="datetime-local" value={fin} min={debut || undefined} onChange={(e) => setFin(e.target.value)} className={`${champ} mt-1`} />
            </label>
          </div>
          <input placeholder="Lieu (facultatif)" value={lieu} onChange={(e) => setLieu(e.target.value)} maxLength={200} className={champ} />
          <textarea placeholder="Description (facultatif)" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={champ} />
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <ImageIcon size={16} />
            <span>{photo ? photo.name : evenement?.photo ? "Remplacer l'affiche" : 'Ajouter une affiche (facultatif)'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          </label>
          {!evenement && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={notifier} onChange={(e) => setNotifier(e.target.checked)} />
              Prévenir les fidèles par notification
            </label>
          )}
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          <button
            type="submit"
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Enregistrement...' : evenement ? 'Enregistrer' : "Publier l'événement"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalParticipants({ evenement, onFermer }) {
  const [participants, setParticipants] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    axiosClient
      .get(`/evenements/${evenement._id}/participants`)
      .then(({ data }) => setParticipants(data))
      .catch(() => setErreur('Impossible de charger les participants.'));
  }, [evenement._id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFermer}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800 line-clamp-1">Participants — {evenement.titre}</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto divide-y divide-gray-100">
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
          {!participants && !erreur && <p className="text-gray-400 text-sm">Chargement...</p>}
          {participants?.length === 0 && <p className="text-gray-400 text-sm">Personne pour le moment.</p>}
          {participants?.map((p) => (
            <div key={p._id} className="py-2 flex justify-between text-sm">
              <span className="text-gray-800">{p.nom}</span>
              <span className="text-gray-400">{p.telephone}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
