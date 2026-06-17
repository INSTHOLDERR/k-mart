import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X, Check, Ticket, ToggleLeft, ToggleRight, AlertCircle, Clock, BadgePercent, TrendingUp } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CouponsTab = () => {
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("list");
  const def = {code:"",discountPercentage:"",expirationDate:""};
  const [form, setForm] = useState(def);

  useEffect(()=>{ Promise.all([load(),loadAnalytics()]).finally(()=>setLoading(false)); },[]);
  const load = async()=>{ try{const r=await axios.get("/coupons/admin/all");setCoupons(r.data.coupons);}catch{toast.error("Failed to load coupons");} };
  const loadAnalytics = async()=>{ try{const r=await axios.get("/coupons/admin/analytics");setAnalytics(r.data);}catch{} };
  const submit = async e => {
    e.preventDefault();
    if(!form.code||!form.discountPercentage||!form.expirationDate){toast.error("All fields required");return;}
    setSubmitting(true);
    try{
      const r=await axios.post("/coupons/admin/create",form);
      setCoupons(p=>[r.data,...p]); toast.success("Coupon created"); setForm(def); setShowForm(false);
    }catch(e){toast.error(e.response?.data?.message||"Failed");}finally{setSubmitting(false);}
  };
  const toggle = async id => {
    try{const r=await axios.patch(`/coupons/admin/${id}/toggle`);setCoupons(p=>p.map(c=>c._id===id?r.data:c));toast.success(`Coupon ${r.data.isActive?"activated":"deactivated"}`);}
    catch{toast.error("Failed");}
  };
  const del = async id => {
    if(!window.confirm("Delete this coupon?")) return;
    try{await axios.delete(`/coupons/admin/${id}`);setCoupons(p=>p.filter(c=>c._id!==id));toast.success("Deleted");}
    catch(e){toast.error(e.response?.data?.message||"Failed");}
  };
  const expired = d => new Date(d)<new Date();
  const PIE_COLORS = ["var(--blue)","var(--green)","var(--orange)","var(--purple)"];
  const pieData = analytics?.discountTiers?.map(t=>({name:t._id,value:t.count}))||[];

  if(loading) return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 rounded-full border-4 animate-spin" style={{ borderColor:"var(--blue-light)", borderTopColor:"var(--blue)" }}/></div>;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold" style={{ color:"var(--ink)" }}>Coupons</h2>
          <p className="text-xs mt-0.5" style={{ color:"var(--ink-4)" }}>{coupons.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border:"1px solid var(--border)" }}>
            {["list","analytics"].map(v=>(
              <button key={v} onClick={()=>setView(v)} className="px-3 py-1.5 text-xs font-medium capitalize transition-all"
                style={{ background:view===v?"var(--blue)":"#fff", color:view===v?"#fff":"var(--ink-3)" }}>{v}</button>
            ))}
          </div>
          <button onClick={()=>setShowForm(v=>!v)} className={`btn btn-sm ${showForm?"btn-soft":"btn-primary"}`}>
            {showForm ? <><X className="w-3.5 h-3.5"/> Cancel</> : <><Plus className="w-3.5 h-3.5"/> New Coupon</>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:.22}} className="overflow-hidden">
            <div className="card p-5" style={{ border:"1.5px solid var(--blue-light)" }}>
              <h3 className="text-sm font-bold mb-4" style={{ color:"var(--blue)" }}>Create Coupon</h3>
              <form onSubmit={submit}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="label">Coupon Code *</label>
                    <input type="text" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. SAVE20" className="input" required/>
                  </div>
                  <div>
                    <label className="label">Discount % *</label>
                    <input type="number" min="1" max="100" value={form.discountPercentage} onChange={e=>setForm(p=>({...p,discountPercentage:e.target.value}))} placeholder="e.g. 20" className="input" required/>
                  </div>
                  <div>
                    <label className="label">Expiry Date *</label>
                    <input type="date" value={form.expirationDate} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,expirationDate:e.target.value}))} className="input" required/>
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-sm">
                  {submitting ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                  Create Coupon
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {view==="analytics"&&analytics && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {l:"Total",     v:analytics.totalCoupons,   ic:Ticket,     color:"var(--ink)"},
              {l:"Active",    v:analytics.activeCoupons,  ic:Check,      color:"var(--green)"},
              {l:"Inactive",  v:analytics.inactiveCoupons,ic:ToggleLeft, color:"var(--orange)"},
              {l:"Expired",   v:analytics.expiredCoupons, ic:Clock,      color:"var(--red)"},
            ].map(s=>{ const Icon=s.ic; return (
              <div key={s.l} className="stat-card">
                <Icon className="w-4 h-4 mb-2" style={{ color:s.color }}/>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:"var(--ink-4)" }}>{s.l}</p>
                <p className="text-2xl font-black" style={{ color:s.color }}>{s.v}</p>
              </div>
            );})}
          </div>
          {pieData.length>0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4"><BadgePercent className="w-4 h-4" style={{ color:"var(--blue)" }}/><h3 className="text-sm font-bold" style={{ color:"var(--ink)" }}>By Discount Tier</h3></div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                    {pieData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius:10, border:"1px solid var(--border)", fontSize:12, background:"#fff" }}/>
                  <Legend wrapperStyle={{ fontSize:"12px", color:"var(--ink-3)", paddingTop:"12px" }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      )}

      {view==="list" && (
        <div className="card overflow-hidden">
          <div className="grid gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns:"1fr auto auto auto auto", borderBottom:"1px solid var(--border)", color:"var(--ink-4)" }}>
            {["Code","Discount","Expires","Status",""].map(h=><span key={h}>{h}</span>)}
          </div>
          {coupons.length===0 ? (
            <div className="flex flex-col items-center gap-2 py-16" style={{ color:"var(--ink-4)" }}>
              <Ticket className="w-8 h-8"/><p className="text-sm">No coupons yet</p>
            </div>
          ) : coupons.map((c,i)=>{ const exp=expired(c.expirationDate); return (
            <motion.div key={c._id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*.03}}
              className="grid items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              style={{ gridTemplateColumns:"1fr auto auto auto auto", borderBottom:"1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"var(--blue-pale)" }}><Ticket className="w-3.5 h-3.5" style={{ color:"var(--blue)" }}/></div>
                <p className="text-sm font-mono font-semibold" style={{ color:"var(--ink)" }}>{c.code}</p>
              </div>
              <span className="badge badge-green">{c.discountPercentage}% off</span>
              <div className="flex items-center gap-1.5">
                {exp && <AlertCircle className="w-3 h-3" style={{ color:"var(--red)" }}/>}
                <span className={`text-xs ${exp?"text-red-500":"text-gray-400"}`}>{new Date(c.expirationDate).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}</span>
              </div>
              <button onClick={()=>toggle(c._id)} className="flex items-center gap-1.5">
                {c.isActive ? <><ToggleRight className="w-5 h-5" style={{ color:"var(--green)" }}/><span className="text-xs" style={{ color:"var(--green)" }}>Active</span></> : <><ToggleLeft className="w-5 h-5" style={{ color:"var(--ink-5)" }}/><span className="text-xs" style={{ color:"var(--ink-4)" }}>Off</span></>}
              </button>
              <button onClick={()=>del(c._id)} className="btn btn-icon btn-ghost" style={{ color:"var(--ink-4)" }}>
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            </motion.div>
          );})}
        </div>
      )}
    </div>
  );
};
export default CouponsTab;
