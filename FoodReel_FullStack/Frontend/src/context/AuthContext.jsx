import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // logged-in user
  const [partner, setPartner] = useState(null); // logged-in food partner
  const [role, setRole] = useState(null);       // 'user' | 'partner' | null

  // Persist across refreshes
  useEffect(() => {
    const savedUser = localStorage.getItem('fr_user');
    const savedPartner = localStorage.getItem('fr_partner');
    const savedRole = localStorage.getItem('fr_role');
    if (savedUser && savedRole === 'user') { setUser(JSON.parse(savedUser)); setRole('user'); }
    if (savedPartner && savedRole === 'partner') { setPartner(JSON.parse(savedPartner)); setRole('partner'); }
  }, []);

  const loginAsUser = (userData) => {
    setUser(userData); setRole('user'); setPartner(null);
    localStorage.setItem('fr_user', JSON.stringify(userData));
    localStorage.setItem('fr_role', 'user');
    localStorage.removeItem('fr_partner');
  };

  const loginAsPartner = (partnerData) => {
    setPartner(partnerData); setRole('partner'); setUser(null);
    localStorage.setItem('fr_partner', JSON.stringify(partnerData));
    localStorage.setItem('fr_role', 'partner');
    localStorage.removeItem('fr_user');
  };

  const logout = () => {
    setUser(null); setPartner(null); setRole(null);
    localStorage.removeItem('fr_user');
    localStorage.removeItem('fr_partner');
    localStorage.removeItem('fr_role');
  };

  return (
    <AuthContext.Provider value={{ user, partner, role, loginAsUser, loginAsPartner, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
