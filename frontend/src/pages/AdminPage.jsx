import {
  BarChart2, ShoppingBag, Users, LayoutDashboard,
  DollarSign, TrendingUp, ShoppingCart, Tag, Ticket,
  Package, Menu, X, LogOut, Home
} from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import NotificationBell from "../components/NotificationBell";
import AnalyticsTab from "../components/AnalyticsTab";
import ProductsList from "../components/ProductsList";
import UsersTab from "../components/UsersTab";
import CategoriesTab from "../components/CategoriesTab";
import CouponsTab from "../components/CouponsTab";
import OrdersTab from "../components/OrdersTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "orders",     label: "Orders",     icon: Package         },
  { id: "products",   label: "Products",   icon: ShoppingBag     },
  { id: "categories", label: "Categories", icon: Tag             },
  { id: "users",      label: "Users",      icon: Users           },
  { id: "coupons",    label: "Coupons",    icon: Ticket          },
  { id: "analytics",  label: "Analytics",  icon: BarChart2       },
];

const AdminPage = () => {
  const [activeTab,   setActiveTab]   = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { fetchAllProducts } = useProductStore();
  const { user, logout }     = useUserStore();

  useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-7">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white"
          style={{ background: "var(--blue)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>K</div>
        <div>
          <p className="font-black text-sm leading-none" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--ink)" }}>K Mart</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--ink-4)" }}>Admin Panel</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {tabs.map(tab => {
          const Icon   = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all"
              style={{
                background: active ? "var(--blue-pale)"  : "transparent",
                color:      active ? "var(--blue)"        : "var(--ink-3)",
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "var(--blue)" }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom: user info + logout */}
      <div className="px-3 mt-4 space-y-2">
        <Link to="/"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-50"
          style={{ color: "var(--ink-3)" }}>
          <Home className="w-4 h-4 shrink-0" /> Visit Store
        </Link>

        <div className="p-3 rounded-xl" style={{ background: "var(--bg-2)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--ink-4)" }}>
            Logged in as
          </p>
          <p className="text-xs font-semibold truncate" style={{ color: "var(--ink)" }}>
            {user?.name || "Administrator"}
          </p>
          <p className="text-[10px] truncate" style={{ color: "var(--ink-4)" }}>{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-red-50"
          style={{ color: "var(--red)" }}
        >
          <LogOut className="w-4 h-4 shrink-0" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-2)", fontFamily: "'Inter',sans-serif" }}>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex w-56 shrink-0 flex-col py-5 px-3"
        style={{ background: "#fff", borderRight: "1px solid var(--border)", minHeight: "100vh" }}>
        <SidebarContent />
      </aside>

      {/* ── Mobile sidebar drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <motion.div className="absolute left-0 top-0 h-full w-56 flex flex-col shadow-xl py-5 px-3"
              style={{ background: "#fff" }}
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: .3 }}>
              <div className="flex items-center justify-between mb-5 px-3">
                <span className="font-black text-base" style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", color: "var(--blue)" }}>
                  K Mart Admin
                </span>
                <button onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100">
                  <X className="w-4 h-4" style={{ color: "var(--ink-3)" }} />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="flex items-center gap-3 px-5 lg:px-8 h-14 shrink-0"
          style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--bg-2)" }}>
            <Menu className="w-4 h-4" style={{ color: "var(--ink-3)" }} />
          </button>

          <div className="flex-1">
            <h1 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs" style={{ color: "var(--ink-4)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <NotificationBell isAdmin={true} />

          <button
            onClick={logout}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-red-50"
            style={{ color: "var(--red)", border: "1px solid #fecaca" }}
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </header>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: .15 }}
            >
              {activeTab === "overview"   && <OverviewTab />}
              {activeTab === "orders"     && <OrdersTab />}
              {activeTab === "products"   && <ProductsList />}
              {activeTab === "categories" && <CategoriesTab />}
              {activeTab === "users"      && <UsersTab />}
              {activeTab === "coupons"    && <CouponsTab />}
              {activeTab === "analytics"  && <AnalyticsTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

/* ── Overview tab ────────────────────────────────────────────────────────── */
const OverviewTab = () => {
  const { products } = useProductStore();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/analytics")
      .then(r => setData(r.data.analyticsData))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredCount = products?.filter(p => p.isFeatured).length || 0;
  const categoryCount = new Set(products?.map(p => p.category) || []).size;
  const outOfStock    = products?.filter(p => (p.quantity ?? 0) === 0).length || 0;
  const avgOrder      = data?.totalSales > 0 ? `₹${(data.totalRevenue / data.totalSales).toFixed(0)}` : "₹0";

  const kpis = [
    { label: "Total Revenue", icon: DollarSign,   value: loading ? "—" : `₹${(data?.totalRevenue || 0).toLocaleString("en-IN")}`, sub: "All-time income",       bg: "var(--green-pale)",  ic: "var(--green)"  },
    { label: "Total Orders",  icon: ShoppingCart,  value: loading ? "—" : (data?.totalSales || 0).toLocaleString(),                sub: "Orders completed",      bg: "var(--blue-pale)",   ic: "var(--blue)"   },
    { label: "Total Users",   icon: Users,         value: loading ? "—" : (data?.users || 0).toLocaleString(),                    sub: "Registered accounts",   bg: "var(--purple-pale)", ic: "var(--purple)" },
    { label: "Total Products",icon: Package,       value: loading ? "—" : (data?.products || 0).toLocaleString(),                 sub: `${outOfStock} out of stock`, bg: "var(--yellow-pale)", ic: "var(--yellow)" },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .07 }}
              className="stat-card">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: k.bg }}>
                <Icon className="w-4 h-4" style={{ color: k.ic }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ink-4)" }}>{k.label}</p>
              <p className="text-2xl font-black" style={{ color: "var(--ink)" }}>{k.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>{k.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Avg Order Value", value: avgOrder,        icon: TrendingUp,  sub: "Revenue ÷ orders"    },
          { label: "Featured Items",  value: featuredCount,   icon: ShoppingBag, sub: "Shown on homepage"   },
          { label: "Categories",      value: categoryCount,   icon: Tag,         sub: "Active product types" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4" style={{ color: "var(--ink-4)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--ink-4)" }}>{s.label}</p>
              </div>
              <p className="text-2xl font-black" style={{ color: "var(--ink)" }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-4)" }}>{s.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-semibold text-sm" style={{ color: "var(--ink)" }}>Recent Products</p>
          <span className="text-xs" style={{ color: "var(--ink-4)" }}>{products?.length || 0} total</span>
        </div>
        {!products || products.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: "var(--ink-4)" }}>No products yet</div>
        ) : (
          products.slice(0, 6).map(p => (
            <div key={p._id} className="table-row">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 mr-3 relative" style={{ background: "var(--bg-2)" }}>
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                {(p.quantity ?? 0) === 0 && (
                  <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                    <span className="text-[7px] text-white font-black">OOS</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>{p.name}</p>
                <p className="text-xs capitalize" style={{ color: "var(--ink-4)" }}>{p.category}</p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-sm font-semibold" style={{ color: "var(--blue)" }}>₹{p.price.toFixed(0)}</span>
                {(p.quantity ?? 0) === 0 ? (
                  <span className="badge badge-red text-[10px]">OOS</span>
                ) : (p.quantity ?? 99) <= 5 ? (
                  <span className="badge badge-yellow text-[10px]">{p.quantity} left</span>
                ) : null}
                {p.isFeatured && <span className="badge badge-yellow">Featured</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPage;
