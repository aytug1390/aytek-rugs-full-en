import 'dotenv/config';
import '../server/db.js';
import Product from '../server/models/Product.js';

async function run(){
  console.log('Running duplicate SKU check (numeric normalization)...');

  // Aggregate: convert product_id to double when possible, group by that numeric value,
  // collect distinct original product_id strings/values. If a group has >1 distinct original
  // ids, it's a duplicate cluster (covers "10001" vs "10001.0" and Number vs String).
  const pipeline = [
    {
      $project: {
        product_id: 1,
        pid_num: { $convert: { input: '$product_id', to: 'double', onError: null, onNull: null } }
      }
    },
    { $match: { pid_num: { $ne: null } } },
    { $group: { _id: '$pid_num', ids: { $addToSet: '$product_id' }, docs: { $push: '$_id' }, count: { $sum: 1 } } },
    { $match: { $expr: { $gt: [ { $size: '$ids' }, 1 ] } } },
    { $project: { numeric: '$_id', ids: 1, count: 1 } },
    { $sort: { count: -1, numeric: 1 } }
  ];

  const results = await Product.aggregate(pipeline);

  const groups = results.length;
  const totalDocs = results.reduce((s, g) => s + g.count, 0);
  const duplicateExtra = totalDocs - groups; // number of extra docs beyond one-per-group

  console.log(`groups_with_multiple_ids: ${groups}`);
  console.log(`total_docs_in_these_groups: ${totalDocs}`);
  console.log(`duplicate_extra_count (total - groups): ${duplicateExtra}`);

  console.log('SAMPLE (first 20 groups):');
  results.slice(0,20).forEach(g => {
    console.log(JSON.stringify({ numeric: g.numeric, count: g.count, ids: g.ids }, null, 2));
  });

  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
