import axios from 'axios';
import { SERVER_URL } from '../utils/constants';

export const api = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});
