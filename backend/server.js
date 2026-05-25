const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is not defined in environment variables.');
}

const allowedOrigins = [
    'http://localhost:5173', // Web Dashboard (Local)
    'http://127.0.0.1:5173',
    'http://localhost:8081', // Metro Bundler (Local Web)
    'http://127.0.0.1:8081',
    'https://swiftcart-backend-quvb.onrender.com', // Render Backend
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like native mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Match explicit whitelist, production cloud domains, or standard intranet/localhost origins
        const isAllowed = allowedOrigins.indexOf(origin) !== -1 ||
            /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(origin) ||
            /\.onrender\.com$/.test(origin) ||
            /\.vercel\.app$/.test(origin);
            
        if (!isAllowed) {
            console.warn(`[CORS Blocked] Unauthorized Origin: ${origin}`);
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }
        return callback(null, true);
    }
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Access Denied: No Token Provided!' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user;
        next();
    });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// --- IN-MEMORY CACHE HELPER ---
const serverCache = {
    store: new Map(),
    get(key) {
        const item = this.store.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.store.delete(key);
            return null;
        }
        return item.value;
    },
    set(key, value, ttlMs = 5 * 60 * 1000) {
        this.store.set(key, {
            value,
            expiry: Date.now() + ttlMs
        });
    },
    delete(key) {
        this.store.delete(key);
    },
    clearPattern(pattern) {
        let clearedCount = 0;
        for (const key of this.store.keys()) {
            if (key.includes(pattern)) {
                this.store.delete(key);
                clearedCount++;
            }
        }
        if (clearedCount > 0) {
            console.log(`[Cache Invalidation] Cleared ${clearedCount} keys matching pattern "${pattern}"`);
        }
    },
    clearAll() {
        this.store.clear();
        console.log('[Cache Invalidation] Cleared all server caches');
    }
};

// --- CACHE MIDDLEWARE ---
const cacheMiddleware = (durationSec = 300) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Cache key includes request URL, query string, and the user ID if authenticated to isolate user contexts
        const userPart = req.user ? `_user_${req.user.id}` : '';
        const key = `__express__${req.originalUrl || req.url}${userPart}`;
        const cachedResponse = serverCache.get(key);

        if (cachedResponse) {
            console.log(`[Cache HIT] Serving cached response for key: ${key}`);
            res.setHeader('X-Cache', 'HIT');
            return res.json(cachedResponse);
        } else {
            console.log(`[Cache MISS] Fetching fresh data for key: ${key}`);
            res.setHeader('X-Cache', 'MISS');
            
            // Intercept res.json to store the response in cache on success
            const originalJson = res.json.bind(res);
            res.json = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    serverCache.set(key, body, durationSec * 1000);
                }
                return originalJson(body);
            };
            next();
        }
    };
};


