import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Header from "./components/Layout/Header";
import HomePage from "./pages/HomePage";
import SwapPage from "./pages/SwapPage";
import PoolsPage from "./pages/PoolsPage";
import AddLiquidityPage from "./pages/AddLiquidityPage";
import ExplorePage from "./pages/ExplorePage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <WalletProvider>
      <div className="App min-h-screen bg-[#0d0d0d]">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/pools" element={<PoolsPage />} />
            <Route path="/pool/:poolId/add" element={<AddLiquidityPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-right" />
        </BrowserRouter>
      </div>
    </WalletProvider>
  );
}

export default App;
