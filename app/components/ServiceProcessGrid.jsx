import Image from "next/image";

/**
 * Generic process grid for service steps.
 * Props:
 *  - steps: Array<{ title, description, image, alt }>
 *  - columns: number (default 2 on md)
 *  - className: extra wrapper classes
 */
export default function ServiceProcessGrid({
  steps = [],
  columns = 2,
  className = "",
}) {
  const colClass = `grid grid-cols-1 md:grid-cols-${columns} gap-6 mt-8`;
  return (
    <div className={`${colClass} ${className}`}>\n      {steps.map((s, i) => {
        const src = s.image || `/images/placeholder-step.svg`;
        return (
          <div key={i} className="bg-white shadow-md p-6 rounded-lg border border-gray-100 hover:shadow-lg transition">
            {src && (
              <div className="relative w-full h-48 mb-4 overflow-hidden rounded">
                <Image
                  src={src}
                  alt={s.alt || s.title || `Step ${i + 1}`}
                  fill
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
            <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{s.description}</p>
          </div>
        );
      })}
    </div>
  );
}

