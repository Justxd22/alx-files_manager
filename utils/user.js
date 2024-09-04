import redisClient from './redis';
import dbClient from './db';

const userUtils = {
    async getUser(query) {
      const user = dbClient.db.collection('users').findOne(query);
      return user;
    },
  };
  
  export default userUtils;