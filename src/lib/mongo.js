import mongoose from 'mongoose';


const MONGO_URI = process.env.MONGO_URI || '';


if (!MONGO_URI) throw new Error('MONGO_URI env var not set');


let cached = global._mongo;


if (!cached) cached = global._mongo = { conn: null, promise: null };


export async function connectToMongo() {
if (cached.conn) return cached.conn;
if (!cached.promise) {
const opts = { bufferCommands: false };
cached.promise = mongoose.connect(MONGO_URI, opts).then((mongoose) => mongoose);
}
cached.conn = await cached.promise;
return cached.conn;
}