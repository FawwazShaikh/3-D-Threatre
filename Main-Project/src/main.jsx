import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Layout from './app/Layout';
import Home from './app/Home';
import Listings from './app/Listings';
import TitleDetail from './app/TitleDetail';
import SeatSelect from './app/SeatSelect';
import Checkout from './app/Checkout';
import Confirmation from './app/Confirmation';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="listings" element={<Listings />} />
          <Route path="title/:id" element={<TitleDetail />} />
          <Route path="seats/:titleId/:showtimeId" element={<SeatSelect />} />
          <Route path="checkout/:titleId/:showtimeId" element={<Checkout />} />
          <Route path="confirmation/:titleId/:showtimeId" element={<Confirmation />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
