import {browserHistory} from 'react-router';
import axios from 'axios';

import ActionTypes from '../constants/ActionTypes';
import AppDispatcher from '../dispatcher/AppDispatcher';
import ClientActions from './ClientActions';
import ConfigStore from '../stores/ConfigStore';
import FloodActions from './FloodActions';
import SettingsActions from './SettingsActions';

const baseURI = ConfigStore.getBaseURI();

const AuthActions = {
  authenticate: credentials =>
    axios
      .post(`${baseURI}auth/authenticate`, credentials)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_LOGIN_SUCCESS,
            data,
          });

          browserHistory.replace('overview');
        },
        error => {
          let errorMessage;

          if (error.response) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else {
            errorMessage = 'An unknown error occurred.';
          }

          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_LOGIN_ERROR,
            error: errorMessage,
          });

          browserHistory.replace('login');
        },
      )
      .then(() => {
        return Promise.all([
          ClientActions.fetchSettings(),
          SettingsActions.fetchSettings(),
          FloodActions.restartActivityStream(),
        ]);
      }),

  createUser: credentials =>
    axios
      .put(`${baseURI}auth/users`, credentials)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_CREATE_USER_SUCCESS,
            data,
          });
        },
        error => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_CREATE_USER_ERROR,
            error: error.response.data.message,
          });
        },
      ),

  updateUser: (username, connectionSettings) => {
    const requestPayload = {};

    if (connectionSettings.connectionType === 'socket') {
      requestPayload.socketPath = connectionSettings.rtorrentSocketPath;
    } else {
      requestPayload.port = connectionSettings.rtorrentPort;
      requestPayload.host = connectionSettings.rtorrentHost;
    }

    return axios
      .patch(`${baseURI}auth/users/${encodeURIComponent(username)}`, requestPayload)
      .then((json = {}) => json.data);
  },

  deleteUser: username =>
    axios
      .delete(`${baseURI}auth/users/${encodeURIComponent(username)}`)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_DELETE_USER_SUCCESS,
            data: {
              username,
              ...data,
            },
          });
        },
        error => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_DELETE_USER_ERROR,
            error: {
              username,
              ...error,
            },
          });
        },
      ),

  fetchUsers: () =>
    axios
      .get(`${baseURI}auth/users`)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_LIST_USERS_SUCCESS,
            data,
          });
        },
        error => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_LIST_USERS_ERROR,
            error,
          });
        },
      ),

  logout: () =>
    axios.get(`${baseURI}auth/logout`).then(
      () => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LOGOUT_SUCCESS,
        });
      },
      error => {
        AppDispatcher.dispatchServerAction({
          type: ActionTypes.AUTH_LOGOUT_ERROR,
          error,
        });
      },
    ),

  register: credentials =>
    axios
      .post(`${baseURI}auth/register`, credentials)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_REGISTER_SUCCESS,
            data,
          });

          browserHistory.replace('overview');
        },
        error => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_REGISTER_ERROR,
            error: error.response.data.message,
          });
        },
      ),

  verify: () =>
    axios
      .get(`${baseURI}auth/verify?${Date.now()}`)
      .then((json = {}) => json.data)
      .then(
        data => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_VERIFY_SUCCESS,
            data,
          });

          return Promise.all([ClientActions.fetchSettings(), SettingsActions.fetchSettings()]).then(() => {
            if (data.initialUser) {
              browserHistory.replace('register');
            } else {
              browserHistory.replace('overview');
            }
          });
        },
        error => {
          AppDispatcher.dispatchServerAction({
            type: ActionTypes.AUTH_VERIFY_ERROR,
            error,
          });

          browserHistory.replace('login');
        },
      ),
};

export default AuthActions;
