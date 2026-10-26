/**
 * AuraFeedback Database Connection Module
 * 
 * Supports MySQL 8.0+ with automatic graceful fallback to local JSON database.
 * No external dependencies required to run with local JSON.
 * When `mysql2` is installed, seamlessly queries the MySQL database!
 */

const fs = require('fs');
const path = require('path');

// 1. Light .env reader (zero-dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'saravanan@4407',
  database: process.env.DB_NAME || 'aurafeedback_db'
};

const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const FEEDBACKS_FILE = path.join(DATA_DIR, 'feedbacks.json');

let pool = null;
let useMySQL = false;

// Initialize MySQL pool if mysql2 is available
async function initDatabase() {
  try {
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log(`✅ [MySQL] Successfully connected to database: ${config.database} on ${config.host}:${config.port}`);

    // Ensure schema tables exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`img\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`feedbacks\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`product_id\` VARCHAR(50) DEFAULT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) DEFAULT 'N/A',
        \`rating\` TINYINT NOT NULL,
        \`category\` VARCHAR(100) DEFAULT 'Product Quality',
        \`comment\` TEXT NOT NULL,
        \`tags\` JSON DEFAULT NULL,
        \`sentiment\` ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
        \`status\` VARCHAR(50) DEFAULT 'open',
        \`date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_feedback_product\`
          FOREIGN KEY (\`product_id\`) REFERENCES \`products\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`feedback_replies\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`feedback_id\` VARCHAR(50) NOT NULL,
        \`author\` VARCHAR(255) DEFAULT 'Customer Success',
        \`reply_text\` TEXT NOT NULL,
        \`date\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT \`fk_reply_feedback\`
          FOREIGN KEY (\`feedback_id\`) REFERENCES \`feedbacks\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure store products are seeded if products table is empty
    const [pCount] = await connection.query('SELECT COUNT(*) AS count FROM products');
    if (pCount[0].count === 0) {
      const localProducts = readJson(PRODUCTS_FILE);
      for (const prod of localProducts) {
        await connection.query(
          'INSERT IGNORE INTO products (id, name, category, img) VALUES (?, ?, ?, ?)',
          [prod.id, prod.name, prod.category, prod.img]
        );
      }
      console.log(`📦 [MySQL] Seeded ${localProducts.length} store catalog products.`);
    }

    connection.release();
    useMySQL = true;
  } catch (err) {
    useMySQL = false;
    console.log(`ℹ️  [Database] MySQL not active (${err.code || err.message}).`);
    console.log(`📂 [Database] Gracefully using local JSON storage in backend/data/.`);
    console.log(`💡 [Tip] To connect to MySQL: install mysql2 (npm install mysql2) and set your password in backend/.env`);
  }
}

// JSON Fallback Helpers
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

// Database Methods Interface
const db = {
  isUsingMySQL: () => useMySQL,

  // Products
  async getProducts() {
    if (useMySQL) {
      try {
        const [rows] = await pool.query('SELECT id, name, category, img FROM products ORDER BY id ASC');
        return rows;
      } catch (e) {
        console.error('MySQL query error in getProducts:', e.message);
      }
    }
    return readJson(PRODUCTS_FILE);
  },

  async getProductById(id) {
    if (useMySQL) {
      try {
        const [rows] = await pool.query('SELECT id, name, category, img FROM products WHERE id = ?', [id]);
        return rows[0] || null;
      } catch (e) {
        console.error('MySQL query error in getProductById:', e.message);
      }
    }
    const products = readJson(PRODUCTS_FILE);
    return products.find(p => p.id === id) || null;
  },

  // Feedbacks
  async getFeedbacks(filters = {}) {
    if (useMySQL) {
      try {
        let query = `
          SELECT 
            f.id, f.name, f.email, f.rating, f.category, f.comment, f.tags, 
            f.sentiment, f.status, f.date,
            p.id AS product_id, p.name AS product_name, p.category AS product_category, p.img AS product_img
          FROM feedbacks f
          LEFT JOIN products p ON f.product_id = p.id
          WHERE 1=1
        `;
        const params = [];

        if (filters.search) {
          const s = `%${filters.search}%`;
          query += ` AND (f.name LIKE ? OR f.email LIKE ? OR f.comment LIKE ? OR f.id LIKE ? OR p.name LIKE ?)`;
          params.push(s, s, s, s, s);
        }

        if (filters.category && filters.category !== 'all') {
          query += ` AND f.category = ?`;
          params.push(filters.category);
        }

        if (filters.rating && filters.rating !== 'all') {
          query += ` AND f.rating = ?`;
          params.push(parseInt(filters.rating, 10));
        }

        if (filters.sentiment && filters.sentiment !== 'all') {
          query += ` AND f.sentiment = ?`;
          params.push(filters.sentiment);
        }

        query += ` ORDER BY f.date DESC`;

        const [rows] = await pool.query(query, params);

        // Fetch replies for each feedback
        const [allReplies] = await pool.query('SELECT id, feedback_id, author, reply_text, date FROM feedback_replies ORDER BY date ASC');
        const repliesByFeedback = {};
        allReplies.forEach(r => {
          if (!repliesByFeedback[r.feedback_id]) repliesByFeedback[r.feedback_id] = [];
          repliesByFeedback[r.feedback_id].push({
            id: r.id,
            author: r.author,
            text: r.reply_text,
            date: r.date
          });
        });

        return rows.map(r => ({
          id: r.id,
          name: r.name,
          email: r.email,
          rating: r.rating,
          category: r.category,
          comment: r.comment,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
          sentiment: r.sentiment,
          status: r.status,
          date: r.date,
          product: r.product_id ? {
            id: r.product_id,
            name: r.product_name,
            category: r.product_category,
            img: r.product_img
          } : null,
          replies: repliesByFeedback[r.id] || []
        }));
      } catch (e) {
        console.error('MySQL query error in getFeedbacks, using JSON fallback:', e.message);
      }
    }

    // JSON fallback
    let items = readJson(FEEDBACKS_FILE);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(f =>
        (f.name || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.comment || '').toLowerCase().includes(q) ||
        (f.id || '').toLowerCase().includes(q) ||
        (f.product && (f.product.name || '').toLowerCase().includes(q))
      );
    }
    if (filters.category && filters.category !== 'all') items = items.filter(f => f.category === filters.category);
    if (filters.rating && filters.rating !== 'all') items = items.filter(f => Number(f.rating) === parseInt(filters.rating, 10));
    if (filters.sentiment && filters.sentiment !== 'all') items = items.filter(f => f.sentiment === filters.sentiment);
    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    return items;
  },

  async getFeedbackById(id) {
    if (useMySQL) {
      try {
        const [rows] = await pool.query(`
          SELECT 
            f.id, f.name, f.email, f.rating, f.category, f.comment, f.tags, 
            f.sentiment, f.status, f.date,
            p.id AS product_id, p.name AS product_name, p.category AS product_category, p.img AS product_img
          FROM feedbacks f
          LEFT JOIN products p ON f.product_id = p.id
          WHERE f.id = ?
        `, [id]);

        if (rows.length === 0) return null;
        const r = rows[0];

        const [replies] = await pool.query(
          'SELECT id, author, reply_text AS text, date FROM feedback_replies WHERE feedback_id = ? ORDER BY date ASC',
          [id]
        );

        return {
          id: r.id,
          name: r.name,
          email: r.email,
          rating: r.rating,
          category: r.category,
          comment: r.comment,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []),
          sentiment: r.sentiment,
          status: r.status,
          date: r.date,
          product: r.product_id ? {
            id: r.product_id,
            name: r.product_name,
            category: r.product_category,
            img: r.product_img
          } : null,
          replies
        };
      } catch (e) {
        console.error('MySQL getFeedbackById error:', e.message);
      }
    }
    const list = readJson(FEEDBACKS_FILE);
    return list.find(f => f.id === id) || null;
  },

  async createFeedback(fb) {
    if (useMySQL) {
      try {
        const rawProductId = (fb.product && fb.product.id) ? fb.product.id : (fb.product_id || fb.productId || null);
        let validProductId = null;
        if (rawProductId) {
          const [pRows] = await pool.query('SELECT id FROM products WHERE id = ?', [rawProductId]);
          if (pRows.length > 0) {
            validProductId = rawProductId;
          }
        }

        const tagsJson = JSON.stringify(fb.tags || []);

        await pool.query(
          `INSERT INTO feedbacks (id, product_id, name, email, rating, category, comment, tags, sentiment, status, date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fb.id, validProductId, fb.name, fb.email || 'N/A', fb.rating,
            fb.category || 'Product Quality', fb.comment, tagsJson,
            fb.sentiment || 'neutral', fb.status || 'open',
            fb.date ? new Date(fb.date) : new Date()
          ]
        );
        const stored = await this.getFeedbackById(fb.id);
        return stored || fb;
      } catch (e) {
        console.error('MySQL createFeedback error, saving to JSON fallback:', e.message);
      }
    }

    const feedbacks = readJson(FEEDBACKS_FILE);
    feedbacks.unshift(fb);
    writeJson(FEEDBACKS_FILE, feedbacks);
    return fb;
  },

  async addReply(feedbackId, reply) {
    if (useMySQL) {
      try {
        await pool.query(
          `INSERT INTO feedback_replies (id, feedback_id, author, reply_text, date) VALUES (?, ?, ?, ?, ?)`,
          [reply.id, feedbackId, reply.author || 'Support Team', reply.text, new Date(reply.date)]
        );
        await pool.query(`UPDATE feedbacks SET status = 'resolved' WHERE id = ?`, [feedbackId]);
        return await this.getFeedbackById(feedbackId);
      } catch (e) {
        console.error('MySQL addReply error, falling back to JSON:', e.message);
      }
    }

    const feedbacks = readJson(FEEDBACKS_FILE);
    const fb = feedbacks.find(f => f.id === feedbackId);
    if (fb) {
      if (!Array.isArray(fb.replies)) fb.replies = [];
      fb.replies.push(reply);
      fb.status = 'resolved';
      writeJson(FEEDBACKS_FILE, feedbacks);
      return fb;
    }
    return null;
  },

  async deleteFeedback(id) {
    if (useMySQL) {
      try {
        const item = await this.getFeedbackById(id);
        if (item) {
          await pool.query('DELETE FROM feedbacks WHERE id = ?', [id]);
          return item;
        }
        return null;
      } catch (e) {
        console.error('MySQL deleteFeedback error, falling back to JSON:', e.message);
      }
    }

    const feedbacks = readJson(FEEDBACKS_FILE);
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx !== -1) {
      const removed = feedbacks.splice(idx, 1)[0];
      writeJson(FEEDBACKS_FILE, feedbacks);
      return removed;
    }
    return null;
  },

  async updateStatus(id, status) {
    if (useMySQL) {
      try {
        await pool.query('UPDATE feedbacks SET status = ? WHERE id = ?', [status, id]);
        return await this.getFeedbackById(id);
      } catch (e) {
        console.error('MySQL updateStatus error, falling back to JSON:', e.message);
      }
    }

    const feedbacks = readJson(FEEDBACKS_FILE);
    const fb = feedbacks.find(f => f.id === id);
    if (fb) {
      fb.status = status;
      writeJson(FEEDBACKS_FILE, feedbacks);
      return fb;
    }
    return null;
  }
};

module.exports = { db, initDatabase };
