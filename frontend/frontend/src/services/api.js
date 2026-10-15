import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.DEV
    ? import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`
    : '/api',
  withCredentials: true, // CRITICAL: Allows browser to send & store HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json'
  }
});

export default API;
