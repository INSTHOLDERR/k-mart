import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useUserStore } from "./stores/useUserStore";
import { useCartStore } from "./stores/useCartStore";
import Navbar from "./components/Navbar";
import LoadingSpinner from "./components/LoadingSpinner";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OTPPage from "./pages/OTPPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminPage from "./pages/AdminPage";
import CartPage from "./pages/CartPage";
import CategoryPage from "./pages/CategoryPage";
import ProductViewPage from "./pages/ProductViewPage";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import WishlistPage from "./pages/WishlistPage";
import WalletPage from "./pages/WalletPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import PurchaseCancelPage from "./pages/PurchaseCancelPage";

function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();
  useEffect(() => { checkAuth(); }, [checkAuth]);
  useEffect(() => { if (user) getCartItems(); }, [getCartItems, user]);
  if (checkingAuth) return <LoadingSpinner />;
  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <Toaster position="top-center" toastOptions={{ duration: 3000,
        style: { fontFamily: "'Inter',sans-serif", fontSize: "13px", borderRadius: "10px",
          border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", background: "#fff", color: "var(--ink)" },
        success: { iconTheme: { primary: "var(--blue)", secondary: "#fff" } },
        error:   { iconTheme: { primary: "var(--red)",  secondary: "#fff" } },
      }} />
      <Routes>
        <Route path="/login"           element={!user ? <LoginPage />          : <Navigate to="/" />} />
        <Route path="/signup"          element={!user ? <SignUpPage />         : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route path="/otp"             element={<OTPPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/secret-dashboard" element={user?.role==="admin" ? <AdminPage /> : <Navigate to="/login" />} />
        <Route path="/*" element={<>
          <Navbar />
          <main>
            <Routes>
              <Route path="/"                   element={<HomePage />} />
              <Route path="/category/:category" element={<CategoryPage />} />
              <Route path="/product/:id"        element={<ProductViewPage />} />
              <Route path="/search"             element={<SearchPage />} />
              <Route path="/cart"               element={user ? <CartPage />            : <Navigate to="/login" />} />
              <Route path="/wishlist"           element={user ? <WishlistPage />        : <Navigate to="/login" />} />
              <Route path="/profile"            element={user ? <ProfilePage />         : <Navigate to="/login" />} />
              <Route path="/orders"             element={user ? <OrdersPage />          : <Navigate to="/login" />} />
              <Route path="/wallet"             element={user ? <WalletPage />          : <Navigate to="/login" />} />
              <Route path="/purchase-success"   element={user ? <PurchaseSuccessPage /> : <Navigate to="/login" />} />
              <Route path="/purchase-cancel"    element={user ? <PurchaseCancelPage />  : <Navigate to="/login" />} />
              <Route path="*" element={
                <div className="wrap text-center py-32">
                  <p className="text-6xl mb-5">🛒</p>
                  <h1 className="text-3xl font-bold mb-2" style={{ color:"var(--blue)" }}>Page not found</h1>
                  <p className="mb-7 text-sm" style={{ color:"var(--ink-3)" }}>The page you're looking for doesn't exist.</p>
                  <a href="/" className="btn btn-primary">Go home</a>
                </div>
              } />
            </Routes>
          </main>
        </>} />
      </Routes>
    </div>
  );
}
export default App;
