import { useEffect, useState } from 'react';
import { Plus, X, Image as ImageIcon, Trash2, Eye, Heart, Send, Undo2, MessageCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

// Catégories filtrables dans l'app (les anciennes publications sont
// classées dans "Annonces")
const CATEGORIES = [
  { valeur: 'annonce', label: 'Annonce' },
  { valeur: 'enseignement', label: 'Enseignement' },
  { valeur: 'temoignage', label: 'Témoignage' },
];
const libelleCategorie = (valeur) =>
  CATEGORIES.find((c) => c.valeur === valeur)?.label || 'Annonce';

export default function Actualites() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [articleCommentaires, setArticleCommentaires] = useState(null);

  const abonnementActif =
    user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await axiosClient.get('/articles/mes-articles');
      setArticles(data);
    } catch (err) {
      // silencieux
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (id) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await axiosClient.delete(`/articles/${id}`);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  const basculerStatut = async (article) => {
    const nouveauStatut = article.statut === 'publie' ? 'brouillon' : 'publie';
    try {
      await axiosClient.put(`/articles/${article._id}`, { statut: nouveauStatut });
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du changement de statut.');
    }
  };

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-800">Actualités</h1>
            <p className="text-gray-500 text-sm mt-1">
              Publiez les nouvelles de votre église pour vos abonnés.
            </p>
          </div>
          <button
            onClick={() => setModalOuvert(true)}
            disabled={!abonnementActif}
            title={!abonnementActif ? 'Abonnement requis pour publier' : ''}
            className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Nouvel article
          </button>
        </div>

        {!abonnementActif && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
            Votre abonnement n'est pas actif. Rendez-vous sur la page "Abonnement" pour pouvoir
            publier.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargement && <p className="text-gray-400 col-span-full">Chargement...</p>}

          {!chargement && articles.length === 0 && (
            <p className="text-gray-400 col-span-full">Aucun article pour le moment.</p>
          )}

          {articles.map((article) => (
            <div
              key={article._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {article.photos?.[0] && (
                <img
                  src={article.photos[0]}
                  alt={article.titre}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      article.statut === 'publie'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {article.statut === 'publie' ? 'Publié' : 'Brouillon'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-epuici-secondary/30 text-epuici-blue">
                    {libelleCategorie(article.categorie)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{article.titre}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.contenu}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Eye size={14} /> {article.vues}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {article.likes}
                    </span>
                    <button
                      onClick={() => setArticleCommentaires(article)}
                      title="Voir et modérer les commentaires"
                      className="flex items-center gap-1 hover:text-epuici-blue"
                    >
                      <MessageCircle size={14} /> {article.nombreCommentaires || 0}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => basculerStatut(article)}
                      disabled={!abonnementActif}
                      title={
                        !abonnementActif
                          ? 'Abonnement requis'
                          : article.statut === 'publie'
                            ? 'Repasser en brouillon'
                            : 'Publier'
                      }
                      className="text-epuici-blue hover:opacity-70 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {article.statut === 'publie' ? <Undo2 size={16} /> : <Send size={16} />}
                    </button>
                    <button
                      onClick={() => supprimer(article._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {articleCommentaires && (
        <ModalCommentaires
          article={articleCommentaires}
          onFermer={() => {
            setArticleCommentaires(null);
            charger();
          }}
        />
      )}

      {modalOuvert && (
        <ModalNouvelArticle
          onFermer={() => setModalOuvert(false)}
          onSucces={() => {
            setModalOuvert(false);
            charger();
          }}
        />
      )}
    </MiseEnPageVillageAdmin>
  );
}

function ModalNouvelArticle({ onFermer, onSucces }) {
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [categorie, setCategorie] = useState('annonce');
  const [statut, setStatut] = useState('publie');
  const [photos, setPhotos] = useState([]);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const gererSelectionPhotos = (e) => {
    const fichiers = Array.from(e.target.files).slice(0, 3);
    setPhotos(fichiers);
  };

  const publier = async () => {
    setErreur('');

    if (photos.length === 0) {
      setErreur('Ajoutez au moins 1 photo.');
      return;
    }

    const formData = new FormData();
    formData.append('titre', titre);
    formData.append('contenu', contenu);
    formData.append('categorie', categorie);
    formData.append('statut', statut);
    photos.forEach((fichier) => formData.append('photos', fichier));

    setEnvoi(true);
    try {
      await axiosClient.post('/articles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSucces();
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors de la publication.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800">Nouvel article</h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Titre de l'article"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <textarea
            placeholder="Contenu de l'article..."
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />

          <select
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.valeur} value={c.valeur}>
                {c.label}
              </option>
            ))}
          </select>

          <div>
            <label className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-500 cursor-pointer hover:border-epuici-blue transition">
              <ImageIcon size={18} />
              {photos.length > 0
                ? `${photos.length} photo(s) sélectionnée(s)`
                : 'Ajouter 1 à 3 photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={gererSelectionPhotos}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={statut === 'publie'}
                onChange={() => setStatut('publie')}
              />
              Publier maintenant
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                checked={statut === 'brouillon'}
                onChange={() => setStatut('brouillon')}
              />
              Enregistrer en brouillon
            </label>
          </div>

          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}

          <button
            onClick={publier}
            disabled={envoi}
            className="w-full bg-epuici-blue text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Commentaires des fidèles sous une publication, avec suppression (modération)
function ModalCommentaires({ article, onFermer }) {
  const [commentaires, setCommentaires] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    axiosClient
      .get(`/articles/${article._id}/commentaires`)
      .then(({ data }) => setCommentaires(data))
      .catch(() => setErreur('Impossible de charger les commentaires.'));
  }, [article._id]);

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce commentaire ?')) return;
    try {
      await axiosClient.delete(`/articles/commentaires/${id}`);
      setCommentaires((liste) => liste.filter((c) => c._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onFermer}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800 line-clamp-1">
            Commentaires — {article.titre}
          </h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="overflow-y-auto space-y-3">
          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
          {!commentaires && !erreur && <p className="text-gray-400 text-sm">Chargement...</p>}
          {commentaires?.length === 0 && <p className="text-gray-400 text-sm">Aucun commentaire.</p>}
          {commentaires?.map((c) => (
            <div key={c._id} className="flex gap-3 items-start border-b border-gray-100 pb-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-gray-800">{c.auteur?.nom || 'Fidèle'}</span>{' '}
                  <span className="text-xs text-gray-400">
                    {new Date(c.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{c.texte}</p>
              </div>
              <button
                onClick={() => supprimer(c._id)}
                title="Supprimer"
                className="text-red-500 hover:text-red-700 shrink-0"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
