// Google Apps Script: Drive'daki SKU klasörlerinden toplu görsel CSV export
// Klasör adı = SKU, her klasördeki görsellerin linkleri ve ana görseli CSV'ye dökülür

function exportImagesBySkuFolders() {
  const PARENT_FOLDER_ID = '1E7jubQVgGhYfEjfHaGlkx0CvDSBj8D4_'; // tüm ürün klasörlerinin üst klasörü
  const parent = DriveApp.getFolderById(PARENT_FOLDER_ID);
  const out = [['product_id','main_image','images']];
  const folders = parent.getFolders();

  while (folders.hasNext()) {
    const f = folders.next();
    const sku = f.getName().trim(); // klasör adı = SKU
    const files = [];
    const fit = f.getFiles();
    while (fit.hasNext()) {
      const file = fit.next();
      const name = file.getName().toLowerCase();
      if (!name.match(/\.(jpg|jpeg|png|webp|avif)$/)) continue;
      const id = file.getId();
      files.push({ name, url: 'https://drive.google.com/uc?export=view&id=' + id });
    }
    if (!files.length) continue;

    files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
    const main = files.find(x=>/main|cover/.test(x.name))
              || files.find(x=>/(^|[^0-9])0?1([^0-9]|$)/.test(x.name))
              || files[0];
    const others = files.filter(x=>x!==main).map(x=>x.url).join('|');
    out.push([sku, main.url, others]);
  }

  const csv = out.map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  const file = Utilities.newBlob(csv, 'text/csv', 'drive_image_map.csv');
  DriveApp.createFile(file);
}
