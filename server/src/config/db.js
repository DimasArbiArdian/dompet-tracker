const mongoose = require('mongoose');
const dns = require('dns');

// Fix for Windows / ISP DNS blocking MongoDB SRV queries
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('[DNS] Warning setting custom DNS servers:', dnsErr.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