// Multer storage config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Image upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Temporary Migration Endpoint
app.post('/api/debug-db', async (req, res) => {
    try {
        const [result] = await db.query(req.body.query);
        res.json({ success: true, result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// --- AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const role = 'user';
        const token = jwt.sign({ id: result.insertId, email, role }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: result.insertId, name, email, role, phone: phone || null } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server Error during signup' });
    }
});

// Update Profile Avatar
app.put('/api/auth/profile/avatar', authenticateToken, async (req, res) => {
    const { avatar } = req.body;
    try {
        await db.query('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.user.id]);
        res.json({ message: 'Avatar updated successfully' });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.email === 'palingubaerwin029@gmail.com' || user.email === 'palingubaerwin01229@gmail.com') {
            user.role = 'admin';
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'user', phone: user.phone || null, avatar: user.avatar || null } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server Error during login' });
    }
});

// Get User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- PRODUCT ROUTES ---

// Get all products (with optional search, category, and filter)
app.get('/api/products', cacheMiddleware(300), async (req, res) => {
    console.log('GET /api/products requested');
    const { search, category, filter } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (search) {
        query += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }
    
    if (category) {
        query += ' AND LOWER(category) = LOWER(?)';
        params.push(category);
    }

    if (filter === 'newest') {
        query += ' AND is_new = TRUE';
    } else if (filter === 'popular') {
        query += ' AND is_popular = TRUE';
    }

    query += ' ORDER BY id DESC';

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get all distinct product categories
app.get('/api/products/categories', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""'
        );
        const categories = rows.map(r => r.category);
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get product by ID
app.get('/api/products/:id', cacheMiddleware(300), async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Create a new product
app.post('/api/products', authenticateToken, requireAdmin, async (req, res) => {
    console.log('POST /api/products requested', req.body);
    const { title, price, description, category, image, stock } = req.body;
    
    if (!title || !price) {
        return res.status(400).json({ message: 'Title and price are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO products (title, price, description, category, image, stock) VALUES (?, ?, ?, ?, ?, ?)',
            [title, price, description || null, category || null, image || null, stock || 100]
        );
        serverCache.clearPattern('products');
        res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ORDER ROUTES ---

// Create an order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { items, total_amount, delivery_lat, delivery_lng, delivery_address, payment_method } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status, delivery_lat, delivery_lng, delivery_address, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, total_amount, 'pending', delivery_lat || null, delivery_lng || null, delivery_address || null, payment_method || 'Cash on Delivery']
        );
        
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        await connection.commit();
        
        // Create checkout confirmation notification
        try {
            await db.query(
                'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
                [
                    req.user.id,
                    'Order Placed Successfully! 🎉',
                    `Thank you for shopping with SwiftCart! Your order #${orderId} has been successfully placed using ${payment_method}. We are preparing your order.`,
                    'order_status'
                ]
            );
        } catch (notifErr) {
            console.error('Failed to create order notification:', notifErr);
        }

        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Server Error creating order' });
    } finally {
        connection.release();
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        
        for (let i = 0; i < orders.length; i++) {
            const [items] = await db.query(
                `SELECT oi.*, p.title, p.image 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = ?`,
                [orders[i].id]
            );
            orders[i].items = items;
        }

        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get single order by ID (for tracking)
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const order = orders[0];
        const [items] = await db.query(
            `SELECT oi.*, p.title, p.image 
             FROM order_items oi 
             JOIN products p ON oi.product_id = p.id 
             WHERE oi.order_id = ?`,
            [order.id]
        );
        order.items = items;

        res.json(order);
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- COUPON ROUTES ---

// Get available coupons (with claim status for logged-in user)
app.get('/api/coupons', authenticateToken, async (req, res) => {
    try {
        const [coupons] = await db.query(
            `SELECT c.*, 
             (SELECT COUNT(*) FROM user_coupons uc WHERE uc.coupon_id = c.id AND uc.user_id = ?) as claimed,
             (SELECT used FROM user_coupons uc WHERE uc.coupon_id = c.id AND uc.user_id = ?) as used
             FROM coupons c 
             WHERE (c.expires_at IS NULL OR c.expires_at > NOW()) AND c.uses_count < c.max_uses
             ORDER BY c.discount_percent DESC`,
            [req.user.id, req.user.id]
        );
        res.json(coupons.map(c => ({ ...c, claimed: c.claimed > 0, used: !!c.used })));
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Claim a coupon
app.post('/api/coupons/:id/claim', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [coupon] = await db.query('SELECT * FROM coupons WHERE id = ?', [id]);
        if (coupon.length === 0) return res.status(404).json({ message: 'Coupon not found' });
        if (coupon[0].uses_count >= coupon[0].max_uses) return res.status(400).json({ message: 'Coupon fully redeemed' });

        const [existing] = await db.query('SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ?', [req.user.id, id]);
        if (existing.length > 0) return res.status(400).json({ message: 'Already claimed' });

        await db.query('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)', [req.user.id, id]);
        await db.query('UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?', [id]);
        
        // Add database notification log
        try {
            await db.query(
                'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
                [
                    req.user.id,
                    'Coupon Claimed Successfully! 🎟️',
                    `Congratulations! Coupon code "${coupon[0].code}" has been saved to your profile. Apply it at checkout to get a ${coupon[0].discount_percent}% discount!`,
                    'promotion'
                ]
            );
        } catch (notifErr) {
            console.error('Failed to create coupon claim notification:', notifErr);
        }

        res.json({ message: 'Coupon claimed!' });
    } catch (error) {
        console.error('Claim coupon error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get user's claimed coupons
app.get('/api/coupons/my', authenticateToken, async (req, res) => {
    try {
        const [coupons] = await db.query(
            `SELECT c.*, uc.used, uc.claimed_at
             FROM user_coupons uc 
             JOIN coupons c ON uc.coupon_id = c.id 
             WHERE uc.user_id = ? AND uc.used = FALSE
             ORDER BY c.discount_percent DESC`,
            [req.user.id]
        );
        res.json(coupons);
    } catch (error) {
        console.error('My coupons error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Apply coupon (validate at checkout)
app.post('/api/coupons/apply', authenticateToken, async (req, res) => {
    const { code, total } = req.body;
    try {
        const [coupons] = await db.query('SELECT * FROM coupons WHERE code = ?', [code]);
        if (coupons.length === 0) return res.status(404).json({ message: 'Invalid coupon code' });

        const coupon = coupons[0];
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ message: 'Coupon expired' });
        }

        const [claimed] = await db.query('SELECT * FROM user_coupons WHERE user_id = ? AND coupon_id = ? AND used = FALSE', [req.user.id, coupon.id]);
        if (claimed.length === 0) return res.status(400).json({ message: 'You haven\'t claimed this coupon' });

        if (total < coupon.min_order) {
            return res.status(400).json({ message: `Minimum order $${coupon.min_order} required` });
        }

        const discount = (total * coupon.discount_percent) / 100;
        res.json({ discount: parseFloat(discount.toFixed(2)), percent: coupon.discount_percent, code: coupon.code, couponId: coupon.id });
    } catch (error) {
        console.error('Apply coupon error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Mark coupon as used after order
app.post('/api/coupons/use', authenticateToken, async (req, res) => {
    const { couponId } = req.body;
    try {
        await db.query('UPDATE user_coupons SET used = TRUE WHERE user_id = ? AND coupon_id = ?', [req.user.id, couponId]);
        res.json({ message: 'Coupon marked as used' });
    } catch (error) {
        console.error('Use coupon error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- NOTIFICATION ROUTES ---

// Get all notifications for logged-in user
app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
    try {
        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Mark single notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete a single notification
app.delete('/api/notifications/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ADMIN ROUTES ---


// Get all products (admin view - includes stock)
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (error) {
        console.error('Admin get products error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update product stock
app.put('/api/admin/products/:id/stock', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body;
    try {
        const [result] = await db.query('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        serverCache.clearPattern('products');
        res.json({ message: 'Stock updated successfully' });
    } catch (error) {
        console.error('Update stock error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update full product
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, price, description, category, image, stock, is_new, is_popular } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE products SET title = ?, price = ?, description = ?, category = ?, image = ?, stock = ?, is_new = ?, is_popular = ? WHERE id = ?',
            [title, price, description, category, image, stock, is_new || false, is_popular || false, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        serverCache.clearPattern('products');
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get single product for admin
app.get('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);
        if (products.length === 0) return res.status(404).json({ message: 'Product not found' });
        res.json(products[0]);
    } catch (error) {
        console.error('Get single product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Delete product
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        serverCache.clearPattern('products');
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get ALL orders (admin view)
app.get('/api/admin/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(
            `SELECT o.*, u.name as user_name, u.email as user_email 
             FROM orders o 
             JOIN users u ON o.user_id = u.id 
             ORDER BY o.created_at DESC`
        );
        
        for (let i = 0; i < orders.length; i++) {
            const [items] = await db.query(
                `SELECT oi.*, p.title, p.image 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = ?`,
                [orders[i].id]
            );
            orders[i].items = items;
        }

        res.json(orders);
    } catch (error) {
        console.error('Admin get orders error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update order status (admin)
app.put('/api/admin/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const [result] = await db.query(
            'UPDATE orders SET status = ? WHERE id = ?',
            [status, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Retrieve the user ID associated with this order to send a database notification
        const [orderRows] = await db.query('SELECT user_id FROM orders WHERE id = ?', [id]);
        if (orderRows.length > 0) {
            const userId = orderRows[0].user_id;
            let title = 'Order Status Updated';
            let body = `Your order #${id} status has been updated to "${status.charAt(0).toUpperCase() + status.slice(1)}".`;
            
            // Customize notifications based on status
            if (status === 'shipped') {
                title = 'Order Shipped! 🚀';
                body = `Great news! Your order #${id} has been shipped and is on the way!`;
            } else if (status === 'delivered') {
                title = 'Order Delivered! 🎉';
                body = `Your order #${id} has been successfully delivered. Enjoy your purchase!`;
            } else if (status === 'cancelled') {
                title = 'Order Cancelled ⚠️';
                body = `Your order #${id} has been cancelled. Please contact support if you have questions.`;
            } else if (status === 'processing') {
                title = 'Order Processing ⚙️';
                body = `Your order #${id} is now being prepared and processed.`;
            }

            await db.query(
                'INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)',
                [userId, title, body, 'order_status']
            );
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
}).on('error', (err) => {
    console.error('Server failed to start:', err);
});

// Export for Vercel serverless
module.exports = app;
