import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, SlidersHorizontal, Tag } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { ProductCard } from "./HomePage";
import axios from "../lib/axios";

export default function CategoryPage() {
  const { fetchProductsByCategory, products, loading } = useProductStore();
  const { category } = useParams();
  const [sort, setSort] = useState("default");
  const [catInfo, setCatInfo] = useState(null);

  useEffect(() => {
    fetchProductsByCategory(category);
    window.scrollTo(0,0);
    axios.get("/categories").then(r=>{
      const found=(r.data.categories||[]).find(c=>c.name===category);
      if(found) setCatInfo(found);
    }).catch(()=>{});
  },[category]);

  const sorted = [...(products||[])].sort((a,b)=>{
    if(sort==="price-asc")  return a.price-b.price;
    if(sort==="price-desc") return b.price-a.price;
    if(sort==="name")       return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
      {/* Header */}
      <div style={{ background:"var(--bg-2)", borderBottom:"1px solid var(--border)" }} className="py-8">
        <div className="wrap">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:text-blue-600 transition-colors" style={{ color:"var(--ink-3)" }}>
            <ArrowLeft className="w-3.5 h-3.5"/> Back to Home
          </Link>
          <div className="flex items-center gap-4">
            {catInfo?.image ? (
              <img src={catInfo.image} alt={catInfo.name} className="w-14 h-14 rounded-xl object-cover shadow-sm"/>
            ) : (
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background:"var(--blue-pale)" }}>
                <Tag className="w-6 h-6" style={{ color:"var(--blue)" }}/>
              </div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-black capitalize" style={{ color:"var(--ink)" }}>{category}</h1>
              {catInfo?.description && <p className="text-sm mt-0.5" style={{ color:"var(--ink-3)" }}>{catInfo.description}</p>}
              <p className="text-xs mt-1" style={{ color:"var(--ink-4)" }}>{sorted.length} products</p>
            </div>
          </div>
        </div>
      </div>

      <div className="wrap py-8">
        <div className="flex items-center justify-end mb-6 gap-2">
          <SlidersHorizontal className="w-4 h-4" style={{ color:"var(--ink-3)" }}/>
          <select value={sort} onChange={e=>setSort(e.target.value)}
            className="input select w-auto text-sm" style={{ width:"auto" }}>
            <option value="default">Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_,i)=>(
              <div key={i} className="card overflow-hidden">
                <div className="skeleton aspect-square"/>
                <div className="p-3 space-y-2">
                  <div className="skeleton h-3 w-3/4 rounded"/>
                  <div className="skeleton h-3 w-1/2 rounded"/>
                  <div className="skeleton h-8 rounded-lg"/>
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length===0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🥺</p>
            <h2 className="text-xl font-bold mb-2" style={{ color:"var(--blue)" }}>No products found</h2>
            <p className="text-sm" style={{ color:"var(--ink-4)" }}>This category is being stocked up. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {sorted.map((p,i)=>(
              <motion.div key={p._id} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.04}}>
                <ProductCard product={p}/>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
