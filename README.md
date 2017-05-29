# Flood
[![Talk about Flood on Slack](https://join-flood-talk.herokuapp.com/badge.svg)](https://join-flood-talk.herokuapp.com/)

Flood is another web interface for [rtorrent](https://github.com/rakshasa/rtorrent). It implements a Node.js server for communicating with the rTorrent API, storing historical data, and serving the web UI.

It's a work-in-progress, and it might not have all of the features you want (yet). However, new features are added frequently. Feel free to file an issue and I'll try to prioritize your feature requests.

#### Feedback
If you have a specific issue or bug, please file a Github issue. If you want to participate in discussions about Flood's future, please join the [Flood Slack team](https://flood-talk.slack.com) ([get an instant invite first](https://join-flood-talk.herokuapp.com/)).

# Usage
#### Pre-Requisites
1. [rTorrent](https://github.com/rakshasa/rtorrent) needs to be installed __with XMLRPC__ configuration. _If you are currently using a web UI for rTorrent, you've already done this._
  * For Linux & OS X, check out [rTorrent's installation wiki](https://github.com/rakshasa/rtorrent/wiki/Installing#compilation-help) and/or [this third-party tutorial](https://jes.sc/kb/rTorrent+ruTorrent-Seedbox-Guide.php#Install-Dependencies). When you run `./configure`, be sure to run with the `--with-xmlrpc-c` flag.
  * For Windows, try [this guide](https://rtwi.jmk.hu/wiki/rTorrentOnWindows) (I haven't tested this, let me know if you have problems).
2. Install NodeJS version `6.9.x`:
  * I recommend managing different Node versions with [nvm](https://github.com/creationix/nvm) or [n](https://github.com/tj/n).

#### Installing

1. Check you are in your home directory: `cd ~`.
2. Copy the flood git repository: `git clone https://github.com/jfurrow/flood flood`.
3. Go inside the flood repository before configuring: `cd ~/flood`.

#### Configuring
1. Copy `config.template.js` to `config.js`. This is required.
2. Set your rTorrent SCGI hostname and port in `config.js`. Defaults are `localhost` and `5000`.
  * If you want to use a socket, change `socket` to true and set `socketPath` to the absolute file path of your rTorrent socket. Make sure Flood has read/write access. Specify the socket path in `.rtorrent.rc`. Example: `scgi_local = /Users/flood/rtorrent.sock`
  * If you wish to access an rTorrent instance running on a separate host from Flood (or in a Docker container), allow for incoming connections from external IPs by setting the host in `scgi_port` to `0.0.0.0` in `.rtorrent.rc`. Example: `scgi_port = 0.0.0.0:5000`
3. Create a long, unique secret (used to sign [JWT auth tokens](https://github.com/auth0/node-jsonwebtoken)) in `config.js`.
4. If you're proxying Flood to a path other than the root of the host, you must specify the `baseURI` in `config.js`. All request URIs will be prefixed with this value.
  * For example, if hosting Flood from `https://foo.bar/apps/flood`, you would set `baseURI` to `/apps/flood`. If hosting flood from `https://foo.bar`, you do not need to configure `baseURI`.

#### Starting the Server

1. Run `npm install --production` (only the first time when installing).
2. Run `npm run start:production`.
3. Access the UI in your browser. Defaults to `localhost:3000`.
  * You may change the default port in `config.js`.
4. Upon loading the UI the first time, you will be prompted to create a user account.

#### Updating
1. To update, run `git pull` in this repository's directory.
2. Check `config.template.js` for configuration changes that you may wish to incoporate in your `config.js`.
3. Kill the running Node server.
4. Run `npm install --production` to update dependencies.
5. Restart it with `npm start`.

#### Tips
* I run the web server with `screen` to keep the web server running independently of the terminal session.
* Ubuntu users will need to install `nodejs-legacy` (`sudo apt-get install nodejs-legacy`) for dependencies to install successfully. You can read more on [this Stack Overflow post](http://stackoverflow.com/questions/21168141/cannot-install-packages-using-node-package-manager-in-ubuntu).

#### Local Development
1. Run `npm install`.
2. Run `npm run start:development` and `npm run start:watch` in separate terminal instances.
  * `npm run start:development` uses [nodemon](https://github.com/remy/nodemon) to watch for changes to the server-side JavaScript.
  * `npm run start:watch` watches for changes in the client-side source.
3. Access the UI through the [browser-sync](https://www.browsersync.io/) proxy at [localhost:4200](http://localhost:4200).

#### Running with Docker
1. `docker build -t rtorrent-flood .`
2. `docker run --name rtorrent-flood -e RTORRENT_SCGI_HOST=w.x.y.z -p 3000:3000 rtorrent-flood`
3. Other supported environment variables:
  * `FLOOD_BASE_URI`
  * `FLOOD_SECRET`
  * `RTORRENT_SCGI_HOST`
  * `RTORRENT_SCGI_PORT`
  * `RTORRENT_SOCK`
  * `FLOOD_ENABLE_SSL`

The docker container includes a volume at `/data`, which is where the database will be located.  Additionally, you can place your SSL files there, `/data/flood_ssl.key` and `/data/flood_ssl.cert`. Set `FLOOD_ENABLE_SSL` to `true` to enable their use if present. Additionally, a local rtorrent socket file located at `/data/rtorrent.sock` can be used if `RTORRENT_SOCK` is set to `true`.

# Screenshots
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-a.png)
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-b.png)
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-c.png)
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-d.png)
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-e.png)
![](https://s3.amazonaws.com/johnfurrow.com/share/flood-screenshots-f.png)
