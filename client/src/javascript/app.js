import {IntlProvider} from 'react-intl';
import {IndexRoute, Router, Route, browserHistory} from 'react-router';
import React from 'react';
import ReactDOM from 'react-dom';

import * as i18n from './i18n/languages';
import connectStores from './util/connectStores';
import AppWrapper from './components/AppWrapper';
import EventTypes from './constants/EventTypes';
import FloodActions from './actions/FloodActions';
import Login from './components/views/Login';
import Register from './components/views/Register';
import SettingsStore from './stores/SettingsStore';
import TorrentClientOverview from './components/views/TorrentClientOverview';

import '../sass/style.scss';

const appRoutes = (
  <Router history={browserHistory}>
    <Route path="/" component={AppWrapper}>
      <IndexRoute component={Login} />
      <Route path="login" component={Login} />
      <Route path="register" component={Register} />
      <Route path="overview" component={TorrentClientOverview} />
      <Route path="*" component={Login} />
    </Route>
  </Router>
);

class FloodApp extends React.Component {
  componentDidMount() {
    FloodActions.startActivityStream();
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
      getValue: store => {
        return {
          locale: store.getFloodSettings('language'),
        };
      },
    },
  ];
});

ReactDOM.render(<ConnectedFloodApp />, document.getElementById('app'));
