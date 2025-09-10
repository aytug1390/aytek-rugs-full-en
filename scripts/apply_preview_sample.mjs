import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: './.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI not found'); process.exit(1); }

async function run(){
  const previewPath = path.join(process.cwd(),'tmp','cappadocia_update_ops_preview.json');
  const txt = await fs.readFile(previewPath,'utf8');
  const ops = JSON.parse(txt);
  if(!Array.isArray(ops) || ops.length===0){ console.error('No ops in preview'); process.exit(1); }
  const sample = ops.slice(0,2);

  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex: false });
  const coll = mongoose.connection.db.collection('products');

  const backup = [];
  const applied = [];
  for(const op of sample){
    const id = op._id;
    const doc = await coll.findOne({ _id: new mongoose.Types.ObjectId(id) });
    if(!doc){ console.warn('Doc not found for _id', id); continue; }
    backup.push(doc);

    // apply update
    const set = op.set || {};
    const res = await coll.updateOne({ _id: doc._id }, { $set: set });
    applied.push({ _id: id, product_id: op.product_id, matched: res.matchedCount, modified: res.modifiedCount });
    console.log('Applied to', id, 'product_id', op.product_id, 'modified:', res.modifiedCount);
  }

  const outDir = path.join(process.cwd(),'tmp');
  await fs.mkdir(outDir,{recursive:true});
  const backupPath = path.join(outDir,'pre_update_backup_sample.json');
  await fs.writeFile(backupPath, JSON.stringify(backup,null,2),'utf8');
  console.log('Wrote sample backup to', backupPath);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(err=>{ console.error('Error:', err); process.exit(2); });
