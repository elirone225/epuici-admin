import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Newspaper, MessagesSquare, CreditCard, Users, LogOut, KeyRound, Megaphone, HandHeart, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalChangerMotDePasse from './ModalChangerMotDePasse';

export default function MiseEnPageVillageAdmin({ children }) {
  const { user, deconnecter } = useAuth();
  const location = useLocation();
  const [modalMotDePasseOuvert, setModalMotDePasseOuvert] = useState(false);

  const abonnementActif =
    user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  const liensMenu = [
    { chemin: '/eglise/tableau-de-bord', label: 'Tableau de bord', icone: LayoutDashboard },
    { chemin: '/eglise/actualites', label: 'Actualités', icone: Newspaper },
    { chemin: '/eglise/live-vod', label: 'Direct', icone: Radio },
    { chemin: '/eglise/alertes', label: 'Alertes', icone: Megaphone },
    { chemin: '/eglise/prieres', label: 'Demandes de prière', icone: HandHeart },
    { chemin: '/eglise/groupes', label: 'Groupes', icone: MessagesSquare },
    { chemin: '/eglise/abonnes', label: 'Abonnés', icone: Users },
    { chemin: '/eglise/abonnement', label: 'Abonnement', icone: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-epuici-blue text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="EPUICI" className="w-11 h-11 object-contain" />
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">EPUICI</h1>
            <p className="text-xs text-white/60 truncate">{user?.village?.nom}</p>
          </div>
        </div>

        {!abonnementActif && (
          <div className="mx-4 mt-4 bg-epuici-accent/20 border border-epuici-accent/40 rounded-lg p-3">
            <p className="text-xs text-white">
              ⚠️ Abonnement inactif. Vous ne pouvez pas publier tant que vous n'avez pas payé.
            </p>
            <Link
              to="/eglise/abonnement"
              className="text-xs font-semibold underline mt-1 inline-block"
            >
              Payer maintenant
            </Link>
          </div>
        )}

        <nav className="flex-1 p-4 space-y-1">
          {liensMenu.map((lien) => {
            const Icone = lien.icone;
            const actif = location.pathname === lien.chemin;
            return (
              <Link
                key={lien.chemin}
                to={lien.chemin}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  actif ? 'bg-white/15 font-medium' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icone size={18} />
                {lien.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <p className="text-sm text-white/70 mb-2 truncate">{user?.nom}</p>
          <button
            onClick={() => setModalMotDePasseOuvert(true)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
          >
            <KeyRound size={16} />
            Changer le mot de passe
          </button>
          <button
            onClick={deconnecter}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>

      {modalMotDePasseOuvert && (
        <ModalChangerMotDePasse onFermer={() => setModalMotDePasseOuvert(false)} />
      )}
    </div>
  );
}
