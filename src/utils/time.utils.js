const dateTime = require('date-and-time');
const timePattern = dateTime.compile("mm:ss.SS");
const zeroTime = dateTime.parse("00:00.00", timePattern);

const toMilliseconds = function(timeString) {
    if (timeString === '')
        return 0;
    return dateTime.subtract(toTimeObject(timeString), zeroTime).toMilliseconds()
}
const fromMilliseconds = function(ms) {
    if (isNaN(ms))
        return '';
    return dateTime.format(dateTime.addMilliseconds(zeroTime, ms), timePattern);
}
const toTimeObject = function(timeString) {
    let time = dateTime.parse(timeString, timePattern);
    return isNaN(time) ? zeroTime : time;
}


module.exports = {
    fromMilliseconds: fromMilliseconds,
    toTimeObject: toTimeObject,
    toMilliseconds: toMilliseconds
};