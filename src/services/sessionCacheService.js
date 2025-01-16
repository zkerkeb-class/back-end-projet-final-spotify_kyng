const redisClient = require('../config/redis');

const setSession = async (token, sessionData, expiration = 3600) => {
  const redisKey = `user_session:${token}`;
  await redisClient.set(redisKey, JSON.stringify(sessionData), 'EX', expiration);
};

const getSession = async (token) => {
  const redisKey = `user_session:${token}`;
  const session = await redisClient.get(redisKey);
  return session ? JSON.parse(session) : null;
};

const deleteSession = async (token) => {
  const redisKey = `user_session:${token}`;
  return await redisClient.del(redisKey);
};

const sessionExists = async (token) => {
  const redisKey = `user_session:${token}`;
  const exists = await redisClient.exists(redisKey);
  return exists === 1;
};

module.exports = { setSession, getSession, deleteSession, sessionExists };
