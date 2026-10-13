import { useEffect, useState } from 'react';
import { Users, Radio } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

export default function Abonnes() {
  const [donnees, setDonnees] = useState({ total: 0, actifsMaintenant: 0, abonnes: [] });
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    axiosClient
      .get('/utilisateurs/mon-village/abonnes')
      .then(({ data }) => setDonnees(data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  const estActif = (derniereConnexion) => {
    if (!derniereConnexion) return false;
    return new Date(derniereConnexion) > new Date(Date.now() - 15 * 60 * 1000);
  };

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">Abonnés</h1>
        <p className="text-gray-500 text-sm mb-6">
          Les fidèles qui suivent les actualités de votre église.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-epuici-blue text-white p-3 rounded-lg">
              <Users size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{donnees.total}</p>
              <p className="text-sm text-gray-500">Abonnés au total</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-epuici-accent text-white p-3 rounded-lg">
              <Radio size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{donnees.actifsMaintenant}</p>
              <p className="text-sm text-gray-500">Actifs maintenant (15 min)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Téléphone</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Dernière connexion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chargement && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement && donnees.abonnes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    Aucun abonné pour le moment.
                  </td>
                </tr>
              )}
              {donnees.abonnes.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 font-medium text-gray-800">{u.nom || 'Sans nom'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.telephone}</td>
                  <td className="px-6 py-4">
                    {estActif(u.derniereConnexion) ? (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-100 text-green-700">
                        En ligne
                      </span>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
                        Hors ligne
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {u.derniereConnexion
                      ? new Date(u.derniereConnexion).toLocaleString('fr-FR')
                      : 'Jamais connecté'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
