-- Personal Finance and Budget Management System Database Schema

CREATE DATABASE IF NOT EXISTS personal_finance;
USE personal_finance;

-- User table
CREATE TABLE user (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Preferences table
CREATE TABLE preferences (
    preference_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    theme VARCHAR(20) DEFAULT 'light',
    notifications BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Transaction table
CREATE TABLE transaction (
    transaction_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(50),
    date DATE NOT NULL,
    description TEXT,
    type ENUM('income', 'expense') NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, date),
    INDEX idx_category (category)
);

-- Budget table
CREATE TABLE budget (
    budget_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    period VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_exceeded BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_period (user_id, period)
);

-- Investment table
CREATE TABLE investment (
    investment_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    purchase_date DATE NOT NULL,
    current_value DECIMAL(15, 2),
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type)
);

-- Goal table
CREATE TABLE goal (
    goal_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) DEFAULT 0,
    deadline DATE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_deadline (user_id, deadline)
);

-- Report table
CREATE TABLE report (
    report_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type)
);

-- Insight table
CREATE TABLE insight (
    insight_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- BudgetAlert table
CREATE TABLE budget_alert (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    budget_id VARCHAR(50) NOT NULL,
    threshold DOUBLE NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (budget_id) REFERENCES budget(budget_id) ON DELETE CASCADE
);

-- Notification table
CREATE TABLE notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('email', 'sms', 'push') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);

-- InsightEngine table
CREATE TABLE insight_engine (
    engine_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    data JSON,
    last_analysis TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- QuerySystem table
CREATE TABLE query_system (
    query_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    query_text TEXT NOT NULL,
    result JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- Validator table
CREATE TABLE validator (
    validator_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    rules JSON,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Increment table (for transaction increments)
CREATE TABLE increment (
    increment_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) NOT NULL,
    income DECIMAL(15, 2),
    savings DECIMAL(15, 2),
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id) ON DELETE CASCADE
);

-- RecurringTransaction table
CREATE TABLE recurring_transaction (
    recurring_id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50),
    frequency VARCHAR(20) NOT NULL,
    next_date DATE NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transaction(transaction_id) ON DELETE CASCADE
);

-- Scheduler table
CREATE TABLE scheduler (
    scheduler_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    task_name VARCHAR(100) NOT NULL,
    schedule_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);

-- FinancialOverview table (relationships)
CREATE TABLE financial_overview (
    overview_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    total_income DECIMAL(15, 2) DEFAULT 0,
    total_expenses DECIMAL(15, 2) DEFAULT 0,
    net_worth DECIMAL(15, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE
);