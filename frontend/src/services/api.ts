
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // This will be replaced by environment variable
});

export default api;
