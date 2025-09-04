import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

// Fallback + default seed set if DB empty
export const FILE_MENU_VERSION = 3;
export const DEFAULT_MENU = [
  { href: '/', label: 'Home', order: 0, active: true },
  { href: '/rugs', label: 'All Rugs', order: 1, active: true },
  { href: '/categories', label: 'Categories', order: 1.5, active: true },
  { href: '/services', label: 'Services', order: 2, active: true },
  { href: '/services/rug-cleaning', label: 'Rug Cleaning', order: 3, active: true },
  { href: '/services/rug-repair', label: 'Rug Repair', order: 4, active: true },
  { href: '/trade-in', label: 'Trade-In', order: 5, active: true },
  { href: '/try-at-home', label: 'Try At Home', order: 6, active: true },
  { href: '/references', label: 'References', order: 7, active: true },
  { href: '/designers', label: 'For Designers', order: 8, active: true },
  { href: '/about', label: 'About Us', order: 9, active: true },
  { href: '/contact', label: 'Contact', order: 10, active: true },
];

import { dbConnect } from '../lib/db';
import MenuItem from '../models/MenuItem';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  let items = DEFAULT_MENU;
  try {
    await dbConnect();
    const docs = await MenuItem.find().sort({ order: 1 }).lean();
    // menuVersion kontrolü
    const dbVersion = docs && docs.length > 0 && docs[0].menuVersion ? docs[0].menuVersion : 1;
    if (dbVersion < FILE_MENU_VERSION) {
      // DB'yi dosyadaki menüyle migrate et
      await MenuItem.deleteMany({});
      await MenuItem.insertMany(DEFAULT_MENU.map(item => ({ ...item, menuVersion: FILE_MENU_VERSION })));
      items = DEFAULT_MENU;
    } else if (docs?.length) {
      items = docs.map(d => ({
        href: d.href,
        label: d.label,
        order: d.order ?? 0,
        active: d.active !== false,
        roles: Array.isArray(d.roles) ? d.roles : [],
        menuVersion: d.menuVersion ?? 1
      }));
    } else {
      // Seed once if empty
      try {
        await MenuItem.insertMany(DEFAULT_MENU.map(item => ({ ...item, menuVersion: FILE_MENU_VERSION })));
      } catch (_) {}
    }
  } catch (e) {
    // silent fallback
  }
  return <NavbarClient items={items} />;
}

