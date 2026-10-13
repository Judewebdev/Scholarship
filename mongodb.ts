import { MongoClient, type Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  // Deliberately defer the error until a database route is used, so the UI can boot and explain setup.
}

type MongoCache = { client: MongoClient | null; promise: Promise<MongoClient> | null };
const globalForMongo = globalThis as typeof globalThis & { mongoCache?: MongoCache };
const cache: MongoCache = globalForMongo.mongoCache ?? { client: null, promise: null };
if (!globalForMongo.mongoCache) globalForMongo.mongoCache = cache;

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error('MONGODB_URI is missing. Add it to .env.local to enable saving profiles and opportunities.');
  if (!cache.promise) {
    const client = new MongoClient(uri);
    cache.promise = client.connect().then((connected) => {
      cache.client = connected;
      return connected;
    });
  }
  const client = await cache.promise;
  return client.db(process.env.MONGODB_DB || 'scholarship_agent');
}
