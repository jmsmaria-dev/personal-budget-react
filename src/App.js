import React from 'react';
import './App.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Menu from './Menu/Menu';
import HomePage from './HomePage/HomePage';
import AboutPage from './Aboutpage/AboutPage';
import Hero from './Hero/Hero';
import Footer from './Footer/Footer';
import LoginPage from './LoginPage/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Menu />
        <Hero />
        <div className="mainContainer">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

