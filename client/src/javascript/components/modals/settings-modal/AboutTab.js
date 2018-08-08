import {injectIntl} from 'react-intl';
import React from 'react';

import SettingsTab from './SettingsTab';

class AboutTab extends SettingsTab {
  render() {
    return (
      <div>
        <p>
            <img alt="Flood Logo" src="data:image/png;base64,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"/>
            <br/>
            Flood is another web interface for <a href="https://nullrefer.com/?https://github.com/rakshasa/rtorrent" rel="noopener noreferrer" target="_blank">rtorrent</a>. It implements a Node.js server for communicating with the rTorrent API, storing historical data, and serving the web UI.
            <br/>
            <br/>
            <strong>Links</strong>
            <br/>
            Source code at <a href="https://nullrefer.com/?https://github.com/jfurrow/flood" rel="noopener noreferrer" target="_blank">GitHub</a>.
            <br/>
            Join our <a href="https://nullrefer.com/?https://discord.gg/Z7yR5Uf" rel="noopener noreferrer" target="_blank">Discord server</a>.
        </p>
      </div>
    );
  }
}

export default injectIntl(AboutTab);
