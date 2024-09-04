import dbClient from './db';

const userUtils = {
  async getUser(query) {
    const user = dbClient.db.collection('users').findOne(query);
    return user;
  },
  async setUser(query) {
    const user = dbClient.db.collection('users').insertOne(query);
    return user;
  },
};

export default userUtils;
