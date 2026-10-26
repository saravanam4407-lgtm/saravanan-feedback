"""
AuraFeedback REST API Server (Python Edition)

Built with Python standard library (Zero pip dependencies required!)
Runs with: python server.py
"""

import http.server
import json
import os
import re
import socketserver
import urllib.parse
from datetime import datetime

PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
FEEDBACKS_FILE = os.path.join(DATA_DIR, "feedbacks.json")

# Load backend/.env if present
env_file = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_file):
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

DB_HOST = os.environ.get("DB_HOST", "127.0.0.1")
DB_PORT = int(os.environ.get("DB_PORT", 3306))
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "saravanan@4407")
DB_NAME = os.environ.get("DB_NAME", "aurafeedback_db")

os.makedirs(DATA_DIR, exist_ok=True)

SENTIMENT_WORDS = {
    "positive": [
        "love", "like", "great", "awesome", "amazing", "excellent", "fast", "easy",
        "best", "wonderful", "good", "perfect", "helpful", "beautiful", "clean",
        "intuitive", "smooth", "satisfied", "thrilled", "nice", "friendly"
    ],
    "negative": [
        "slow", "bad", "bug", "buggy", "expensive", "hate", "fail", "worst",
        "broken", "error", "poor", "terrible", "hard", "difficult", "dislike",
        "delay", "delayed", "rude", "glitch", "confusing", "overpriced", "flimsy", "damaged"
    ]
}

TAGS_BY_CATEGORY = {
    "UX/UI": ["Clean Design", "Confusing Layout", "Mobile Friendly", "Glitchy", "Intuitive Navigation"],
    "Product Quality": ["High Quality", "Damaged Item", "Durable Material", "Flimsy", "Premium Feel"],
    "Customer Service": ["Fast Response", "Rude Agent", "Very Helpful Support", "No Follow-up", "Polite Staff"],
    "Delivery": ["Super Fast Delivery", "Late Delivery", "Damaged Package", "Accurate Tracking", "Free Shipping"],
    "Pricing": ["Great Value", "Overpriced", "Expensive", "Affordable", "Good Discount"],
    "General": ["Highly Recommend", "Needs Improvement", "Satisfied Customer", "Poor Experience"]
}


def read_json_file(file_path, default=None):
    if default is None:
        default = []
    if not os.path.exists(file_path):
        write_json_file(file_path, default)
        return default
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return default


def write_json_file(file_path, data):
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error writing {file_path}: {e}")
        return False


def analyze_sentiment(text, rating=None):
    if not text:
        if rating and rating >= 4:
            return "positive"
        if rating and rating <= 2:
            return "negative"
        return "neutral"

    words = re.findall(r"\b\w+\b", text.lower())
    score = 0
    for word in words:
        if word in SENTIMENT_WORDS["positive"]:
            score += 1
        if word in SENTIMENT_WORDS["negative"]:
            score -= 1

    if rating:
        if rating >= 4:
            score += 1
        elif rating <= 2:
            score -= 1

    if score > 0:
        return "positive"
    elif score < 0:
        return "negative"
    return "neutral"


def compute_metrics(feedbacks):
    total = len(feedbacks)
    if total == 0:
        return {
            "total": 0,
            "avgRating": 0,
            "npsScore": 0,
            "csatScore": 0,
            "sentiment": {
                "positive": 0, "neutral": 0, "negative": 0,
                "positivePct": 0, "neutralPct": 0, "negativePct": 0
            },
            "ratingDistribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
            "categoryBreakdown": {}
        }

    rating_sum = 0
    promoters = 0
    detractors = 0
    satisfied = 0
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    rating_distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
    category_breakdown = {}

    for item in feedbacks:
        r = int(item.get("rating", 0))
        rating_sum += r

        if r == 5:
            promoters += 1
        elif r <= 2:
            detractors += 1

        if r >= 4:
            satisfied += 1

        r_str = str(r)
        if r_str in rating_distribution:
            rating_distribution[r_str] += 1

        s = item.get("sentiment", "neutral")
        if s in sentiment_counts:
            sentiment_counts[s] += 1

        cat = item.get("category", "General")
        category_breakdown[cat] = category_breakdown.get(cat, 0) + 1

    avg_rating = round(rating_sum / total, 1)
    nps_score = round(((promoters - detractors) / total) * 100)
    csat_score = round((satisfied / total) * 100)

    return {
        "total": total,
        "avgRating": avg_rating,
        "npsScore": nps_score,
        "csatScore": csat_score,
        "sentiment": {
            "positive": sentiment_counts["positive"],
            "neutral": sentiment_counts["neutral"],
            "negative": sentiment_counts["negative"],
            "positivePct": round((sentiment_counts["positive"] / total) * 100),
            "neutralPct": round((sentiment_counts["neutral"] / total) * 100),
            "negativePct": round((sentiment_counts["negative"] / total) * 100),
        },
        "ratingDistribution": rating_distribution,
        "categoryBreakdown": category_breakdown
    }


