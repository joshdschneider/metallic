import { envVars } from '@metallichq/shared';
import axios from 'axios';

const api = axios.create({
  baseURL: `${envVars.FLY_API_HOSTNAME}`,
  headers: {
    Authorization: `Bearer ${envVars.FLY_API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const customError = {
      message: error.message,
      status: error.response ? error.response.status : null,
      data: error.response ? error.response.data : null
    };
    return Promise.reject(customError);
  }
);

export { api };
