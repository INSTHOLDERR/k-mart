import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

const AnalyticsTab = () => {
  const [data, setData] = useState({ users:0, products:0, totalSales:0, totalRevenue:0 });
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    axios.get("/analytics").then(r=>{ setData(r.data.analyticsData); setDaily(r.data.dailySalesData); }).catch(console.error).finally(()=>setLoading(false));
  },[]);

  if(loading) return <div className="flex items-center justify-center py-24"><div className="w-6 h-6 rounded-full border-4 animate-spin" style={{ borderColor:"var(--blue-light)", borderTopColor:"var(--blue)" }}/></div>;

  const cards = [
    {title:"Total Users",   value:data.users.toLocaleString(),             icon:Users,       bg:"var(--blue-pale)",   ic:"var(--blue)"},
    {title:"Total Products",value:data.products.toLocaleString(),          icon:Package,     bg:"var(--purple-pale)", ic:"var(--purple)"},
    {title:"Total Sales",   value:data.totalSales.toLocaleString(),        icon:ShoppingCart,bg:"var(--green-pale)",  ic:"var(--green)"},
    {title:"Total Revenue", value:`₹${data.totalRevenue.toLocaleString()}`,icon:DollarSign,  bg:"var(--yellow-pale)", ic:"var(--yellow)"},
  ];

  const Tip = ({active,payload,label}) => {
    if(!active||!payload?.length) return null;
    return (
      <div className="card p-3 shadow-lg" style={{ minWidth:140 }}>
        <p className="text-xs font-semibold mb-2" style={{ color:"var(--ink-3)" }}>{label}</p>
        {payload.map(e=>(
          <div key={e.name} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background:e.color }}/>
            <span style={{ color:"var(--ink-3)" }}>{e.name}:</span>
            <span className="font-semibold" style={{ color:"var(--ink)" }}>{e.name==="Revenue"?`₹${e.value.toLocaleString()}`:e.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i)=>{
          const Icon=c.icon;
          return (
            <motion.div key={c.title} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.07}} className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background:c.bg }}>
                <Icon className="w-4 h-4" style={{ color:c.ic }}/>
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:"var(--ink-4)" }}>{c.title}</p>
              <p className="text-2xl font-black" style={{ color:"var(--ink)" }}>{c.value}</p>
            </motion.div>
          );
        })}
      </div>

      <motion.div className="card p-6" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.3}}>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-4 h-4" style={{ color:"var(--blue)" }}/>
          <h2 className="text-sm font-bold" style={{ color:"var(--ink)" }}>Sales &amp; Revenue</h2>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={daily} margin={{top:4,right:4,bottom:0,left:0}}>
            <defs>
              <linearGradient id="salesG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue)" stopOpacity={0.18}/>
                <stop offset="100%" stopColor="var(--blue)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--orange)" stopOpacity={0.18}/>
                <stop offset="100%" stopColor="var(--orange)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
            <XAxis dataKey="name" stroke="var(--border)" tick={{fill:"var(--ink-4)",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="left" stroke="var(--border)" tick={{fill:"var(--ink-4)",fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis yAxisId="right" orientation="right" stroke="var(--border)" tick={{fill:"var(--ink-4)",fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<Tip/>} cursor={{stroke:"var(--border)",strokeWidth:1}}/>
            <Legend wrapperStyle={{fontSize:"12px",color:"var(--ink-3)",paddingTop:"16px"}}/>
            <Area yAxisId="left" type="monotone" dataKey="sales" stroke="var(--blue)" strokeWidth={2} fill="url(#salesG)" dot={false} activeDot={{r:5,fill:"var(--blue)",strokeWidth:0}} name="Sales"/>
            <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="var(--orange)" strokeWidth={2} fill="url(#revG)" dot={false} activeDot={{r:5,fill:"var(--orange)",strokeWidth:0}} name="Revenue"/>
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};
export default AnalyticsTab;
