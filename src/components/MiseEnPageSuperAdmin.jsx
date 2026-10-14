import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, CreditCard, Users, LogOut, KeyRound, Video, GalleryHorizontal, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalChangerMotDePasse from './ModalChangerMotDePasse';

export default function MiseEnPageSuperAdmin({ children }) {
  const { user, deconnecter } = useAuth();
  const location = useLocation();
  const [modalMotDePasseOuvert, setModalMotDePasseOuvert] = useState(false);

  const liensMenu = [
    {
      chemin: '/superadmin/tableau-de-bord',
      label: 'Tableau de bord',
      icone: LayoutDashboard,
    },
    {
      chemin: '/superadmin/eglises',
      label: 'Églises & Admins',
      icone: Building2,
    },
    {
      chemin: '/superadmin/abonnements',
      label: 'Abonnements',
      icone: CreditCard,
    },
    {
      chemin: '/superadmin/utilisateurs',
      label: 'Utilisateurs',
      icone: Users,
    },
    {
      chemin: '/superadmin/videos-vod',
      label: 'Vidéos (VOD)',
      icone: Clapperboard,
    },
    {
      chemin: '/superadmin/pub-reportage',
      label: 'Pub & Reportage',
      icone: Video,
    },
    {
      chemin: '/superadmin/bandes-pub',
      label: 'Bandes pub',
      icone: GalleryHorizontal,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Menu latéral */}
      <aside className="w-64 bg-epuici-blue text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <img src="/logo.png" alt="EPUICI" className="w-11 h-11 object-contain" />
          <div>
            <h1 className="font-display text-lg font-bold leading-tight">EPUICI</h1>
            <p className="text-xs text-white/60">Super Admin</p>
          </div>
        </div>

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

      {/* Contenu */}
      <main className="flex-1 overflow-auto">{children}</main>

      {modalMotDePasseOuvert && (
        <ModalChangerMotDePasse
          endpoint="/auth/superadmin/mot-de-passe"
          onFermer={() => setModalMotDePasseOuvert(false)}
        />
      )}
    </div>
  );
}
