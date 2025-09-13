const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: 'C:/proje-aytek-rugs/aytek-rugs-full-en/.env.local' });
const uri = process.env.MONGO_URI;
if(!uri){ console.error('MONGO_URI missing'); process.exit(1); }
(async ()=>{
  try{
    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined, autoIndex:false });
    const coll = mongoose.connection.db.collection('products');
    const q = { $or: [ { title: { $regex: 'Cappadocia', $options: 'i' } }, { description: { $regex: 'Cappadocia', $options: 'i' } } ] };
    const docs = await coll.find(q).limit(100).toArray();
    const out = docs.map(d=>({ _id: d._id.toString(), product_id: String(d.product_id||''), title:d.title||'', image_alt: (d.images&&d.images[0]&&d.images[0].alt)||'', image_url: (d.images&&d.images[0]&&d.images[0].url)||'' }));
    fs.writeFileSync('C:/proje-aytek-rugs/tmp/cappadocia_query.json', JSON.stringify({count: out.length, items: out}, null, 2));
    console.log('Wrote tmp/cappadocia_query.json with', out.length, 'items');
    await mongoose.disconnect();
  }catch(e){ console.error('Error', e); process.exit(2); }
})();
