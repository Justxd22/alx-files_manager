import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

const userUtils = {
  async getUser(query) {
    const user = dbClient.db.collection('users').findOne(query);
    return user;
  },
  async setUser(query) {
    const user = dbClient.db.collection('users').insertOne(query);
    return user;
  },
  async getUserFromReq(req) {
    const token = req.get('X-Token');
    if (!token) {
      return null;
    }
    const key = `auth_${token}`;
    const exist = await redisClient.get(key);
    if (!exist) {
      return null;
    }

    const user = dbClient.db.collection('users').findOne({ _id: ObjectId(exist) });
    return user;
  },
};

export default userUtils;
