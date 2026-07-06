<?php
global $router;

// ----- auth api------


$router->post('/api/login','AuthController','login');
$router->post('/api/logout','AuthController','logout');
$router->post('/api/register','AuthController','register');




// ----- machine api------

$router->get('/api/machine/{id}','MachineController','getMachineByUser');
$router->post('/api/machine','MachineController','addMachine');
$router->delete('/api/machine/{id}','MachineController','deleteMachine');

// ----- Admin API ------
$router->get('/api/admin/machines', 'AdminController', 'getMachines');
$router->put('/api/admin/users/{id}/status', 'AdminController', 'updateUserStatus');
$router->put('/api/admin/machines/{id}/status', 'AdminController', 'updateMachineStatus');
$router->put('/api/admin/machines/{id}/approve', 'AdminController', 'approveMachine');
$router->get('/api/admin/dashboard', 'AdminController', 'getDashboardStats');
$router->get('/api/admin/operators', 'AdminController', 'getOperators');

// ----- Operator API ------
// getMachineByUser and addMachine already exist, but can also add specific operator logic:
$router->put('/api/operator/machines/{id}/config', 'OperatorController', 'updateMachineConfig');
$router->get('/api/operator/machines/{id}/config', 'OperatorController', 'getMachineConfig');
$router->get('/api/operator/machines/{id}/users', 'OperatorController', 'getMachineUsers');
$router->get('/api/operator/machines/{id}/redeem-requests', 'OperatorController', 'getRedeemRequests');
$router->put('/api/operator/redeem-requests/{id}/approve', 'OperatorController', 'approveRedeem');
$router->put('/api/operator/redeem-requests/{id}/reject', 'OperatorController', 'rejectRedeem');

// ----- User API ------
$router->post('/api/user/machines/{m_id}/register', 'UserController', 'register');
$router->post('/api/user/machines/{m_id}/login', 'UserController', 'login');
$router->post('/api/user/machines/{m_id}/deposit', 'UserController', 'deposit');
$router->post('/api/user/machines/{m_id}/redeem', 'UserController', 'redeem');
$router->get('/api/user/me', 'UserController', 'getProfile');
$router->get('/api/user/profile/{id}', 'UserController', 'getUserProfileById');
$router->get('/api/user/history', 'UserController', 'getHistory');

?>