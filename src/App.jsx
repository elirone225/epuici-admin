import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RouteProtegee from './components/RouteProtegee';

import ConnexionVillageAdmin from './pages/auth/ConnexionVillageAdmin';
import ConnexionSuperAdmin from './pages/auth/ConnexionSuperAdmin';
import TableauDeBordSuperAdmin from './pages/superadmin/TableauDeBordSuperAdmin';
import GestionVillageAdmins from './pages/superadmin/GestionVillageAdmins';
import GestionAbonnements from './pages/superadmin/GestionAbonnements';
import GestionUtilisateurs from './pages/superadmin/GestionUtilisateurs';
import GestionBannieresPub from './pages/superadmin/GestionBannieresPub';
import GestionVideosVod from './pages/superadmin/GestionVideosVod';
import TableauDeBordVillageAdmin from './pages/villageadmin/TableauDeBordVillageAdmin';
import Abonnement from './pages/villageadmin/Abonnement';
import Actualites from './pages/villageadmin/Actualites';
import Alertes from './pages/villageadmin/Alertes';
import DemandesPriere from './pages/villageadmin/DemandesPriere';
import LiveVod from './pages/villageadmin/LiveVod';
import Groupes from './pages/villageadmin/Groupes';
import Abonnes from './pages/villageadmin/Abonnes';
import DonsDimes from './pages/villageadmin/DonsDimes';
import Parametres from './pages/villageadmin/Parametres';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/connexion" replace />} />

          {/* Connexion */}
          <Route path="/connexion" element={<ConnexionVillageAdmin />} />
          <Route path="/superadmin/connexion" element={<ConnexionSuperAdmin />} />

          {/* Espace Village Admin */}
          <Route
            path="/eglise/tableau-de-bord"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <TableauDeBordVillageAdmin />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/abonnement"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Abonnement />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/actualites"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Actualites />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/alertes"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Alertes />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/prieres"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <DemandesPriere />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/live-vod"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <LiveVod />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/groupes"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Groupes />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/abonnes"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Abonnes />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/dons-dimes"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <DonsDimes />
              </RouteProtegee>
            }
          />
          <Route
            path="/eglise/parametres"
            element={
              <RouteProtegee roleRequis="villageadmin">
                <Parametres />
              </RouteProtegee>
            }
          />

          {/* Espace Super Admin */}
          <Route
            path="/superadmin/tableau-de-bord"
            element={
              <RouteProtegee roleRequis="superadmin">
                <TableauDeBordSuperAdmin />
              </RouteProtegee>
            }
          />
          <Route
            path="/superadmin/eglises"
            element={
              <RouteProtegee roleRequis="superadmin">
                <GestionVillageAdmins />
              </RouteProtegee>
            }
          />
          <Route
            path="/superadmin/abonnements"
            element={
              <RouteProtegee roleRequis="superadmin">
                <GestionAbonnements />
              </RouteProtegee>
            }
          />
          <Route
            path="/superadmin/utilisateurs"
            element={
              <RouteProtegee roleRequis="superadmin">
                <GestionUtilisateurs />
              </RouteProtegee>
            }
          />
          <Route
            path="/superadmin/bandes-pub"
            element={
              <RouteProtegee roleRequis="superadmin">
                <GestionBannieresPub />
              </RouteProtegee>
            }
          />
          <Route
            path="/superadmin/videos-vod"
            element={
              <RouteProtegee roleRequis="superadmin">
                <GestionVideosVod />
              </RouteProtegee>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
