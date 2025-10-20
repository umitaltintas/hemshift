import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import { MainLayout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Nurses from './pages/Nurses';
import Leaves from './pages/Leaves';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import ScheduleEditor from './pages/ScheduleEditor';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ErrorBoundary>
                <MainLayout>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<PageErrorBoundary pageTitle="Kontrol Paneli"><Dashboard /></PageErrorBoundary>} />
                      <Route path="/nurses" element={<PageErrorBoundary pageTitle="Hemşireler"><Nurses /></PageErrorBoundary>} />
                      <Route path="/leaves" element={<PageErrorBoundary pageTitle="İzinler"><Leaves /></PageErrorBoundary>} />
                      <Route path="/stats" element={<PageErrorBoundary pageTitle="İstatistikler"><Statistics /></PageErrorBoundary>} />
                      <Route path="/schedule/:month" element={<PageErrorBoundary pageTitle="Plan Editörü"><ScheduleEditor /></PageErrorBoundary>} />
                    </Routes>
                  </ErrorBoundary>
                </MainLayout>
              </ErrorBoundary>
            }
          />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;