#!/usr/bin/env node
import { MongoClient } from 'mongodb';

function maskUri(uri){
  if (!uri) return '';
  try{
    // simple mask for credentials
    return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:@\/]+)(:[^@]+)?@/, (m,p,user,pass) => {
      const u = user ? user : '****';
      return `${p}${u}:****@`;
    });
  }catch(e){
    return uri;
  }
}

const uri = process.env.MONGO_URI;
console.log('MONGO_URI present:', !!uri);
if (!uri){
  console.error('Missing MONGO_URI in environment. Set it in PowerShell with:\n$env:MONGO_URI = "mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/mydb?retryWrites=true&w=majority"');
  process.exit(1);
}

console.log('MONGO_URI (masked):', maskUri(uri));

if (!(uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))){
  console.error('MONGO_URI does not start with mongodb:// or mongodb+srv:// — please check the value.');
  process.exit(1);
}

(async function(){
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try{
    console.log('Attempting to connect (timeout 5s)...');
    await client.connect();
    console.log('CONNECTED OK');
    const r = await client.db().admin().ping();
    console.log('PING OK', r);
    await client.close();
    process.exit(0);
  }catch(err){
    console.error('CONNECT ERROR:');
    console.error(err && err.stack ? err.stack : err);
    try{ await client.close(); }catch(e){}
    process.exit(1);
  }
})();
