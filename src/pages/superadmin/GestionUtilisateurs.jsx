import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function GestionUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [total, setTotal] = useState(0);
  const [chargement, setChargement] = useState(true);

  const charger = () => {
    axiosClient
      .get('/utilisateurs')
      .then(({ data }) => {
        setUtilisateurs(data.utilisateurs);
        setTotal(data.total);
      })
      .catch(() => {})
      .finally(() => setChargement(false));
  };

  useEffect(() => {
    charger();
  }, []);

  const supprimer = async (utilisateur) => {
    const confirme = window.confirm(
      `Supprimer définitivement le compte de "${utilisateur.nom || utilisateur.telephone}" ?\n\nCette action est irréversible.`
    );
    if (!confirme) return;

    try {
      await axiosClient.delete(`/utilisateurs/${utilisateur._id}`);
      setUtilisateurs((liste) => liste.filter((u) => u._id !== utilisateur._id));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">Utilisateurs</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tous les fidèles inscrits sur EPUICI ({total} au total), toutes églises confondues.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Nom</th>
                <th className="px-6 py-3 font-medium">Téléphone</th>
                <th className="px-6 py-3 font-medium">Églises suivies</th>
                <th className="px-6 py-3 font-medium">Inscrit le</th>
                <th className="px-6 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {chargement && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Chargement...
                  </td>
                </tr>
              )}
              {!chargement && utilisateurs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Aucun utilisateur inscrit pour le moment.
                  </td>
                </tr>
              )}
              {utilisateurs.map((u) => (
                <tr key={u._id}>
                  <td className="px-6 py-4 font-medium text-gray-800">{u.nom || 'Sans nom'}</td>
                  <td className="px-6 py-4 text-gray-600">{u.telephone}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {u.villagesSuivis?.length > 0
                      ? u.villagesSuivis.map((v) => v.nom).join(', ')
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => supprimer(u)}
                      title="Supprimer l'utilisateur"
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <Trash2 size={16} />
                    </button>
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
