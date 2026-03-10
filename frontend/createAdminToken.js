const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../backend/.env' });
// Secret from backend/.env: 8f4b7e1c9d2a5f6b3c4e7a9d1f8c2b6e4a7d9c1f3b5e6a8d2c4f7a9b1e3d5c7
const token = jwt.sign({ id: 'any-id', role: 'admin' }, process.env.JWT_SECRET || '8f4b7e1c9d2a5f6b3c4e7a9d1f8c2b6e4a7d9c1f3b5e6a8d2c4f7a9b1e3d5c7', { expiresIn: '1h' });
console.log(token);
