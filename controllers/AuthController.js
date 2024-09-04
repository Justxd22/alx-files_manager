import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';

class AuthController {
    static async getConnect(req, res) {
    const token = req.get('Authorization')
    console.log(token, "TOKKKK")
    if (!token){
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const base64Token = token.slice(6).trim();
    const decodedString = Buffer.from(base64Token, 'base64').toString('utf-8');
    const [email, password] = decodedString.split(':');
    console.log(email, password);
    // res.status(200).json(status);

    const usersCollection = dbClient.db.collection('users');
    const existingUser = await usersCollection.findOne({ email });

    if (!existingUser) {
      return res.status(400).json({ error: 'No user found' });
    }

    if (!sha1(password) == existingUser.password){
      return res.status(400).json({ error: 'Wrong Password!' });
    }
    const tok = uuidv4()
    const key = `auth_${tok}`
    await redisClient.set(key, existingUser._id.toString(), 3600 * 24);
    return res.status(200).json({ token: tok });

  }

  static async getDisconnect(req, res) {
    const token = req.get('X-Token')
    if (!token){
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const key = `auth_${token}`
    const exist = await redisClient.get(key);
    if (!exist){
        return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(key)
    return res.status(204).send('Disconnected');

  }

}

export default AuthController;
