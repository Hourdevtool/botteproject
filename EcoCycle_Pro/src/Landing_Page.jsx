import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing_Page = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-page" id="top">
      <header className="navbar">
        <div className="container">
          <div className="logo">
            <div className="recycle-icon">♻</div>
            <span className="logo-text">EcoCycle Pro</span>
          </div>
          <button
            type="button"
            className={`menu-toggle${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="เปิดเมนูหลัก"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          <div className={`nav-group${menuOpen ? ' open' : ''}`}>
            <nav className="nav-links">
              <a href="#top" className="active" onClick={() => setMenuOpen(false)}>หน้าแรก</a>
              <a href="#how-it-works" onClick={() => setMenuOpen(false)}>วิธีการทำงาน</a>
              <a href="#footer" onClick={() => setMenuOpen(false)}>ติดต่อเรา</a>
            </nav>
            <div className="auth-buttons">
              <button className="btn-partner" onClick={() => navigate('/op_register')}>ร่วมเป็นพันธมิตร</button>
              <button className="btn-login" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="landing-badge">
              <span className="leaf-icon">🍃</span> โครงสร้างพื้นฐานการรีไซเคิลอัจฉริยะ
            </div>
            <h1>เปลี่ยนขยะให้เป็น <br /><span className="landing-text-green">คุณค่าที่ยั่งยืน</span></h1>
            <p>EcoCycle Pro คือผู้นำด้านระบบตู้รับซื้อขยะรีไซเคิลอัตโนมัติ ที่พร้อมช่วยให้คุณจัดการทรัพยากรได้อย่างมีประสิทธิภาพและคุ้มค่า...</p>
            <button className="btn-deploy" onClick={() => navigate('/op_register')}>สนใจติดตั้งเครื่องจักร →</button>
          </div>
          <div className="hero-image">
            <div className="image-card">
              <img src="https://via.placeholder.com/400x400" alt="Recycling Machine" />
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="section-header">
          <h2>วิธีการทำงาน</h2>
          <p>ขั้นตอนที่ง่ายและได้รางวัล ออกแบบมาเพื่อส่งเสริมพฤติกรรมรักษ์โลกที่ยั่งยืน</p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="icon-wrapper color-1">🧴</div>
              <h3>1. ใส่ขวด</h3>
              <p>นำขวดพลาสติกเปล่าใส่ลงในเครื่องคัดแยกอัจฉริยะ EcoCycle เซ็นเซอร์ในตัวเครื่องจะตรวจสอบประเภทวัสดุและปริมาตรทันที</p>
            </div>

            <div className="step-card">
              <div className="icon-wrapper color-2">💳</div>
              <h3>2. รับคะแนน</h3>
              <p>บัญชี EcoCycle Pro ของคุณจะได้รับ EcoPoints เข้าสู่ระบบทันที โดยคำนวณจากจำนวนและประเภทของวัสดุที่นำมารีไซเคิล</p>
            </div>

            <div className="step-card">
              <div className="icon-wrapper color-3">🎁</div>
              <h3>3. แลกรางวัล</h3>
              <p>นำ EcoPoints ที่สะสมไว้มาแลกเป็นคูปองดิจิทัล บัตรโดยสาร หรือนำไปบริจาคเพื่อสนับสนุนโครงการด้านสิ่งแวดล้อมในชุมชน</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" id="footer">
        <div className="footer-logo">
          <span className="recycle-icon">♻</span>
          <span className="logo-text">EcoCycle Pro</span>
        </div>
        <p className="footer-slogan">เสริมสร้างพลังให้ชุมชน ผ่านทรัพยากรหมุนเวียนที่ยั่งยืน</p>
        <p className="footer-copy">© 2024 EcoCycle Pro สงวนลิขสิทธิ์</p>
      </footer>
    </div>
  );
};

export default Landing_Page;