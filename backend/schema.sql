CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  roleDescription VARCHAR(255),
  emailNotificationsEnabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS children (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  birthDate DATE,
  gender VARCHAR(50),
  createdByUserId VARCHAR(255),
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS gifts (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  purpose TEXT,
  priceMin DECIMAL(10, 2),
  priceMax DECIMAL(10, 2),
  currency VARCHAR(10),
  imageUrl MEDIUMTEXT,
  shopUrl TEXT,
  childName VARCHAR(255),
  priority VARCHAR(50),
  category VARCHAR(50),
  isGifted BOOLEAN DEFAULT FALSE,
  giftedByUserId VARCHAR(255),
  giftedByUserName VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (giftedByUserId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invitations (
  id VARCHAR(255) PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  guestName VARCHAR(255),
  guestRoleDescription VARCHAR(255),
  targetRole VARCHAR(50),
  customMessage TEXT,
  createdByUserId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isUsed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (createdByUserId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(255) PRIMARY KEY,
  message TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `read` BOOLEAN DEFAULT FALSE,
  forRole VARCHAR(50)
);
