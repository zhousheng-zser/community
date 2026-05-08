const path = require('path');
const express = require('express');
const testApp = express();
testApp.use(express.json());

// 模拟 authMiddleware
const mockAuth = (req, res, next) => { req.user = { id: 1, role: 'service_provider' }; next(); };

// 挂载路由（脚本在 scripts/ 目录，项目根目录是其父目录）
const routesPath = path.join(__dirname, '..', 'backend', 'src', 'modules', 'service-provider-portal', 'routes.js');
testApp.use('/api/v1/service-provider', mockAuth, require(routesPath));

// 收集路由
const routes = [];
function collectRoutes(stack, prefix) {
  stack.forEach(layer => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
      routes.push(methods + ' ' + prefix + layer.route.path);
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      collectRoutes(layer.handle.stack, prefix);
    }
  });
}
collectRoutes(testApp._router.stack, '/api/v1/service-provider');
routes.forEach(r => console.log(r));