class ApiHandler(http.server.BaseHTTPRequestHandler):
    def send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_cors_headers()
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(payload)

    def read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}
        raw = self.rfile.read(content_length).decode("utf-8")
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        pathname = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Health
        if pathname == "/api/health":
            self.send_json(200, {
                "status": "online",
                "service": "AuraFeedback API Server (Python)",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            })
            return

        # 2. Tags
        if pathname == "/api/tags":
            self.send_json(200, {
                "categories": list(TAGS_BY_CATEGORY.keys()),
                "tagsByCategory": TAGS_BY_CATEGORY
            })
            return

        # 3. Products
        if pathname == "/api/products":
            products = read_json_file(PRODUCTS_FILE)
            self.send_json(200, {"success": True, "count": len(products), "products": products})
            return

        prod_match = re.match(r"^/api/products/([^/]+)$", pathname)
        if prod_match:
            pid = prod_match.group(1)
            products = read_json_file(PRODUCTS_FILE)
            prod = next((p for p in products if p.get("id") == pid), None)
            if not prod:
                self.send_json(404, {"success": False, "error": "Product not found"})
                return
            self.send_json(200, {"success": True, "product": prod})
            return

        # 4. Stats
        if pathname == "/api/feedbacks/stats":
            feedbacks = read_json_file(FEEDBACKS_FILE)
            stats = compute_metrics(feedbacks)
            self.send_json(200, {"success": True, "stats": stats})
            return

        # 5. List Feedbacks
        if pathname == "/api/feedbacks":
            feedbacks = read_json_file(FEEDBACKS_FILE)

            # Search filter
            search_val = query.get("search", [""])[0].strip().lower()
            if search_val:
                feedbacks = [
                    f for f in feedbacks
                    if search_val in f.get("name", "").lower()
                    or search_val in f.get("email", "").lower()
                    or search_val in f.get("comment", "").lower()
                    or search_val in f.get("id", "").lower()
                    or (f.get("product") and search_val in f["product"].get("name", "").lower())
                    or any(search_val in t.lower() for t in f.get("tags", []))
                ]

            # Category filter
            cat_val = query.get("category", ["all"])[0]
            if cat_val != "all":
                feedbacks = [f for f in feedbacks if f.get("category") == cat_val]

            # Rating filter
            rating_val = query.get("rating", ["all"])[0]
            if rating_val != "all":
                try:
                    r_num = int(rating_val)
                    feedbacks = [f for f in feedbacks if int(f.get("rating", 0)) == r_num]
                except ValueError:
                    pass

            # Sentiment filter
            sent_val = query.get("sentiment", ["all"])[0]
            if sent_val != "all":
                feedbacks = [f for f in feedbacks if f.get("sentiment") == sent_val]

            # Sort by date descending
            feedbacks.sort(key=lambda x: x.get("date", ""), reverse=True)

            self.send_json(200, {
                "success": True,
                "total": len(feedbacks),
                "feedbacks": feedbacks
            })
            return

        # 6. Single Feedback
        fb_match = re.match(r"^/api/feedbacks/([^/]+)$", pathname)
        if fb_match:
            fid = fb_match.group(1)
            feedbacks = read_json_file(FEEDBACKS_FILE)
            fb = next((f for f in feedbacks if f.get("id") == fid), None)
            if not fb:
                self.send_json(404, {"success": False, "error": f"Feedback ticket '{fid}' not found"})
                return
            self.send_json(200, {"success": True, "feedback": fb})
            return

        # Root
        if pathname in ["/", "/api"]:
            self.send_json(200, {
                "name": "AuraFeedback API Server (Python)",
                "version": "1.0.0",
                "status": "ready"
            })
            return

        self.send_json(404, {"success": False, "error": "Not Found"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        pathname = parsed.path
        body = self.read_json_body()

        # Submit Feedback
        if pathname == "/api/feedbacks":
            if not body.get("name") or not body.get("comment") or not body.get("rating"):
                self.send_json(400, {"success": False, "error": "Missing required fields: name, comment, rating"})
                return

            try:
                rating = int(body.get("rating"))
            except ValueError:
                self.send_json(400, {"success": False, "error": "Rating must be an integer between 1 and 5"})
                return

            sentiment = body.get("sentiment") or analyze_sentiment(body.get("comment"), rating)
            import random
            ticket_id = body.get("id") or f"AF-{random.randint(10000, 99999)}-TKT"

            new_feedback = {
                "id": ticket_id,
                "name": str(body.get("name")).strip(),
                "email": str(body.get("email", "N/A")).strip(),
                "rating": rating,
                "category": body.get("category", "Product Quality"),
                "comment": str(body.get("comment")).strip(),
                "tags": body.get("tags", []),
                "sentiment": sentiment,
                "date": datetime.utcnow().isoformat() + "Z",
                "status": "open",
                "product": body.get("product"),
                "replies": []
            }

            feedbacks = read_json_file(FEEDBACKS_FILE)
            feedbacks.insert(0, new_feedback)
            write_json_file(FEEDBACKS_FILE, feedbacks)

            self.send_json(201, {"success": True, "message": "Feedback submitted successfully", "feedback": new_feedback})
            return

        # Reply
        reply_match = re.match(r"^/api/feedbacks/([^/]+)/reply$", pathname)
        if reply_match:
            fid = reply_match.group(1)
            if not body.get("replyText"):
                self.send_json(400, {"success": False, "error": "replyText is required"})
                return

            feedbacks = read_json_file(FEEDBACKS_FILE)
            fb = next((f for f in feedbacks if f.get("id") == fid), None)
            if not fb:
                self.send_json(404, {"success": False, "error": f"Feedback ticket '{fid}' not found"})
                return

            import time
            reply_obj = {
                "id": f"REP-{int(time.time() * 1000)}",
                "author": body.get("author", "Support Team"),
                "text": str(body.get("replyText")).strip(),
                "date": datetime.utcnow().isoformat() + "Z"
            }
            if "replies" not in fb or not isinstance(fb["replies"], list):
                fb["replies"] = []
            fb["replies"].append(reply_obj)
            fb["status"] = "resolved"

            write_json_file(FEEDBACKS_FILE, feedbacks)
            self.send_json(200, {"success": True, "reply": reply_obj, "feedback": fb})
            return

        # Reset
        if pathname == "/api/feedbacks/reset":
            import random
            feedbacks = read_json_file(FEEDBACKS_FILE)
            self.send_json(200, {"success": True, "message": "Database reset ready"})
            return

        self.send_json(404, {"success": False, "error": "Not Found"})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        fb_match = re.match(r"^/api/feedbacks/([^/]+)$", parsed.path)
        if fb_match:
            fid = fb_match.group(1)
            feedbacks = read_json_file(FEEDBACKS_FILE)
            initial_len = len(feedbacks)
            feedbacks = [f for f in feedbacks if f.get("id") != fid]
            if len(feedbacks) == initial_len:
                self.send_json(404, {"success": False, "error": f"Feedback ticket '{fid}' not found"})
                return
            write_json_file(FEEDBACKS_FILE, feedbacks)
            self.send_json(200, {"success": True, "message": f"Feedback ticket '{fid}' deleted successfully"})
            return

        self.send_json(404, {"success": False, "error": "Not Found"})


if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), ApiHandler) as httpd:
        print(f"=================================================")
        print(f"  🚀 Python AuraFeedback API Server is Running!")
        print(f"  📡 URL: http://localhost:{PORT}")
        print(f"  🌐 Health: http://localhost:{PORT}/api/health")
        print(f"=================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
