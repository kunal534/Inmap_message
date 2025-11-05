import React, { useEffect, useState } from 'react';
import { emailApi } from '../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

const COLORS = {
  'Interested': '#10b981',
  'Meeting Booked': '#3b82f6',
  'Not Interested': '#ef4444',
  'Spam': '#f59e0b',
  'Out of Office': '#8b5cf6'
};

export default function Dashboard({ onLogout }) {
  const [emails, setEmails] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [emailsRes, statsRes] = await Promise.all([
        emailApi.getAll(1, 100),
        emailApi.getStats()
      ]);

      setEmails(emailsRes.data.data);
      setStats(statsRes.data.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData();
      return;
    }

    setLoading(true);
    try {
      const res = await emailApi.search(searchQuery, {
        category: selectedCategory
      });
      setEmails(res.data.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = selectedCategory
    ? emails.filter((e) => e.category === selectedCategory)
    : emails;

  const pieData = stats.map((s) => ({
    name: s.key,
    value: s.doc_count,
    color: COLORS[s.key]
  }));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📊 ReachInbox Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">
          🚪 Logout
        </button>
      </header>

      <div className="dashboard-container">
        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.key} className="stat-card">
              <div className="stat-color" style={{ backgroundColor: COLORS[stat.key] }}></div>
              <h3>{stat.key}</h3>
              <p className="stat-count">{stat.doc_count}</p>
              <button
                onClick={() => setSelectedCategory(stat.key)}
                className="stat-filter-btn"
              >
                View →
              </button>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>📊 Category Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>📈 Email Count by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <h3>🔍 Search Emails</h3>
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by subject, sender..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
            <button onClick={() => { setSelectedCategory(null); loadData(); }}>
              Clear
            </button>
          </div>
        </div>

        {/* Emails List */}
        <div className="emails-section">
          <h3>📧 Emails {selectedCategory && `- ${selectedCategory}`}</h3>
          {loading ? (
            <p className="loading">Loading...</p>
          ) : filteredEmails.length === 0 ? (
            <p className="no-emails">No emails found</p>
          ) : (
            <div className="emails-list">
              {filteredEmails.map((email) => (
                <div key={email.messageId} className="email-item">
                  <div className="email-category">
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: COLORS[email.category] || '#6b7280'
                      }}
                    >
                      {email.category}
                    </span>
                  </div>
                  <div className="email-content">
                    <p className="email-from">
                      <strong>From:</strong> {email.from}
                    </p>
                    <p className="email-subject">
                      <strong>Subject:</strong> {email.subject}
                    </p>
                    <p className="email-preview">
                      {email.text?.substring(0, 150) || 'No preview'}...
                    </p>
                    <p className="email-date">
                      📅 {new Date(email.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
