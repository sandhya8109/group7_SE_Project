-- Mock Data for Personal Finance and Budget Management System

USE personal_finance;

-- ==================== USERS (1) ====================
-- Password 'password123' hashed with bcrypt (for demonstration purposes, a real hash would be longer and more complex)
-- Note: The API uses generate_password_hash, so these hashes match the Python side.
INSERT INTO user (user_id, name, email, password_hash) VALUES
('user-1', 'Alice Johnson', 'alice.johnson@example.com', 'scrypt:32768:8:1$K/kXmXy9$pD0Sg8gA7rN5q7bH2wE0/vF1/w4/yE2=');

-- ==================== PREFERENCES (2) ====================
INSERT INTO preferences (user_id, currency, theme, notifications) VALUES
('user-1', 'EUR', 'dark', FALSE);

-- ==================== TRANSACTIONS (3) ====================
INSERT INTO transaction (transaction_id, user_id, amount, category, date, description, type) VALUES
('t-001', 'user-1', 4500.00, 'Salary', '2025-10-01', 'Monthly paycheck', 'income'),
('t-002', 'user-1', 1200.00, 'Rent', '2025-10-02', 'Apartment rent payment', 'expense'),
('t-003', 'user-1', 75.50, 'Groceries', '2025-10-03', 'Weekly supermarket run', 'expense'),
('t-004', 'user-1', 150.00, 'Investment', '2025-10-05', 'Monthly contribution to Roth IRA', 'transfer'),
('t-005', 'user-1', 45.99, 'Utilities', '2025-10-08', 'Internet bill', 'expense'),
('t-006', 'user-1', 350.00, 'Freelance', '2025-10-15', 'Payment for web design gig', 'income'),
('t-007', 'user-1', 18.75, 'Eating Out', '2025-10-20', 'Lunch with colleagues', 'expense');

-- ==================== BUDGETS (4) ====================
INSERT INTO budget (budget_id, user_id, category, amount, period, start_date, end_date, is_exceeded) VALUES
('b-001', 'user-1', 'Groceries', 350.00, 'monthly', '2025-10-01', '2025-10-31', FALSE),
('b-002', 'user-1', 'Entertainment', 150.00, 'monthly', '2025-10-01', '2025-10-31', FALSE),
('b-003', 'user-1', 'Rent', 1200.00, 'monthly', '2025-10-01', '2025-10-31', TRUE); -- Mocking exceeded budget

-- ==================== INVESTMENTS (5) ====================
INSERT INTO investment (investment_id, user_id, name, type, amount, purchase_date, current_value) VALUES
('inv-001', 'user-1', 'S&P 500 Index Fund', 'Stock Fund', 15000.00, '2024-01-15', 18500.00),
('inv-002', 'user-1', 'Bitcoin', 'Crypto', 3000.00, '2025-05-20', 2850.00);

-- ==================== GOALS (6) ====================
INSERT INTO goal (goal_id, user_id, name, target_amount, current_amount, deadline) VALUES
('g-001', 'user-1', 'Down Payment', 50000.00, 12500.00, '2027-12-31'),
('g-002', 'user-1', 'Vacation Fund', 3000.00, 2500.00, '2026-06-01');

-- ==================== FINANCIAL OVERVIEW (7) ====================
-- This data is typically calculated by the API, but inserted here for initial setup.
INSERT INTO financial_overview (user_id, total_income, total_expenses, net_worth) VALUES
('user-1', 4850.00, 1345.24, 17200.00); -- Placeholder values based on mock data and initial investments

-- ==================== REPORTS (8) ====================
-- Storing complex data as JSON strings in the LONGTEXT field.
INSERT INTO report (report_id, user_id, type, data, created_at) VALUES
('rep-001', 'user-1', 'monthly_summary', '{"month": "Oct 2025", "net_cashflow": 3504.76, "top_expense": "Rent", "categories": {"Groceries": 75.50, "Rent": 1200.00, "Utilities": 45.99}}', '2025-11-01 10:00:00'),
('rep-002', 'user-1', 'investment_performance', '{"period": "YTD", "gain_loss": 3350.00, "best_asset": "S&P 500 Index Fund"}', '2025-11-01 10:01:00');

-- ==================== INSIGHTS (9) ====================
INSERT INTO insight (user_id, message, type, created_at) VALUES
('user-1', 'Your spending in the Groceries category is on track to stay within budget this month.', 'spending_habit', '2025-11-01 12:00:00'),
('user-1', 'Consider increasing your monthly contribution to your Down Payment goal to meet the deadline faster.', 'saving_tip', '2025-11-02 09:30:00');

-- ==================== NOTIFICATIONS (10) ====================
INSERT INTO notification (user_id, content, type, is_read, created_at) VALUES
('user-1', 'Budget for Rent was exceeded on Oct 2nd.', 'budget_exceeded', FALSE, '2025-10-02 12:00:00'),
('user-1', 'You received your salary deposit for October.', 'info', TRUE, '2025-10-01 08:30:00');