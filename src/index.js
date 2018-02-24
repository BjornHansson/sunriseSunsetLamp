import Arduino from 'johnny-five';
import SunCalc from 'suncalc';
import Schedule from 'node-schedule';
import debug from 'debug';

const log = debug('lamp');
const board = new Arduino.Board();

// Malmö (approximately)
const latitude = 55.604981;
const longitude = 13.003822;

// TODO: Run again every new day and initiate correctly
function init(led) {
  led.color('blue');
  led.on();

  const sunCalc = SunCalc.getTimes(new Date(), latitude, longitude);

  Schedule.scheduleJob(sunCalc.dawn, () => {
    log('switched to dawn');
    led.color('red');
  });
  Schedule.scheduleJob(sunCalc.sunriseEnd, () => {
    log('switched to sunrise end');
    led.color('blue');
  });
  Schedule.scheduleJob(sunCalc.sunsetStart, () => {
    log('switched to sunset start');
    led.color('red');
  });
  Schedule.scheduleJob(sunCalc.night, () => {
    log('switched to night');
    led.color('green');
  });
}

board.on('ready', () => {
  const led = new Arduino.Led.RGB({
    pins: {
      red: 9,
      green: 10,
      blue: 11,
    },
  });

  led.intensity(100);
  init(led);
});
