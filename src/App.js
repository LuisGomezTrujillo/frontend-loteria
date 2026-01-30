import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import TVPage from './pages/TVPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TVPage />} />
      </Routes>
    </Router>
  );
}

export default App;