import { createContext, useState } from 'react';

const AuthContext = createContext(null);
export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
