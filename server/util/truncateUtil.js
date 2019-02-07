const truncateUtil = function(num, fixed = null) {
  var re = new RegExp('^-?\\d+(?:\\.\\d{0,' + (fixed || -1) + '})?');
  return num.toString().match(re)[0];
};

module.exports = truncateUtil;
