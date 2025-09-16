import { useState } from "react";

export default function FilterSidebar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    rugIds: "",
    size: [],
    design: [],
    color: [],
    collection: [],
    age: [],
    origin: [],
    material: [],
    stock: [],
    minPrice: "",
    maxPrice: "",
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const CheckboxGroup = ({ field, options }) => (
    <div className="mt-2 space-y-1">
      {options.map((opt) => (
        <label key={opt} className="block">
          <input
            type="checkbox"
            onChange={(e) => {
              const val = e.target.checked
                ? [...filters[field], opt]
                : filters[field].filter((x) => x !== opt);
              handleChange(field, val);
            }}
          />{" "}
          {opt}
        </label>
      ))}
    </div>
  );

  return (
    <aside className="w-64 bg-white shadow p-4 space-y-4">
      {/* Search Rug# */}
      <div>
        <h3 className="font-bold mb-2">Search Rug#</h3>
        <textarea
          placeholder="Enter up to 25 IDs, separated by commas"
          value={filters.rugIds}
          onChange={(e) => handleChange("rugIds", e.target.value)}
          className="w-full border rounded p-2 mb-2"
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded">
          Find Rugs
        </button>
      </div>

      {/* Size */}
      <details>
        <summary className="cursor-pointer font-semibold">Size</summary>
        <CheckboxGroup
          field="size"
          options={["Small (up to 5x8)", "Medium (6x9)", "Large (8x10+)", "Oversize"]}
        />
      </details>

      {/* Design */}
      <details>
        <summary className="cursor-pointer font-semibold">Design</summary>
        <CheckboxGroup
          field="design"
          options={["Geometric", "Floral", "Medallion", "Minimal"]}
        />
      </details>

      {/* Color */}
      <details>
        <summary className="cursor-pointer font-semibold">Color</summary>
        <CheckboxGroup
          field="color"
          options={["Red", "Blue", "Green", "Beige", "Multi"]}
        />
      </details>

      {/* Collection */}
      <details>
        <summary className="cursor-pointer font-semibold">Collection</summary>
        <CheckboxGroup
          field="collection"
          options={["Antique", "Anatolian", "Tribal", "Silk", "Patchwork", "Modern"]}
        />
      </details>

      {/* Age */}
      <details>
        <summary className="cursor-pointer font-semibold">Age</summary>
        <CheckboxGroup
          field="age"
          options={["Vintage (20-50y)", "Antique (50-100y)", "Collector (100y+)"]}
        />
      </details>

      {/* Origin */}
      <details>
        <summary className="cursor-pointer font-semibold">Origin</summary>
        <CheckboxGroup
          field="origin"
          options={["Turkey", "Persia", "Caucasus", "Afghanistan", "Morocco"]}
        />
      </details>

      {/* Material */}
      <details>
        <summary className="cursor-pointer font-semibold">Material</summary>
        <CheckboxGroup
          field="material"
          options={["Wool", "Silk", "Cotton", "Wool & Cotton"]}
        />
      </details>

      {/* Price Range */}
      <details>
        <summary className="cursor-pointer font-semibold">Price</summary>
        <div className="mt-2 space-y-2">
          <label className="block">
            Min Price ($)
            <input
              type="number"
              className="w-full border rounded p-1 mt-1"
              value={filters.minPrice || ""}
              onChange={(e) => handleChange("minPrice", e.target.value)}
            />
          </label>
          <label className="block">
            Max Price ($)
            <input
              type="number"
              className="w-full border rounded p-1 mt-1"
              value={filters.maxPrice || ""}
              onChange={(e) => handleChange("maxPrice", e.target.value)}
            />
          </label>
        </div>
      </details>

      {/* Stock */}
      <details>
        <summary className="cursor-pointer font-semibold">Stock Status</summary>
        <CheckboxGroup
          field="stock"
          options={["Available", "Sold"]}
        />
      </details>
    </aside>
  );
}

