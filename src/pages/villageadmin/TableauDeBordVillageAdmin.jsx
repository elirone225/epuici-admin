import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function TableauDeBordVillageAdmin() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, actifsMaintenant: 0 });

  const abonnementActif =
    user?.abonnementExpireLe && new Date(user.abonnementExpireLe) > new Date();

  useEffect(() => {
    axiosClient
      .get('/utilisateurs/mon-village/abonnes')
      .then(({ data }) => setStats({ total: data.total, actifsMaintenant: data.actifsMaintenant }))
      .catch(() => {});
  }, []);

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">
          Bonjour, {user?.nom}
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Tableau de bord de {user?.village?.nom}.
        </p>

        {!abonnementActif && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6">
            <p className="font-medium text-gray-800 mb-1">Aucun abonnement actif</p>
            <p className="text-sm text-gray-600 mb-3">
              Vous devez souscrire à une formule pour pouvoir publier des actualités et des offres.
            </p>
            <Link
              to="/eglise/abonnement"
              className="inline-block bg-epuici-accent text-white text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 transition"
            >
              Voir les formules
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/eglise/abonnes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:border-epuici-blue transition"
          >
            <div className="bg-epuici-blue text-white p-3 rounded-lg">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">Abonnés à mon église</p>
            </div>
          </Link>
          <Link
            to="/eglise/abonnes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:border-epuici-accent transition"
          >
            <div className="bg-epuici-accent text-white p-3 rounded-lg">
              <Radio size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.actifsMaintenant}</p>
              <p className="text-sm text-gray-500">Actifs maintenant</p>
            </div>
          </Link>
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
