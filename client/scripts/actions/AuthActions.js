import axios from 'axios';

import ActionTypes from '../constants/ActionTypes';
import AppDispatcher from '../dispatcher/AppDispatcher';

import Config from '../../../config';

let floodServerHost = Config.floodServerHost || 'localhost';

if (Config.baseUrl) {
  if (Config.ssl) {
    axios.defaults.baseURL = `https://${floodServerHost}:${Config.floodServerPort}${Config.baseUrl}`;
  } else {
    axios.defaults.baseURL = `http://${floodServerHost}:${Config.floodServerPort}${Config.baseUrl}`;
  }
}

let AuthActions = {
  authenticate: (credentials) => {
    return axios.post('/auth/authenticate', credentials)
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LOGIN_SUCCESS,
          data
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LOGIN_ERROR,
          error: error.data.message
        });
      });
  },

  createUser: (credentials) => {
    return axios.put('/auth/users', credentials)
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_CREATE_USER_SUCCESS,
          data
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_CREATE_USER_ERROR,
          error
        });
      });
  },

  deleteUser: (username) => {
    return axios.delete(`/auth/users/${username}`)
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_DELETE_USER_SUCCESS,
          data: {
            username,
            ...data
          }
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_DELETE_USER_ERROR,
          error: {
            username,
            ...error
          }
        });
      });
  },

  fetchUsers: () => {
    return axios.get('/auth/users')
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LIST_USERS_SUCCESS,
          data
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LIST_USERS_ERROR,
          error
        });
      });
  },

  register: (credentials) => {
    return axios.post('/auth/register', credentials)
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_REGISTER_SUCCESS,
          data
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_REGISTER_ERROR,
          error
        });
      });
  },

  verify: () => {
    // We need to prevent caching this endpoint.
    return axios.get(`/auth/verify?${Date.now()}`)
      .then((json = {}) => {
        return json.data;
      })
      .then((data) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_VERIFY_SUCCESS,
          data
        });
      }, (error) => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_VERIFY_ERROR,
          error
        });
      });
  }
};

export default AuthActions;
