-- Migration: Add delivery location columns to orders table
-- Run this manually in your MySQL client if the columns don't already exist

ALTER TABLE orders 
  ADD COLUMN delivery_lat DECIMAL(10,8) NULL,
  ADD COLUMN delivery_lng DECIMAL(11,8) NULL,
  ADD COLUMN delivery_address TEXT NULL;
