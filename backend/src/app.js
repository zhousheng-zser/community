const express = require('express');
const cors = require('cors');
const jdBenefitRouter = require('./routes/jdBenefit');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'community-backend' });
});

app.use('/api/v1/jd', jdBenefitRouter);

app.use((req, res) => {
  res.status(404).json({ errno: 404, errmsg: 'not found' });
});

module.exports = app;
