import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stocke = localStorage.getItem('akyeUser');
    return stocke ? JSON.parse(stocke) : null;
  });

  const connecter = (donneesUtilisateur, token) => {
    localStorage.setItem('akyeToken', token);
    localStorage.setItem('akyeUser', JSON.stringify(donneesUtilisateur));
    setUser(donneesUtilisateur);
  };

  const deconnecter = () => {
    localStorage.removeItem('akyeToken');
    localStorage.removeItem('akyeUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
