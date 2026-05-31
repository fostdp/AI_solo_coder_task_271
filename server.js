const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const RECORDS_FILE = path.join(__dirname, 'experiment-records.json');
const DESIGNS_FILE = path.join(__dirname, 'experiment-designs.json');

function readData(file) {
  try {
    if (fs.existsSync(file)) {
      const data = fs.readFileSync(file, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('读取数据失败:', e);
  }
  return [];
}

function saveData(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('保存数据失败:', e);
    return false;
  }
}

app.get('/api/records', (req, res) => {
  const records = readData(RECORDS_FILE);
  res.json({ success: true, records });
});

app.post('/api/records', (req, res) => {
  const record = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  
  const records = readData(RECORDS_FILE);
  records.push(record);
  
  if (saveData(RECORDS_FILE, records)) {
    res.json({ success: true, record });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

app.delete('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let records = readData(RECORDS_FILE);
  records = records.filter(r => r.id !== id);
  
  if (saveData(RECORDS_FILE, records)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

app.get('/api/designs', (req, res) => {
  const designs = readData(DESIGNS_FILE);
  res.json({ success: true, designs });
});

app.post('/api/designs', (req, res) => {
  const design = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    name: req.body.name || `实验方案 ${Date.now()}`,
    steps: req.body.steps || []
  };
  
  const designs = readData(DESIGNS_FILE);
  designs.push(design);
  
  if (saveData(DESIGNS_FILE, designs)) {
    res.json({ success: true, design });
  } else {
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

app.delete('/api/designs/:id', (req, res) => {
  const id = parseInt(req.params.id);
  let designs = readData(DESIGNS_FILE);
  designs = designs.filter(d => d.id !== id);
  
  if (saveData(DESIGNS_FILE, designs)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, message: '删除失败' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`🧪 虚拟化学实验平台`);
  console.log(`========================================`);
  console.log(`📡 服务器运行在: http://localhost:${PORT}`);
  console.log(`📁 数据文件:`);
  console.log(`   - 实验记录: ${RECORDS_FILE}`);
  console.log(`   - 实验方案: ${DESIGNS_FILE}`);
  console.log(`========================================`);
});
