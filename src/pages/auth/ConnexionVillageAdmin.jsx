import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export default function ConnexionVillageAdmin() {
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);
  const { connecter } = useAuth();
  const navigate = useNavigate();

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur('');
    setChargement(true);
    try {
      const { data } = await axiosClient.post('/auth/villageadmin/login', {
        telephone,
        motDePasse,
      });
      connecter({ ...data, role: 'villageadmin' }, data.token);
      navigate('/eglise/tableau-de-bord');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur de connexion.');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-epuici-blue px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <img src="/logo.png" alt="EPUICI" className="w-20 h-20 object-contain mx-auto mb-3" />
        <p className="text-center text-gray-500 text-sm mb-6">Espace administrateur d'église</p>

        <form onSubmit={soumettre} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              required
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epuici-blue"
              placeholder="07 00 00 00 00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epuici-blue"
              placeholder="••••••••"
            />
          </div>

          {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-epuici-accent text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <Link
          to="/superadmin/connexion"
          className="block text-center text-sm text-gray-500 mt-4 hover:underline"
        >
          Je suis le Super Admin
        </Link>
      </div>
    </div>
  );
}
