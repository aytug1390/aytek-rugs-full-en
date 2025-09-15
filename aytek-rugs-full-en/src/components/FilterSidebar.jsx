export default function FilterSidebar(props) {
  // Legacy sidebar disabled in favor of unified FiltersPanel.
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Inform developers in console that the old sidebar is disabled.
    // Use FiltersPanel (src/components/FiltersPanel.tsx) instead.
     
    console.info('FilterSidebar disabled — use FiltersPanel (src/components/FiltersPanel.tsx) and app/all-rugs/Filters.client.tsx for filtering.');
  }
  return null;
}

