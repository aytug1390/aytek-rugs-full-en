// menuLoader.ts
import DEFAULT_MENU from './components/NavbarDefaultMenu';
import MenuItem from './models/MenuItem';

export async function loadMenu() {
  const prefer = process.env.MENU_SOURCE ?? 'auto'; // 'auto' | 'db' | 'file'
  if (prefer === 'db') {
    return await readDbMenu();
  }
  if (prefer === 'file') {
    return DEFAULT_MENU;
  }
  const dbMenu = await readDbMenu();
  return dbMenu?.length ? dbMenu : DEFAULT_MENU;
}

async function readDbMenu() {
  try {
    const docs = await MenuItem.find().sort({ order: 1 }).lean();
    return docs.map(d => ({
      href: d.href,
      label: d.label,
      order: d.order ?? 0,
      active: d.active !== false,
      roles: Array.isArray(d.roles) ? d.roles : []
    }));
  } catch (e) {
    return [];
  }
}
