const express = require('express');
const cors = require('cors');
const jdBenefitRouter = require('./routes/jdBenefit');
const adminRouter = require('./routes/admin');
const { login } = require('./controllers/adminAuthController');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'community-backend' });
});

// 登录必须挂在 router 外：部分部署在 /api/v1/admin 整段套了 JWT，会先 401 挡住 /admin/login
app.post('/api/v1/admin/login', login);
app.post('/api/v1/auth/admin/login', login);

app.use('/api/v1/jd', jdBenefitRouter);
app.use('/api/v1/admin', adminRouter);

app.use((req, res) => {
  res.status(404).json({ errno: 404, errmsg: 'not found' });
});

module.exports = app;
