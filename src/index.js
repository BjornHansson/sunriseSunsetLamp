import Arduino from 'johnny-five';
import SunCalc from 'suncalc';
import Schedule from 'node-schedule';
import Debug from 'debug';

const log = Debug('lamp');
const board = new Arduino.Board();

// Malmö (approximately)
const latitude = 55.604981;
const longitude = 13.003822;

function startupColor(today, sunCalc, led) {
  if (
    // Day
    today.getTime() > sunCalc.sunriseEnd.getTime() &&
    today.getTime() < sunCalc.sunsetStart.getTime()
  ) {
    led.color('blue');
  } else if (
    // Sunrise/sunset
    (today.getTime() > sunCalc.dawn.getTime() &&
    today.getTime() < sunCalc.sunriseEnd.getTime()) ||
    (today.getTime() > sunCalc.sunsetStart.getTime() &&
    today.getTime() < sunCalc.night.getTime())
  ) {
    led.color('red');
  } else {
    // Night
    led.color('green');
  }
}

function scheduleJobs(sunCalc, led) {
  const jobs = [];

  jobs.push(Schedule.scheduleJob(sunCalc.dawn, () => {
    log('switched to dawn');
    led.color('red');
  }));
  jobs.push(Schedule.scheduleJob(sunCalc.sunriseEnd, () => {
    log('switched to sunrise end');
    led.color('blue');
  }));
  jobs.push(Schedule.scheduleJob(sunCalc.sunsetStart, () => {
    log('switched to sunset start');
    led.color('red');
  }));
  jobs.push(Schedule.scheduleJob(sunCalc.night, () => {
    log('switched to night');
    led.color('green');
  }));
  jobs.push(Schedule.scheduleJob(sunCalc.nightEnd, () => {
    jobs.forEach(job => job.cancel());
    scheduleJobs(SunCalc.getTimes(new Date(), latitude, longitude), led);
  }));
  log('scheduled %d jobs', jobs.length);
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
  const today = new Date();
  log(today);
  const sunCalc = SunCalc.getTimes(new Date(), latitude, longitude);
  log(sunCalc);

  startupColor(today, sunCalc, led);
  scheduleJobs(sunCalc, led);

  led.on();
});
