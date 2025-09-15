import { useState } from "react";

export default function TestHooks() {
  const [n, setN] = useState(0);
  return (
    <div className="p-4">
      <button type="button" onClick={()=>setN(n+1)}>Count: {n}</button>
    </div>
  );
}

