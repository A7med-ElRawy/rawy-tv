/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MovieDetailPage from './pages/MovieDetailPage';
import LibraryPage from './pages/LibraryPage';

export default function App() {
  return (
    <MovieProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetailPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </Layout>
      </Router>
    </MovieProvider>
  );
}

