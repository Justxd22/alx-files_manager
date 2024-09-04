import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { ObjectId } from 'mongodb';
import userUtils from '../utils/user';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    const existingUser = await userUtils.getUser({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    const hashedPassword = sha1(password);
    const result = await usersCollection.insertOne({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      id: result.insertedId,
      email,
    });
  }

  static async getMe(req, res) {
    const token = req.get('X-Token')
    if (!token){
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`
    const exist = await redisClient.get(key);
    if (!exist){
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingUser = await userUtils.getUser({ _id: ObjectId(exist), });
    if (!existingUser){
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.status(200).json({ id: exist , email: existingUser.email});

  }
}

export default UsersController;
