
import axios from 'axios';
import { API_BASE_URL } from '../components/config';

class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    if (this.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    }
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userLogin');
    delete axios.defaults.headers.common['Authorization'];
  }

  isAuthenticated() {
    return !!this.token;
  }

  async verifyToken() {
    if (!this.token) return false;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/verify-token`);
      return response.data.success;
    } catch (error) {
      this.removeToken();
      return false;
    }
  }

  async login(credentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      
      if (response.data.success) {
        this.setToken(response.data.token);
        
        // Salvar dados do usuário
        localStorage.setItem('userType', response.data.user.tipo);
        localStorage.setItem('userName', response.data.user.nome);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('userLogin', response.data.user.login);
        
        return response.data;
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.removeToken();
    window.location.href = '/';
  }
}

const authService = new AuthService();
export default authService;
