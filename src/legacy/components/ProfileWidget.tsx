import React from 'react';
import './ProfileWidget.css';

const ProfileWidget: React.FC = () => {
  return (
    <div className="profile-widget cursor-target">
      <div className="profile-header">
        <div className="avatar-container">
          <div className="avatar-placeholder">🤖</div>
          <div className="level-badge">Lv. 12</div>
        </div>
        <div className="profile-info">
          <h3 className="profile-name">Patient #2847</h3>
          <p className="profile-rank">Master of Flexion</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-label">🔥 Streak</span>
          <span className="stat-value">7 Days</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">🏆 Rank</span>
          <span className="stat-value">Top 5%</span>
        </div>
      </div>

      <div className="xp-section">
        <div className="xp-header">
          <span>XP Progress</span>
          <span>2,450 / 3,000</span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar-fill" style={{ width: '82%' }}></div>
        </div>
      </div>

      <div className="badges-section">
        <p className="section-label">Recent Achievements</p>
        <div className="badges-grid">
          <div className="badge-icon" title="First Stretch">🧘</div>
          <div className="badge-icon" title="7 Day Streak">🔥</div>
          <div className="badge-icon" title="90° Range">🎯</div>
          <div className="badge-icon" title="Perfect Score">💎</div>
        </div>
      </div>

      <button className="view-profile-btn cursor-target">View Full Stats</button>
    </div>
  );
};

export default ProfileWidget;
