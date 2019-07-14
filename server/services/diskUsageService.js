/**
 * This service is not per rtorrent session, which is why it does not inherit
 * `BaseService` nor have any use of the per user API ie. `getSerivce()`
 */
const EventEmitter = require('events');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const diskUsageServiceEvents = require('../constants/diskUsageServiceEvents');

const diskUsage = {
//  linux: () => Promise.resolve([]),
  linux: () =>
    execFile('df --block-size=1 --type=ext4 --portability | tail -n+2', {
	    shell: true,
	    maxBuffer: 4096,
    }).then(({stdout}) =>
      stdout
        .trim()
        .split('\n')
        .map(disk => {
          const [, /* fs */ size, used, avail /* pcent */, , target] = disk.split(/\s+/);
          return {
            size: Number.parseInt(size, 10),
            used: Number.parseInt(used, 10),
            avail: Number.parseInt(avail, 10),
            target,
          };
        }),
    ),
  // win32
  // darwin
};

const INTERVAL_UPDATE = 10000;

class DiskUsageService extends EventEmitter {
  constructor() {
    super();
    this.disks = [];
    this.tLastChange = 0;
    this.interval = 0;

    if (process.platform !== 'linux') {
      console.log('warning: DiskUsageService is only supported in Linux');
      return;
    }

    // start polling disk usage when the first listener is added
    this.on('newListener', event => {
      if (
        this.listenerCount(diskUsageServiceEvents.DISK_USAGE_CHANGE) === 0 &&
        event === diskUsageServiceEvents.DISK_USAGE_CHANGE
      ) {
        this.updateInterval = setInterval(this.updateDisks.bind(this), INTERVAL_UPDATE);
      }
    });

    // stop polling disk usage when the last listener is removed
    this.on('removeListener', event => {
      if (
        this.listenerCount(diskUsageServiceEvents.DISK_USAGE_CHANGE) === 0 &&
        event === diskUsageServiceEvents.DISK_USAGE_CHANGE
      ) {
        clearInterval(this.updateInterval);
      }
    });
  }

  updateDisks() {
    return diskUsage[process.platform]().then(disks => {
      if (disks.length !== this.disks.length || disks.some((d, i) => d.used !== this.disks[i].used)) {
        this.tLastChange = Date.now();
        this.disks = disks;
        this.emit(diskUsageServiceEvents.DISK_USAGE_CHANGE, this.getDiskUsage());
      }
    });
  }

  getDiskUsage() {
    return {
      id: this.tLastChange,
      disks: this.disks,
    };
  }
}

module.exports = new DiskUsageService();
