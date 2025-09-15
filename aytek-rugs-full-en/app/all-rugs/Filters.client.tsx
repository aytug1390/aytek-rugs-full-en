"use client";
import React from 'react';
// Try to use the existing FiltersPanel from src/components if present.
// Declare as a React component type so TypeScript understands the runtime shape.
let FiltersPanel: React.ComponentType<any>;
try {
  // Use require to avoid static import failure when the module isn't present.
  // The `.default` may be undefined if the module exports differently; coerce to a component type.
  // @ts-ignore - dynamic require may not be statically analyzable
  FiltersPanel = require('../../src/components/FiltersPanel').default;
} catch (e) {
  // fallback: simple placeholder component
  FiltersPanel = function PlaceholderFilters() {
    return <div className="mb-4 text-sm text-gray-500">(Filters temporarily unavailable)</div>;
  };
}

export default function FiltersClient(props: any) {
  const Component = FiltersPanel;
  return <Component {...props} />;
}
