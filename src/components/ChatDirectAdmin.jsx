import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Trash2, Eye, BadgeCheck } from 'lucide-react';
import axiosClient from '../api/axiosClient';

// Chat du direct vu par l'admin / le trésorier : lecture en continu,
// réponse au nom de l'église et suppression des messages (modération).
export default function ChatDirectAdmin({ villageId }) {
  const [messages, setMessages] = useState([]);
  const [spectateurs, setSpectateurs] = useState(0);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const dernierId = useRef(null);
  const liste = useRef(null);

  useEffect(() => {
    let actif = true;
    const actualiser = async () => {
      try {
        const { data } = await axiosClient.get(`/live-vod/village/${villageId}/chat`, {
          params: dernierId.current ? { apres: dernierId.current } : {},
        });
        if (!actif) return;
        setSpectateurs(data.spectateurs || 0);
        setErreur('');
        if (data.messages?.length) {
          dernierId.current = data.messages[data.messages.length - 1]._id;
          setMessages((avant) => {
            const connus = new Set(avant.map((m) => m._id));
            return [...avant, ...data.messages.filter((m) => !connus.has(m._id))];
          });
        }
      } catch {
        if (actif) setErreur('Connexion perdue, nouvel essai…');
      }
    };
    actualiser();
    const minuteur = setInterval(actualiser, 4000);
    return () => {
      actif = false;
      clearInterval(minuteur);
    };
  }, [villageId]);

  // Garde les derniers messages visibles
  useEffect(() => {
    if (liste.current) liste.current.scrollTop = liste.current.scrollHeight;
  }, [messages.length]);

  const envoyer = async (e) => {
    e.preventDefault();
    if (!texte.trim()) return;
    setEnvoi(true);
    try {
      const { data } = await axiosClient.post(`/live-vod/village/${villageId}/chat`, { texte });
      dernierId.current = data._id;
      setMessages((avant) => [...avant, data]);
      setTexte('');
    } catch (err) {
      alert(err.response?.data?.message || "Impossible d'envoyer le message.");
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer ce message du chat ?')) return;
    try {
      await axiosClient.delete(`/live-vod/chat/${id}`);
      setMessages((avant) => avant.filter((m) => m._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm mt-6 flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare size={18} className="text-epuici-blue" /> Chat du direct
        </h2>
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Eye size={15} /> {spectateurs} spectateur{spectateurs > 1 ? 's' : ''}
        </span>
      </div>
      <div ref={liste} className="h-80 overflow-y-auto px-5 py-3 space-y-2">
        {messages.length === 0 && <p className="text-sm text-gray-400">Aucun message pour le moment.</p>}
        {messages.map((m) => (
          <div key={m._id} className="flex items-start gap-2 group">
            <div className={`flex-1 rounded-lg px-3 py-1.5 ${m.estEglise ? 'bg-epuici-secondary/30' : 'bg-gray-50'}`}>
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                {m.auteurNom}
                {m.estEglise && <BadgeCheck size={13} className="text-epuici-blue" />}
                <span className="font-normal text-gray-400 ml-1">
                  {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p className="text-sm text-gray-800 break-words">{m.texte}</p>
            </div>
            <button
              onClick={() => supprimer(m._id)}
              title="Supprimer"
              className="text-gray-300 hover:text-red-600 mt-1"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      {erreur && <p className="text-xs text-red-600 px-5">{erreur}</p>}
      <form onSubmit={envoyer} className="flex gap-2 p-3 border-t border-gray-100">
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          maxLength={300}
          placeholder="Répondre au nom de l'église…"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={envoi || !texte.trim()}
          className="flex items-center gap-1 bg-epuici-blue text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-50"
        >
          <Send size={15} /> Envoyer
        </button>
      </form>
    </section>
  );
}
