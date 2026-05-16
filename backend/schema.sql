CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    image VARCHAR(255)
);

-- Insert some sample data
INSERT INTO products (title, price, description, category, image) VALUES
('Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops', 109.95, 'Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your everyday', 'men''s clothing', 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_t.png'),
('Mens Casual Premium Slim Fit T-Shirts', 22.30, 'Slim-fitting style, contrast raglan long sleeve, light weight & comfortable fabric for daily wear.', 'men''s clothing', 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_t.png'),
('Mens Cotton Jacket', 55.99, 'Great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors.', 'men''s clothing', 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_t.png'),
('Mens Casual Slim Fit', 15.99, 'The color could be slightly different between on the screen and in practice. / Please note that body builds vary by person, therefore, detailed size information should be reviewed below on the product description.', 'men''s clothing', 'https://fakestoreapi.com/img/71YXzeOuslL._AC_UY879_t.png'),
('John Hardy Women''s Legends Naga Gold & Silver Dragon Station Chain Bracelet', 695.00, 'From the Legends Collection, the Naga was inspired by the mythical water dragon that protects the ocean''s pearl.', 'jewelery', 'https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_t.png'),
('WD 2TB Elements Portable External Hard Drive - USB 3.0', 64.00, 'USB 3.0 and USB 2.0 Compatibility Fast data transfers Improve PC Performance High Capacity', 'electronics', 'https://fakestoreapi.com/img/61IBBVJvSDL._AC_SY879_t.png'),
('SanDisk SSD PLUS 1TB Internal SSD - SATA III 6 Gb/s', 109.00, 'Easy upgrade for faster boot up, shutdown, application load and response', 'electronics', 'https://fakestoreapi.com/img/61U7T1koQqL._AC_SX679_t.png'),
('Silicon Power 256GB SSD 3D NAND A55 SLC Cache Performance Boost SATA III 2.5', 29.99, '3D NAND flash are applied to deliver high transfer speeds Remarkable transfer speeds that enable faster bootup and improved overall system performance.', 'electronics', 'https://fakestoreapi.com/img/71kWymZ+c+L._AC_SX679_t.png'),
('Acer SB220Q bi 21.5 inches Full HD (1920 x 1080) IPS Ultra-Thin', 599.00, '21.5 inches Full HD (1920 x 1080) widescreen IPS display And Radeon free Sync technology. No compatibility for VESA Mount', 'electronics', 'https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_t.png'),
('Samsung 49-Inch CHG90 144Hz Curved Gaming Monitor (LC49HG90DMNXZA) – Super Ultrawide Screen QLED', 999.99, '49 inch super ultrawide 32:9 curved gaming monitor with dual 27 inch screen side by side', 'electronics', 'https://fakestoreapi.com/img/81Zt42ioCgL._AC_SX679_t.png');

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    delivery_lat DECIMAL(10, 8),
    delivery_lng DECIMAL(11, 8),
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
