import { Router } from 'react-router-dom'
import {FormattedMessage, IntlProvider} from 'react-intl';
import {Route} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';

import * as i18n from './i18n/languages';
import connectStores from './util/connectStores';
import AppWrapper from './components/AppWrapper';
import AuthActions from './actions/AuthActions';
import EventTypes from './constants/EventTypes';
import FloodActions from './actions/FloodActions';
import history from './util/history';
import Login from './components/views/Login';
import Register from './components/views/Register';
import SettingsStore from './stores/SettingsStore';
import TorrentClientOverview from './components/views/TorrentClientOverview';
import UIStore from './stores/UIStore';

import '../sass/style.scss';

const initialize = () => {
  UIStore.registerDependency({
    id: 'notifications',
    message: <FormattedMessage id="dependency.loading.notifications" defaultMessage="Notifications" />,
  });

  UIStore.registerDependency({
    id: 'torrent-taxonomy',
    message: <FormattedMessage id="dependency.loading.torrent.taxonomy" defaultMessage="Torrent Taxonomy" />,
  });

  UIStore.registerDependency([
    {
      id: 'transfer-data',
      message: (
        <FormattedMessage id="dependency.loading.transfer.rate.details" defaultMessage="Data Transfer Rate Details" />
      ),
    },
    {
      id: 'transfer-history',
      message: <FormattedMessage id="dependency.loading.transfer.history" defaultMessage="Data Transfer History" />,
    },
  ]);

  UIStore.registerDependency({
    id: 'torrent-list',
    message: <FormattedMessage id="dependency.loading.torrent.list" defaultMessage="Torrent List" />,
  });

  AuthActions.verify().then(
    ({initialUser}) => {
      if (initialUser) {
        history.replace('register');
      } else {
        history.replace('overview');
      }
    },
    () => {
      history.replace('login');
    },
  );

  FloodActions.startActivityStream();
};

const appRoutes = (
  <Router history={history}>
    <AppWrapper>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/overview" component={TorrentClientOverview} />
    </AppWrapper>
  </Router>
);

class FloodApp extends React.Component {
  componentDidMount() {
    initialize();
  }

  render() {
    const {locale} = this.props;

    return (
      // eslint-disable-next-line import/namespace
      <IntlProvider locale={locale} messages={i18n[locale]}>
        {appRoutes}
      </IntlProvider>
    );
  }
}

const ConnectedFloodApp = connectStores(FloodApp, () => {
  return [
    {
      store: SettingsStore,
      event: EventTypes.SETTINGS_CHANGE,
      getValue: ({store}) => {
        return {
          locale: store.getFloodSettings('language'),
        };
      },
    },
  ];
});

ReactDOM.render(<ConnectedFloodApp />, document.getElementById('app'));
