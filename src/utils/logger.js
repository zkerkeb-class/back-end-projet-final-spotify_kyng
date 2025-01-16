const pino = require('pino');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Adds color to the output
      translateTime: 'SYS:standard', // Formats the timestamp
      ignore: 'pid,hostname' // Hides unnecessary fields
    }
  }
});

module.exports = logger;

