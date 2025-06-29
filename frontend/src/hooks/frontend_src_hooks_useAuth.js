import { useState, useEffect } from 'react';
import axios from 'axios';

function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      fetchUser(tokenFromUrl);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const login = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return { user, token, login, logout };
}

export default useAuth;