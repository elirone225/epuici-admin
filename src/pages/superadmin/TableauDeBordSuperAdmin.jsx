import { useEffect, useState } from 'react';
import { Building2, Users, CreditCard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';
import MiseEnPageSuperAdmin from '../../components/MiseEnPageSuperAdmin';

export default function TableauDeBordSuperAdmin() {
  const { user } = useAuth();
  const [villages, setVillages] = useState([]);

  useEffect(() => {
    axiosClient.get('/villages/tous').then(({ data }) => setVillages(data)).catch(() => {});
  }, []);

  const villagesAvecAdmin = villages.filter((v) => v.admin).length;
  const abonnementsActifs = villages.filter(
    (v) => v.admin?.abonnementExpireLe && new Date(v.admin.abonnementExpireLe) > new Date()
  ).length;

  return (
    <MiseEnPageSuperAdmin>
      <div className="p-8">
        <h1 className="font-display text-2xl font-bold text-gray-800 mb-1">
          Bonjour, {user?.nom}
        </h1>
        <p className="text-gray-500 text-sm mb-6">Vue d'ensemble de la plateforme EPUICI.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CarteStat icone={Building2} label="Églises" valeur={villages.length} couleur="bg-epuici-blue" />
          <CarteStat icone={Users} label="Églises avec admin" valeur={villagesAvecAdmin} couleur="bg-epuici-accent" />
          <CarteStat icone={CreditCard} label="Abonnements actifs" valeur={abonnementsActifs} couleur="bg-epuici-secondary" />
        </div>
      </div>
    </MiseEnPageSuperAdmin>
  );
}

function CarteStat({ icone: Icone, label, valeur, couleur }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`${couleur} text-white p-3 rounded-lg`}>
        <Icone size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{valeur}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
