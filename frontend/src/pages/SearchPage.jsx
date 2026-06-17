import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, ArrowLeft } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { ProductCard } from "./HomePage";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q")||"";
  const [query, setQuery] = useState(q);
  const [sort, setSort] = useState("default");
  const { fetchAllProducts, products } = useProductStore();

  useEffect(()=>{ fetchAllProducts(); window.scrollTo(0,0); },[]);

  const filtered = products.filter(p=>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.category.toLowerCase().includes(q.toLowerCase()) ||
    (p.description||"").toLowerCase().includes(q.toLowerCase())
  );
  const sorted = [...filtered].sort((a,b)=>{
    if(sort==="price-asc")  return a.price-b.price;
    if(sort==="price-desc") return b.price-a.price;
    if(sort==="name")       return a.name.localeCompare(b.name);
    return 0;
  });

  const submit = e => { e.preventDefault(); if(query.trim()) setSearchParams({q:query.trim()}); };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      <div style={{ background:"var(--bg-2)", borderBottom:"1px solid var(--border)" }} className="py-8">
        <div className="wrap">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:text-blue-600 transition-colors" style={{ color:"var(--ink-3)" }}>
            <ArrowLeft className="w-3.5 h-3.5"/> Back to Home
          </Link>
          <h1 className="text-2xl font-black mb-4" style={{ color:"var(--ink)" }}>
            {q ? <>Results for "<span style={{ color:"var(--blue)" }}>{q}</span>"</> : "Search Products"}
          </h1>
          <form onSubmit={submit} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:"var(--ink-4)" }}/>
              <input type="text" placeholder="Search products…" value={query} onChange={e=>setQuery(e.target.value)}
                className="input pl-9"/>
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="wrap py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color:"var(--ink-3)" }}>{sorted.length} result{sorted.length!==1?"s":""}</p>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" style={{ color:"var(--ink-3)" }}/>
            <select value={sort} onChange={e=>setSort(e.target.value)} className="input select w-auto text-sm" style={{ width:"auto" }}>
              <option value="default">Default</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {sorted.length===0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-bold mb-2" style={{ color:"var(--blue)" }}>No results found</h2>
            <p className="text-sm" style={{ color:"var(--ink-4)" }}>Try a different keyword or browse categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((p,i)=>(
              <motion.div key={p._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.04}}>
                <ProductCard product={p}/>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
