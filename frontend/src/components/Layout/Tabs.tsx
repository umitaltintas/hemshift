
import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { name: 'Takvim', href: '/' },
  { name: 'Hemşireler', href: '/nurses' },
  { name: 'İzinler', href: '/leaves' },
  { name: 'İstatistikler', href: '/stats' },
];

const Tabs: React.FC = () => {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
          defaultValue={tabs.find(tab => window.location.pathname === tab.href)?.name}
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <NavLink
                key={tab.name}
                to={tab.href}
                className={({ isActive }) =>
                  `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                {tab.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Tabs;
