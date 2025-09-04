import { useState } from "react";

export default function TestHooks() {
  const [n, setN] = useState(0);
  return (
    <div style={{padding:16}}>
      <button onClick={()=>setN(n+1)}>Count: {n}</button>
    </div>
  );
}
