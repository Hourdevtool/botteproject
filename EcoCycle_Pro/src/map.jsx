import React, { useState } from 'react';
import Sidebar from './components/sidebar';
import './css/map.css';

const MapView = () => {
  const [selectedStation, setSelectedStation] = useState(true);

  return (
    <div className="map-app-container">
      <Sidebar />
      <main className="map-main-content">
        <div className="map-wrapper">
          {/* Map Background Layer (CSS) */}
          <div className="map-layer"></div>

          {/* Search Bar */}
          <div className="map-search-bar">
            <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a99a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
            <input type="text" placeholder="ค้นหารหัสเครื่อง หรือ สถานที่ตั้ง..." />
            <button className="map-filter-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#25a871" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="21" y2="14"/><line x1="4" x2="20" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="1" x2="1" y1="14" y2="21"/><line x1="1" x2="1" y1="3" y2="10"/></svg>
            </button>
          </div>

          {/* Station List */}
          <div className="station-list-overlay">
            <h3 className="list-title">ภาพรวมจุดติดตั้ง</h3>
            <div className="station-list">
              {[
                { name: 'จุดติดตั้ง Downtown A', active: true },
                { name: 'จุดติดตั้ง Central Park B', active: false },
                { name: 'จุดติดตั้ง Metro West C', active: false },
                { name: 'จุดติดตั้ง North Hub D', active: false }
              ].map((station, idx) => (
                <div key={idx} className={`station-card ${station.active ? 'active' : ''}`}>
                  <div className="station-icon-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h4"/></svg>
                  </div>
                  <span className="station-name">{station.name}</span>
                  <div className="station-status-indicator">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Markers */}
          <div className="map-marker marker-1">
             <div className="marker-bg active">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>
             </div>
          </div>
          <div className="map-marker marker-2">
             <div className="marker-bg alert">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
             </div>
          </div>
          <div className="map-marker marker-3">
             <div className="marker-bg station">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M7 7v10"/><path d="M11 7v10"/><path d="M15 7v10"/></svg>
             </div>
          </div>

          {/* Station Popup */}
          {selectedStation && (
            <div className="station-popup">
              <div className="popup-header">
                <div>
                  <h2>จุดติดตั้ง Downtown A</h2>
                  <p className="station-id">รหัสเครื่อง: ECO-9942</p>
                </div>
                <button className="close-btn" onClick={() => setSelectedStation(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                </button>
              </div>
              
              <div className="popup-tags">
                <span className="tag tag-online"><span className="map-dot"></span> ออนไลน์</span>
                <span className="tag tag-capacity">ความจุ: 45%</span>
              </div>

              <div className="operator-card">
                <span className="op-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  ผู้ปฏิบัติงานดูแล
                </span>
                <div className="op-info">
                  <img src="https://i.pravatar.cc/150?img=32" alt="Sarah Jenkins" />
                  <span>Sarah Jenkins</span>
                </div>
              </div>

              <div className="map-popup-actions">
                <button className="btn-outline">ดูประวัติการทำงาน</button>
                <button className="btn-primary">มอบหมายเจ้าหน้าที่</button>
              </div>
            </div>
          )}

          {/* Map Controls */}
          <div className="map-controls">
            <div className="zoom-controls">
              <button>+</button>
              <button>-</button>
            </div>
            <button className="location-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapView;