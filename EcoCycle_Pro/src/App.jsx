import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './css/index.css';
import { AuthProvider } from './context/AuthContext';
import Landing_Page from './Landing_Page';
import Login from './login';
import OpRegister from './op_register';
import MyMachine from './my_machine';
import MachineConfig from './machine_config';
import MapView from './map';
import Overview from './overview';
import Analytics from './analytics';
import MemberRegister from './member_register';
import MemberLoginMachine from './member_login_machine';
import MemberDashboard from './member_dashboard';
import MemberDeposit from './member_deposit';
import MemberRedeem from './member_redeem';
import MemberProfile from './member_profile';
import MemberHistory from './member_history';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Landing_Page />} />
        <Route path="/login" element={<Login />} />
        <Route path="/op_register" element={<OpRegister />} />
        <Route path="/my_machine" element={<MyMachine />} />
        <Route path="/machine_config/:machineId" element={<MachineConfig />} />
        <Route path="/machine_config" element={<MachineConfig />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/register/:m_id" element={<MemberRegister />} />
        
        <Route path="/member_login_machine" element={<MemberLoginMachine />} />
        <Route path="/member_login_machine/:m_id" element={<MemberLoginMachine />} />
        <Route path="/member_dashboard" element={<MemberDashboard />} />
        <Route path="/member_dashboard/:userId" element={<MemberDashboard />} />
        <Route path="/member_deposit" element={<MemberDeposit />} />
        <Route path="/member_redeem" element={<MemberRedeem />} />
        <Route path="/member_profile" element={<MemberProfile />} />
        <Route path="/member_history" element={<MemberHistory />} />
        
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;