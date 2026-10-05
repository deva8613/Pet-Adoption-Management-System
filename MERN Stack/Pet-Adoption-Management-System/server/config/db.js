import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pet_adoption_management';
const dbName = process.env.MONGO_DB_NAME || 'pet_adoption_management';

let clientInstance = null;
let dbInstance = null;

export const connectDB = async () => {
  if (dbInstance) return dbInstance;

  try {
    clientInstance = new MongoClient(mongoUri);
    await clientInstance.connect();
    dbInstance = clientInstance.db(dbName);

    await Promise.all([
      dbInstance.collection('users').createIndex({ email: 1 }, { unique: true }),
      dbInstance.collection('pets').createIndex({ ownerId: 1 }),
      dbInstance.collection('pets').createIndex({ adoptionStatus: 1 }),
      dbInstance.collection('pets').createIndex({ species: 1 }),
      dbInstance.collection('pets').createIndex({ breed: 1 }),
      dbInstance.collection('adoptionapplications').createIndex({ petId: 1 }),
      dbInstance.collection('adoptionapplications').createIndex({ applicantId: 1 }),
      dbInstance.collection('adoptionapplications').createIndex({ ownerId: 1 }),
      dbInstance.collection('adoptionapplications').createIndex({ applicationStatus: 1 }),
      dbInstance.collection('favorites').createIndex({ userId: 1, petId: 1 }, { unique: true }),
      dbInstance.collection('notifications').createIndex({ userId: 1, createdAt: -1 })
    ]);

    console.log(`[MongoDB] Connected to ${dbName}`);
    console.log('[MongoDB] Collections/indexes ready. No sample data was inserted.');
    return dbInstance;
  } catch (error) {
    console.error('[MongoDB] Connection failure:', error.message);
    process.exit(1);
  }
};

export const getDB = () => {
  if (!dbInstance) throw new Error('Database not initialized. Call connectDB first.');
  return dbInstance;
};

export const closeDB = async () => {
  if (clientInstance) {
    await clientInstance.close();
    clientInstance = null;
    dbInstance = null;
    console.log('[MongoDB] Connection closed.');
  }
};
