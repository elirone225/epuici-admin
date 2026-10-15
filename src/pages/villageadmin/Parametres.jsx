import { useEffect, useState } from 'react';
import { Smartphone, Save, Lock, CheckCircle2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';
import MiseEnPageVillageAdmin from '../../components/MiseEnPageVillageAdmin';

// Paramètres de l'église. Le numéro Wave, qui reçoit le reversement des
// dons et dîmes, est saisi par le trésorier ; l'admin le voit seulement.

// "+2250708091011" -> "+225 07 08 09 10 11"
const formaterNumero = (numero) =>
  numero ? numero.replace(/^\+225(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '+225 $1 $2 $3 $4 $5') : '';

export default function Parametres() {
  const { user } = useAuth();
  const [parametres, setParametres] = useState(null);
  const [numero, setNumero] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    axiosClient
      .get('/villages/mon-eglise/parametres')
      .then(({ data }) => {
        setParametres(data);
        setNumero(data.numeroWave ? data.numeroWave.replace(/^\+225/, '') : '');
      })
      .catch((err) => setErreur(err.response?.data?.message || 'Impossible de charger les paramètres.'))
      .finally(() => setChargement(false));
  }, []);

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur('');
    setSucces('');
    setEnvoi(true);
    try {
      const { data } = await axiosClient.put('/villages/mon-eglise/numero-wave', { numeroWave: numero });
      setParametres(data);
      setNumero(data.numeroWave.replace(/^\+225/, ''));
      setSucces(data.message || 'Numéro Wave enregistré.');
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'enregistrer le numéro.");
    } finally {
      setEnvoi(false);
    }
  };

  const modifiable = parametres?.modifiable ?? user?.fonction === 'tresorier';

  return (
    <MiseEnPageVillageAdmin>
      <div className="p-8 max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-1 mb-6">Réglages de {user?.village?.nom}.</p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4 mb-5">
            <div className="bg-sky-400 text-white p-3 rounded-lg">
              <Smartphone size={22} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-gray-800">Numéro Wave de l'église</h2>
              <p className="text-sm text-gray-500">
                Numéro sur lequel EPUICI reverse les dons et dîmes payés par les fidèles. Tant
                qu'il n'est pas renseigné, les fidèles ne peuvent pas payer.
              </p>
            </div>
          </div>

          {chargement && <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />}

          {!chargement && modifiable && (
            <form onSubmit={enregistrer} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Numéro Wave (Côte d'Ivoire)</label>
              <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:border-epuici-blue">
                <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r border-gray-300">+225</span>
                <input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  inputMode="tel"
                  placeholder="07 00 00 00 00"
                  className="flex-1 px-3 py-2 text-sm outline-none"
                />
              </div>
              {parametres?.numeroWaveModifieLe && (
                <p className="text-xs text-gray-400">
                  Dernière modification le{' '}
                  {new Date(parametres.numeroWaveModifieLe).toLocaleString('fr-FR', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })}
                </p>
              )}
              {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
              {succes && (
                <p className="text-green-700 text-sm flex items-center gap-1.5">
                  <CheckCircle2 size={16} /> {succes}
                </p>
              )}
              <button
                type="submit"
                disabled={envoi || !numero.trim()}
                className="flex items-center gap-2 bg-epuici-blue text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                <Save size={16} />
                {envoi ? 'Enregistrement...' : 'Enregistrer le numéro'}
              </button>
            </form>
          )}

          {!chargement && !modifiable && (
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-800">
                {parametres?.numeroWave ? formaterNumero(parametres.numeroWave) : 'Non renseigné'}
              </p>
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Lock size={14} /> Seul le trésorier de l'église peut modifier ce numéro.
              </p>
              {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
            </div>
          )}
        </div>
      </div>
    </MiseEnPageVillageAdmin>
  );
}
