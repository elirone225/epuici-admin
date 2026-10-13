import { useState } from 'react';
import { X, KeyRound } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export default function ModalChangerMotDePasse({
  onFermer,
  endpoint = '/auth/villageadmin/mot-de-passe',
}) {
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const valider = async () => {
    setErreur('');
    setSucces('');

    if (nouveauMotDePasse !== confirmation) {
      setErreur('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }

    setEnvoi(true);
    try {
      await axiosClient.put(endpoint, {
        motDePasseActuel,
        nouveauMotDePasse,
      });
      setSucces('Mot de passe modifié avec succès.');
      setMotDePasseActuel('');
      setNouveauMotDePasse('');
      setConfirmation('');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-gray-800 flex items-center gap-2">
            <KeyRound size={18} className="text-epuici-blue" />
            Changer le mot de passe
          </h3>
          <button onClick={onFermer}>
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-3">
          <input
            placeholder="Mot de passe actuel"
            type="password"
            value={motDePasseActuel}
            onChange={(e) => setMotDePasseActuel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Nouveau mot de passe"
            type="password"
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Confirmer le nouveau mot de passe"
            type="password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
          {succes && <p className="text-green-600 text-xs">{succes}</p>}
          <button
            onClick={valider}
            disabled={envoi || !motDePasseActuel || !nouveauMotDePasse || !confirmation}
            className="w-full bg-epuici-blue text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {envoi ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
