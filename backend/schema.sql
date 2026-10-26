-- ========================================================
-- AuraFeedback Database Schema for MySQL 8.0+
-- ========================================================

-- 1. Create Database if not exists
CREATE DATABASE IF NOT EXISTS `aurafeedback_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `aurafeedback_db`;

-- 2. Products Table
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `img` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Feedbacks Table
CREATE TABLE IF NOT EXISTS `feedbacks` (
  `id` VARCHAR(50) NOT NULL,
  `product_id` VARCHAR(50) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT 'N/A',
  `rating` TINYINT NOT NULL,
  `category` VARCHAR(100) DEFAULT 'Product Quality',
  `comment` TEXT NOT NULL,
  `tags` JSON DEFAULT NULL,
  `sentiment` ENUM('positive', 'neutral', 'negative') DEFAULT 'neutral',
  `status` VARCHAR(50) DEFAULT 'open',
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_feedback_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `chk_rating_range` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Feedback Replies Table
CREATE TABLE IF NOT EXISTS `feedback_replies` (
  `id` VARCHAR(50) NOT NULL,
  `feedback_id` VARCHAR(50) NOT NULL,
  `author` VARCHAR(255) DEFAULT 'Customer Success',
  `reply_text` TEXT NOT NULL,
  `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reply_feedback`
    FOREIGN KEY (`feedback_id`) REFERENCES `feedbacks` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

