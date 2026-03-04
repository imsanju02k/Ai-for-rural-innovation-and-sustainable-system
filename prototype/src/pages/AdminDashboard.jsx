import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [farms, setFarms] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalFarms: 0,
    totalAlerts: 0,
    totalSensorData: 0,
  });

  // Check admin access
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
      navigate('/');
    }
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load users
      const usersData = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(usersData);

      // Load farms
      const farmsData = JSON.parse(localStorage.getItem('farms') || '[]');
      setFarms(farmsData);

      // Load alerts
      const alertsData = JSON.parse(localStorage.getItem('alerts') || '[]');
      setAlerts(alertsData);

      // Load sensor data
      const sensorDataArray = JSON.parse(localStorage.getItem('sensorData') || '[]');
      setSensorData(sensorDataArray);

      // Calculate stats
      const activeUsersCount = usersData.filter(u => {
        const lastLogin = new Date(u.lastLogin || 0);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return lastLogin > sevenDaysAgo;
      }).length;

      setStats({
        totalUsers: usersData.length,
        activeUsers: activeUsersCount,
        totalFarms: farmsData.length,
        totalAlerts: alertsData.length,
        totalSensorData: sensorDataArray.length,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user and all associated data?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Remove associated farms
      const updatedFarms = farms.filter(f => f.userId !== userId);
      setFarms(updatedFarms);
      localStorage.setItem('farms', JSON.stringify(updatedFarms));
      
      setStats(prev => ({ ...prev, totalUsers: updatedUsers.length }));
    }
  };

  const handleDeleteFarm = (farmId) => {
    if (window.confirm('Are you sure you want to delete this farm and all associated data?')) {
      const updatedFarms = farms.filter(f => f.id !== farmId);
      setFarms(updatedFarms);
      localStorage.setItem('farms', JSON.stringify(updatedFarms));
      
      // Remove associated sensor data
      const updatedSensorData = sensorData.filter(s => s.farmId !== farmId);
      setSensorData(updatedSensorData);
      localStorage.setItem('sensorData', JSON.stringify(updatedSensorData));
      
      setStats(prev => ({ ...prev, totalFarms: updatedFarms.length }));
    }
  };

  const handleDeleteAlert = (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      const updatedAlerts = alerts.filter(a => a.id !== alertId);
      setAlerts(updatedAlerts);
      localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
      setStats(prev => ({ ...prev, totalAlerts: updatedAlerts.length }));
    }
  };

  const handleDeleteSensorData = (dataId) => {
    if (window.confirm('Are you sure you want to delete this sensor data?')) {
      const updatedSensorData = sensorData.filter(s => s.id !== dataId);
      setSensorData(updatedSensorData);
      localStorage.setItem('sensorData', JSON.stringify(updatedSensorData));
      setStats(prev => ({ ...prev, totalSensorData: updatedSensorData.length }));
    }
  };

  const handleBulkDelete = (type) => {
    if (selectedItems.size === 0) {
      alert('Please select items to delete');
      return;
    }

    if (window.confirm(`Delete ${selectedItems.size} selected items?`)) {
      if (type === 'users') {
        const updatedUsers = users.filter(u => !selectedItems.has(u.id));
        setUsers(updatedUsers);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
      } else if (type === 'farms') {
        const updatedFarms = farms.filter(f => !selectedItems.has(f.id));
        setFarms(updatedFarms);
        localStorage.setItem('farms', JSON.stringify(updatedFarms));
      } else if (type === 'alerts') {
        const updatedAlerts = alerts.filter(a => !selectedItems.has(a.id));
        setAlerts(updatedAlerts);
        localStorage.setItem('alerts', JSON.stringify(updatedAlerts));
      }
      setSelectedItems(new Set());
      loadDashboardData();
    }
  };

  const toggleItemSelection = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phone?.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFarms = farms.filter(f =>
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlerts = alerts.filter(a =>
    a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSensorData = sensorData.filter(s =>
    s.sensorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.farmId?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <button
              onClick={() => {
                localStorage.removeItem('userRole');
                navigate('/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {['overview', 'users', 'farms', 'alerts', 'sensors'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Users</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalUsers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Users</h3>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeUsers}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Farms</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalFarms}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Alerts</h3>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalAlerts}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sensor Data</h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalSensorData}</p>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users Management</h2>
                    {selectedItems.size > 0 && (
                      <button
                        onClick={() => handleBulkDelete('users')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Selected ({selectedItems.size})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, phone, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(new Set(filteredUsers.map(u => u.id)));
                              } else {
                                setSelectedItems(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(user.id)}
                              onChange={() => toggleItemSelection(user.id)}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.phone}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Farms Tab */}
            {activeTab === 'farms' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Farms Management</h2>
                    {selectedItems.size > 0 && (
                      <button
                        onClick={() => handleBulkDelete('farms')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Selected ({selectedItems.size})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search by farm name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(new Set(filteredFarms.map(f => f.id)));
                              } else {
                                setSelectedItems(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Farm Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredFarms.map(farm => (
                        <tr key={farm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(farm.id)}
                              onChange={() => toggleItemSelection(farm.id)}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{farm.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{farm.location}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{farm.size} acres</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(farm.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleDeleteFarm(farm.id)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alerts Management</h2>
                    {selectedItems.size > 0 && (
                      <button
                        onClick={() => handleBulkDelete('alerts')}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete Selected ({selectedItems.size})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(new Set(filteredAlerts.map(a => a.id)));
                              } else {
                                setSelectedItems(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredAlerts.map(alert => (
                        <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(alert.id)}
                              onChange={() => toggleItemSelection(alert.id)}
                            />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{alert.title}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{alert.type}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(alert.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sensors Tab */}
            {activeTab === 'sensors' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Sensor Data Management</h2>
                  <input
                    type="text"
                    placeholder="Search sensor data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sensor Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Farm ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {filteredSensorData.slice(0, 50).map(data => (
                        <tr key={data.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{data.sensorType}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{data.value} {data.unit}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{data.farmId}</td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(data.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => handleDeleteSensorData(data.id)}
                              className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
