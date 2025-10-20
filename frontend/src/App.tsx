import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Nurses from './pages/Nurses';
import Leaves from './pages/Leaves';
import Statistics from './pages/Statistics';
import Login from './pages/Login';
import ScheduleEditor from './pages/ScheduleEditor';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/nurses" element={<Nurses />} />
                <Route path="/leaves" element={<Leaves />} />
                <Route path="/stats" element={<Statistics />} />
                <Route path="/schedule/:month" element={<ScheduleEditor />} />
              </Routes>
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;