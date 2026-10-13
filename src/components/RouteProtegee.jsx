import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RouteProtegee({ children, roleRequis }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/connexion" replace />;
  }

  if (roleRequis && user.role !== roleRequis) {
    return <Navigate to="/connexion" replace />;
  }

  return children;
}
