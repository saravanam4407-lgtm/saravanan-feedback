/**
 * AuraFeedback REST API Server
 * 
 * Supports MySQL 8.0+ Database and local JSON storage fallback.
 * Native HTTP server with CORS, sentiment analysis, real-time analytics,
 * and feedback management.
 */

const http = require('http');
const url = require('url');
const { db, initDatabase } = require('./db');

const PORT = process.env.PORT || 5000;

// Sentiment lexicon for automated analysis
const SENTIMENT_WORDS = {
  positive: [
    'love', 'like', 'great', 'awesome', 'amazing', 'excellent', 'fast', 'easy',
    'best', 'wonderful', 'good', 'perfect', 'helpful', 'beautiful', 'clean',
    'intuitive', 'smooth', 'satisfied', 'thrilled', 'nice', 'friendly'
  ],
  negative: [
    'slow', 'bad', 'bug', 'buggy', 'expensive', 'hate', 'fail', 'worst',
    'broken', 'error', 'poor', 'terrible', 'hard', 'difficult', 'dislike',
    'delay', 'delayed', 'rude', 'glitch', 'confusing', 'overpriced', 'flimsy', 'damaged'
  ]
};

const TAGS_BY_CATEGORY = {
  'UX/UI': ['Clean Design', 'Confusing Layout', 'Mobile Friendly', 'Glitchy', 'Intuitive Navigation'],
  'Product Quality': ['High Quality', 'Damaged Item', 'Durable Material', 'Flimsy', 'Premium Feel'],
  'Customer Service': ['Fast Response', 'Rude Agent', 'Very Helpful Support', 'No Follow-up', 'Polite Staff'],
  'Delivery': ['Super Fast Delivery', 'Late Delivery', 'Damaged Package', 'Accurate Tracking', 'Free Shipping'],
  'Pricing': ['Great Value', 'Overpriced', 'Expensive', 'Affordable', 'Good Discount'],
  'General': ['Highly Recommend', 'Needs Improvement', 'Satisfied Customer', 'Poor Experience']
};

