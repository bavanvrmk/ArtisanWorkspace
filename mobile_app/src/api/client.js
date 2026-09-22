import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // Use the machine's actual local IP address so the physical phone running Expo Go can connect.
  return 'http://10.12.178.54:8000/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

export default apiClient;
