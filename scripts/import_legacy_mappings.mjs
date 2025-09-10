import 'dotenv/config';
import '../server/db.js';
import fs from 'fs/promises';
import { MongoClient } from 'mongodb';

(async()=>{
  const uri = process.env.MONGO_URI;
  if(!uri) throw new Error('MONGO_URI not set');
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGO_DB || 'aytekdb');
  const coll = db.collection('legacy_ids');
  try{
    // Read known tmp mapping files
    const files = [
      './tmp_image_report.json',
      './tmp_products_colors_backup.json',
      './tmp_products_backup.json'
    ];
    const mappings = new Map();
    for(const f of files){
      try{
        const txt = await fs.readFile(f,'utf8');
        const data = JSON.parse(txt);
        if(Array.isArray(data)){
          for(const item of data){
            if(item._id && item.product_id){
              mappings.set(String(item._id), String(item.product_id));
            }else if(item._id && item.images && item.images.length){
              // some reports only contain images with url or meta; try to find product_id nearby
              if(item.product_id) mappings.set(String(item._id), String(item.product_id));
            }
          }
        }else if(typeof data === 'object'){
          // object map
          for(const [k,v] of Object.entries(data)){
            mappings.set(String(k), String(v));
          }
        }
      }catch(e){ /* ignore missing files */ }
    }

    if(mappings.size === 0){
      console.log('No mappings found in tmp files.');
      process.exit(0);
    }

    // Prepare bulk upserts idempotently
    const ops = [];
    for(const [legacy, pid] of mappings.entries()){
      ops.push({
        updateOne: {
          filter: { legacy_id: legacy },
          update: { $set: { legacy_id: legacy, product_id: pid } },
          upsert: true
        }
      });
    }
    console.log('Found mappings:', mappings.size);
    const result = await coll.bulkWrite(ops, { ordered: false });
    console.log('BulkWrite result:', result.result || result);
  }finally{
    await client.close();
  }
  process.exit(0);
})();
