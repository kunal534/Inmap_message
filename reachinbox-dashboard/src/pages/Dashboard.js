import React, { useEffect, useState, useCallback } from 'react';
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

  const memoizedOnLogout = useCallback(() => {
    onLogout();
  }, [onLogout]);



  const loadData = useCallback(async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    console.log('📊 Loading data with token:', token ? 'Present' : 'Missing');

    // Fetch emails
    try {
      const emailsRes = await fetch('http://localhost:3000/api/emails', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📧 Emails response status:', emailsRes.status);
      const emailsText = await emailsRes.text();
      console.log('📧 Raw response:', emailsText.substring(0, 200));

      if (emailsRes.ok && emailsText) {
        try {
          const emailsData = JSON.parse(emailsText);
          console.log('✅ Got emails:', emailsData.data);
          setEmails(Array.isArray(emailsData.data) ? emailsData.data : []);
        } catch (parseErr) {
          console.error('JSON parse error for emails:', parseErr, 'Text:', emailsText);
        }
      }
    } catch (e) {
      console.error('Email fetch error:', e);
    }

    // Fetch stats
    try {
      const statsRes = await fetch('http://localhost:3000/api/emails/categories/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Stats response status:', statsRes.status);
      const statsText = await statsRes.text();
      console.log('📊 Raw stats response:', statsText.substring(0, 200));

      if (statsRes.ok && statsText) {
        try {
          const statsData = JSON.parse(statsText);
          console.log('✅ Got stats:', statsData.data);
          setStats(Array.isArray(statsData.data) ? statsData.data : []);
        } catch (parseErr) {
          console.error('JSON parse error for stats:', parseErr, 'Text:', statsText);
        }
      }
    } catch (e) {
      console.error('Stats fetch error:', e);
    }

  } catch (err) {
    console.error('❌ Failed to load data:', err);
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔐 Dashboard mounted, token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.error('❌ No token, redirecting');
      memoizedOnLogout();
      return;
    }

    loadData();
  }, [memoizedOnLogout, loadData]);

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
        <button onClick={memoizedOnLogout} className="logout-btn">
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

        {/* Emails List */}
        <div className="emails-section">
          <h3>📧 Emails {selectedCategory && `- ${selectedCategory}`}</h3>
          {loading ? (
            <p className="loading">⏳ Loading emails...</p>
          ) : filteredEmails.length === 0 ? (
            <p className="no-emails">📭 No emails yet - they'll sync automatically from your inbox</p>
          ) : (
            <div className="emails-list">
              {filteredEmails.map((email) => (
                <div key={email.messageId || email.id} className="email-item">
                  <div className="email-category">
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: COLORS[email.category] || '#6b7280'
                      }}
                    >
                      {email.category || 'Uncategorized'}
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
