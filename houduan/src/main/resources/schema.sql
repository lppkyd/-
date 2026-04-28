CREATE DATABASE IF NOT EXISTS word_learning DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE word_learning;

CREATE TABLE IF NOT EXISTS admin (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) DEFAULT '',
  nickname VARCHAR(50) NOT NULL,
  learned_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  wrong_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS category (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  sort INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dict (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) DEFAULT '',
  owner_admin_id INT NOT NULL,
  is_custom TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_admin_id) REFERENCES admin(id)
);

CREATE TABLE IF NOT EXISTS word (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT DEFAULT NULL,
  dict_id INT DEFAULT NULL,
  word VARCHAR(100) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  phonetic VARCHAR(255) DEFAULT '',
  example VARCHAR(255) DEFAULT '',
  recommended TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES category(id),
  FOREIGN KEY (dict_id) REFERENCES dict(id)
);

CREATE TABLE IF NOT EXISTS favorite (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  word_id INT NOT NULL,
  word VARCHAR(100) DEFAULT '',
  trans VARCHAR(255) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (word_id) REFERENCES word(id)
);

CREATE TABLE IF NOT EXISTS saved_word (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  trans VARCHAR(255) DEFAULT '',
  phonetic VARCHAR(255) DEFAULT '',
  example VARCHAR(255) DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS study_record (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  total_words INT DEFAULT 0,
  accuracy INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS error_word (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  trans VARCHAR(255) DEFAULT '',
  dict_id VARCHAR(100) DEFAULT '',
  wrong_count INT DEFAULT 1,
  last_wrong_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);

INSERT INTO admin(username, password, nickname) VALUES ('admin', '123456', '系统管理员')
  ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

INSERT INTO user(openid, password, nickname, learned_count, favorite_count, wrong_count) VALUES
('wx_user_001', '123456', '张三', 12, 8, 3)
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

INSERT INTO category(name, sort) VALUES
('CET4', 1),
('CET6', 2),
('Daily Words', 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO dict(name, description, owner_admin_id, is_custom) VALUES
('My Custom Dict', '管理员自建词典', 1, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO word(category_id, dict_id, word, meaning, phonetic, example, recommended) VALUES
(1, NULL, 'apple', '苹果', '[ˈæpl]', 'an apple a day', 1),
(1, NULL, 'study', '学习', '[ˈstʌdi]', 'study hard', 0),
(2, NULL, 'achieve', '实现', '[əˈtʃiːv]', 'achieve your goal', 1),
(3, NULL, 'hello', '你好', '[həˈləʊ]', 'hello, my friend', 1),
(NULL, 1, 'customize', '自定义', '[ˈkʌstəmaɪz]', 'customize your dictionary', 1)
ON DUPLICATE KEY UPDATE word = VALUES(word);

INSERT INTO study_record(user_id, category_name, total_words, accuracy) VALUES
(1, 'CET4', 20, 95);

INSERT INTO favorite(user_id, word_id, word, trans) VALUES
(1, 1, 'apple', '苹果');

INSERT INTO error_word(user_id, word, trans, dict_id, wrong_count) VALUES
(1, 'study', '学习', 'cet4', 2);

INSERT INTO saved_word(user_id, word, trans, phonetic, example) VALUES
(1, 'customize', '自定义', '[ˈkʌstəmaɪz]', 'customize your dictionary');
