import { MongoClient } from 'mongodb';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '27017';
const dbDB = process.env.DB_DATABASE || 'files_manager';

class DBClient {
  constructor() {
    const uri = `mongodb://${dbHost}:${dbPort}/${dbDB}`;

    this.client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    this.client.connect().then(() => {
      console.log('Connected successfully to MongoDB server');
    }).catch((error) => {
      console.error('Failed to connect to MongoDB:', error.message);
    });

    this.db = this.client.db(dbDB);
  }

  isAlive() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  async nbUsers() {
    try {
      const usersCollection = this.db.collection('users');
      return await usersCollection.countDocuments();
    } catch (error) {
      console.error('Failed to retrieve users count:', error.message);
      return 0;
    }
  }

  async nbFiles() {
    try {
      const filesCollection = this.db.collection('files');
      return await filesCollection.countDocuments();
    } catch (error) {
      console.error('Failed to retrieve files count:', error.message);
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