function analyzeSentiment(text, rating) {
  if (!text) {
    if (rating >= 4) return 'positive';
    if (rating <= 2) return 'negative';
    return 'neutral';
  }

  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  let score = 0;

  for (const word of words) {
    if (SENTIMENT_WORDS.positive.includes(word)) score += 1;
    if (SENTIMENT_WORDS.negative.includes(word)) score -= 1;
  }

  if (rating) {
    if (rating >= 4) score += 1;
    if (rating <= 2) score -= 1;
  }

  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function computeMetrics(feedbacks) {
  const total = feedbacks.length;
  if (total === 0) {
    return {
      total: 0,
      avgRating: 0,
      npsScore: 0,
      csatScore: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0, positivePct: 0, neutralPct: 0, negativePct: 0 },
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      categoryBreakdown: {}
    };
  }

  let ratingSum = 0;
  let promoters = 0;
  let detractors = 0;
  let satisfied = 0;
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const categoryBreakdown = {};

  feedbacks.forEach(item => {
    const r = Number(item.rating) || 0;
    ratingSum += r;

    if (r === 5) promoters++;
    else if (r <= 2) detractors++;

    if (r >= 4) satisfied++;

    if (ratingDistribution[r] !== undefined) {
      ratingDistribution[r]++;
    }

    const s = item.sentiment || 'neutral';
    if (sentimentCounts[s] !== undefined) {
      sentimentCounts[s]++;
    }

    const cat = item.category || 'General';
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
  });

  return {
    total,
    avgRating: Number((ratingSum / total).toFixed(1)),
    npsScore: Math.round(((promoters - detractors) / total) * 100),
    csatScore: Math.round((satisfied / total) * 100),
    sentiment: {
      positive: sentimentCounts.positive,
      neutral: sentimentCounts.neutral,
      negative: sentimentCounts.negative,
      positivePct: Math.round((sentimentCounts.positive / total) * 100),
      neutralPct: Math.round((sentimentCounts.neutral / total) * 100),
      negativePct: Math.round((sentimentCounts.negative / total) * 100)
    },
    ratingDistribution,
    categoryBreakdown
  };
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', err => reject(err));
  });
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
  });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();
  const query = parsedUrl.query;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  try {
    // 1. Health
    if (pathname === '/api/health' && method === 'GET') {
      sendJsonResponse(res, 200, {
        status: 'online',
        database: db.isUsingMySQL() ? 'MySQL' : 'JSON (Local)',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. Tags
    if (pathname === '/api/tags' && method === 'GET') {
      sendJsonResponse(res, 200, {
        categories: Object.keys(TAGS_BY_CATEGORY),
        tagsByCategory: TAGS_BY_CATEGORY
      });
      return;
    }

    // 3. Products
    if (pathname === '/api/products' && method === 'GET') {
      const products = await db.getProducts();
      sendJsonResponse(res, 200, { success: true, count: products.length, products });
      return;
    }

    const productMatch = pathname.match(/^\/api\/products\/([^/]+)$/);
    if (productMatch && method === 'GET') {
      const product = await db.getProductById(productMatch[1]);
      if (!product) return sendJsonResponse(res, 404, { success: false, error: 'Product not found' });
      sendJsonResponse(res, 200, { success: true, product });
      return;
    }

    // 4. Feedbacks Stats
    if (pathname === '/api/feedbacks/stats' && method === 'GET') {
      const feedbacks = await db.getFeedbacks();
      const stats = computeMetrics(feedbacks);
      sendJsonResponse(res, 200, { success: true, database: db.isUsingMySQL() ? 'MySQL' : 'JSON', stats });
      return;
    }

    // 5. Feedbacks Collection
    if (pathname === '/api/feedbacks') {
      if (method === 'GET') {
        const feedbacks = await db.getFeedbacks(query);
        sendJsonResponse(res, 200, {
          success: true,
          database: db.isUsingMySQL() ? 'MySQL' : 'JSON',
          total: feedbacks.length,
          feedbacks
        });
        return;
      }

      if (method === 'POST') {
        const body = await parseRequestBody(req);
        if (!body.name || !body.comment || !body.rating) {
          sendJsonResponse(res, 400, { success: false, error: 'Missing required fields: name, comment, and rating.' });
          return;
        }

        const ratingNum = parseInt(body.rating, 10);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
          sendJsonResponse(res, 400, { success: false, error: 'Rating must be an integer between 1 and 5.' });
          return;
        }

        const sentiment = body.sentiment || analyzeSentiment(body.comment, ratingNum);
        const ticketId = body.id || `AF-${Math.floor(10000 + Math.random() * 90000)}-TKT`;

        const newFeedback = {
          id: ticketId,
          name: String(body.name).trim(),
          email: body.email ? String(body.email).trim() : 'N/A',
          rating: ratingNum,
          category: body.category || 'Product Quality',
          comment: String(body.comment).trim(),
          tags: Array.isArray(body.tags) ? body.tags : [],
          sentiment,
          status: 'open',
          product: body.product || null,
          date: new Date().toISOString()
        };

        const saved = await db.createFeedback(newFeedback);
        sendJsonResponse(res, 201, {
          success: true,
          message: 'Feedback submitted successfully',
          database: db.isUsingMySQL() ? 'MySQL' : 'JSON',
          feedback: saved
        });
        return;
      }
    }

    // 6. Individual Feedback Item
    const feedbackItemMatch = pathname.match(/^\/api\/feedbacks\/([^/]+)$/);
    if (feedbackItemMatch) {
      const feedbackId = feedbackItemMatch[1];

      if (method === 'GET') {
        const item = await db.getFeedbackById(feedbackId);
        if (!item) return sendJsonResponse(res, 404, { success: false, error: `Ticket '${feedbackId}' not found.` });
        sendJsonResponse(res, 200, { success: true, feedback: item });
        return;
      }

      if (method === 'DELETE') {
        const deleted = await db.deleteFeedback(feedbackId);
        if (!deleted) return sendJsonResponse(res, 404, { success: false, error: `Ticket '${feedbackId}' not found.` });
        sendJsonResponse(res, 200, { success: true, message: 'Ticket deleted successfully', feedback: deleted });
        return;
      }

      if (method === 'PATCH' || method === 'PUT') {
        const body = await parseRequestBody(req);
        if (!body.status) return sendJsonResponse(res, 400, { success: false, error: 'status is required' });
        const updated = await db.updateStatus(feedbackId, body.status);
        if (!updated) return sendJsonResponse(res, 404, { success: false, error: `Ticket '${feedbackId}' not found.` });
        sendJsonResponse(res, 200, { success: true, message: 'Status updated successfully', feedback: updated });
        return;
      }
    }

    // 7. Reply
    const replyMatch = pathname.match(/^\/api\/feedbacks\/([^/]+)\/reply$/);
    if (replyMatch && method === 'POST') {
      const feedbackId = replyMatch[1];
      const body = await parseRequestBody(req);

      if (!body.replyText || !body.replyText.trim()) {
        sendJsonResponse(res, 400, { success: false, error: 'replyText is required.' });
        return;
      }

      const replyObj = {
        id: `REP-${Date.now()}`,
        author: body.author || 'Customer Success',
        text: String(body.replyText).trim(),
        date: new Date().toISOString()
      };

      const updated = await db.addReply(feedbackId, replyObj);
      if (!updated) return sendJsonResponse(res, 404, { success: false, error: `Ticket '${feedbackId}' not found.` });

      sendJsonResponse(res, 200, {
        success: true,
        message: 'Reply added successfully',
        database: db.isUsingMySQL() ? 'MySQL' : 'JSON',
        feedback: updated
      });
      return;
    }

    // Root
    if (pathname === '/' || pathname === '/api') {
      sendJsonResponse(res, 200, {
        name: 'AuraFeedback API Server',
        database: db.isUsingMySQL() ? 'MySQL' : 'JSON (Local)',
        status: 'online',
        endpoints: {
          health: 'GET /api/health',
          products: 'GET /api/products',
          feedbacks: 'GET /api/feedbacks, POST /api/feedbacks',
          stats: 'GET /api/feedbacks/stats',
          reply: 'POST /api/feedbacks/:id/reply'
        }
      });
      return;
    }

    sendJsonResponse(res, 404, { success: false, error: 'Not Found' });
  } catch (err) {
    console.error('Server error:', err);
    sendJsonResponse(res, 500, { success: false, error: 'Internal Server Error', message: err.message });
  }
});

// Boot Database & Server
initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`=================================================`);
    console.log(`  🚀 AuraFeedback Backend Server is Running!`);
    console.log(`  📡 URL: http://localhost:${PORT}`);
    console.log(`  🗄️ Database: ${db.isUsingMySQL() ? 'MySQL' : 'JSON (Local fallback)'}`);
    console.log(`=================================================`);
  });
});
