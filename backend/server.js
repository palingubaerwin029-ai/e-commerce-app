const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('ERROR: JWT_SECRET is not defined in environment variables.');
}

app.use(cors());
app.use(express.json());

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

// --- AUTH ROUTES ---

// Signup
app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: result.insertId, name, email } });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server Error during signup' });
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

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
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

// Get all products (with optional search and category filters)
app.get('/api/products', async (req, res) => {
    console.log('GET /api/products requested');
    const { search, category } = req.query;
    
    let query = 'SELECT * FROM products WHERE 1=1';
    let params = [];

    if (search) {
        query += ' AND title LIKE ?';
        params.push(`%${search}%`);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    try {
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get product by ID
app.get('/api/products/:id', async (req, res) => {
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
app.post('/api/products', authenticateToken, async (req, res) => {
    console.log('POST /api/products requested', req.body);
    const { title, price, description, category, image } = req.body;
    
    if (!title || !price) {
        return res.status(400).json({ message: 'Title and price are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO products (title, price, description, category, image) VALUES (?, ?, ?, ?, ?)',
            [title, price, description, category, image]
        );
        res.status(201).json({ message: 'Product created successfully', productId: result.insertId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// --- ORDER ROUTES ---

// Create an order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const { items, total_amount } = req.body;
    
    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
            [req.user.id, total_amount, 'pending']
        );
        
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.id, item.quantity, item.price]
            );
        }

        await connection.commit();
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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
