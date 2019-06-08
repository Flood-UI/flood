/**
 * This service is not per rtorrent session, which is why it does not inherit
 * `BaseService` nor have any use of the per user API ie. `getSerivce()`
 */
const EventEmitter = require('events');
const diskUsageServiceEvents = require('../constants/diskUsageServiceEvents');
const util = require('util')
const exec = util.promisify(require('child_process').exec)

const diskUsage = {
  linux: () => exec('df --block-size=1 --type=ext4 --portability | tail -n+2').then(
    ({stdout}) => stdout.trim().split('\n').map(disk => {
      const [fs, size, used, avail, pcent, target] = disk.split(/\s+/);
      return {
        size: Number.parseInt(size),
        used: Number.parseInt(used),
        avail: Number.parseInt(avail),
        target
      };
    })),
  // win32
  // darwin
}

const INTERVAL_UPDATE = 10000

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

    this.interval = setInterval(this.updateDisks.bind(this), INTERVAL_UPDATE);
  }

  updateDisks() {
    return diskUsage[process.platform]().then(disks => {
      if (disks.length !== this.disks.length ||
          disks.some((d, i) => d.used !== this.disks[i].used)) {
        this.tLastChange = Date.now();
        this.disks = disks;
        this.emit(diskUsageServiceEvents.DISK_USAGE_CHANGE, this.getDiskUsage())
      }
    });
  }

  getDiskUsage() {
    return {
      id: this.tLastChange,
      disks: this.disks
    };
  }

  destroy() {
    clearInterval(this.interval);
  }
}

module.exports = DiskUsageService
