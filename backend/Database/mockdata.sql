-- === MOCK DATA INSERTIONS ===

-- Shared password hash
SET @password_hash = 'scrypt:32768:8:1$NFZEfBLzHiQgm1Zf$905076c43b194870fe9ac579e43d01dbcdd52dd29d92b1b60f435b0136433a0db4bed05eb8003021d218c1e25ff72ae8acd698ce50bfd05c7e5289b2a9a22ced';


-- 1. USER TABLE DATA
INSERT INTO user (user_id, name, email, password_hash, created_at) VALUES
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Zackary', 'zackary@example.com', @password_hash, '2025-11-21 13:56:38'),
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Elara', 'elara.dev@corp.com', @password_hash, '2025-11-20 09:15:00');


-- 2. PREFERENCES TABLE DATA
INSERT INTO preferences (user_id, currency, theme, notifications) VALUES
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'EUR', 'dark', TRUE),
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'USD', 'light', TRUE);


-- 5. GOAL TABLE DATA
INSERT INTO goal (goal_id, user_id, name, target_amount, current_amount, deadline) VALUES
('g-emer-fund-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Emergency Fund', 10000.00, 3500.00, '2026-11-21'),
('g-new-car-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'New Car Downpayment', 5000.00, 5000.00, '2025-09-01'), -- Achieved
('g-house-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'First Home Downpayment', 40000.00, 12500.00, '2027-05-01'),
('g-retire-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Retirement Boost', 8000.00, 1000.00, '2025-12-31');


-- 4. BUDGET TABLE DATA
INSERT INTO budget (budget_id, user_id, category, amount, period, start_date, end_date, is_exceeded) VALUES
-- Zackary's Budgets
('b-rent-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Housing', 1500.00, 'monthly', '2024-12-01', '2025-12-01', FALSE),
('b-food-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Groceries', 400.00, 'monthly', '2024-12-01', '2025-12-01', FALSE),
('b-ent-dec24-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Entertainment', 150.00, 'monthly', '2024-12-01', '2024-12-31', TRUE),
-- Elara's Budgets
('b-rent-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Housing', 2100.00, 'monthly', '2024-12-01', '2025-12-01', FALSE),
('b-util-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Utilities', 250.00, 'monthly', '2024-12-01', '2025-12-01', TRUE),
('b-ent-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Entertainment', 300.00, 'monthly', '2024-12-01', '2025-12-01', FALSE),
('b-tax-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Taxes', 1500.00, 'one-time', '2025-04-01', '2025-04-30', FALSE);


-- 10. REMINDER TABLE DATA
INSERT INTO reminder (reminder_id, user_id, title, category, description, amount, due_date, recurring) VALUES
('r-rent-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Monthly Rent Payment', 'Housing', 'Apartment rent', 1500.00, '2025-12-01', 'Monthly'),
('r-ins-z', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Car Insurance Renewal', 'Insurance', 'Annual car insurance premium', 600.00, '2025-03-15', 'Yearly'),
('r-loan-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Student Loan Payment', 'Debt', 'Minimum monthly payment', 450.00, '2025-12-15', 'Monthly'),
('r-sub-e', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Software Subscription', 'Subscriptions', 'Annual license renewal', 120.00, '2026-01-05', 'Yearly');


-- 3. TRANSACTION TABLE DATA (1 Year of Data for Both Users)

INSERT INTO transaction (transaction_id, user_id, amount, type, date, category, description, receipt_data) VALUES
-- ZACKARY'S TRANSACTIONS (f3582516-009b-4ff3-8e5f-efb2c4a4880d)
('t-z-dec24-01', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 4500.00, 'income', '2024-12-01', 'Salary', 'Monthly paycheck', NULL),
('t-z-dec24-02', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 1500.00, 'expense', '2024-12-02', 'Housing', 'December Rent', NULL),
('t-z-dec24-03', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 170.00, 'expense', '2024-12-24', 'Entertainment', 'Concert tickets', NULL),
('t-z-mar25-01', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 600.00, 'expense', '2025-03-15', 'Insurance', 'Annual Car Insurance', NULL),
('t-z-jul25-01', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 200.00, 'expense', '2025-07-01', 'Travel', 'Gas for road trip', NULL),
('t-z-nov25-01', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 4500.00, 'income', '2025-11-01', 'Salary', 'Monthly paycheck', NULL),
('t-z-nov25-02', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 2000.00, 'income', '2025-11-15', 'Side Hustle', 'Freelance payment', NULL),
('t-z-nov25-03', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 1000.00, 'expense', '2025-11-20', 'Investment', 'Brokerage transfer', NULL),
('t-z-groceries-1', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 350.00, 'expense', '2025-11-05', 'Groceries', 'Monthly bulk shop', NULL),

-- ELARA'S TRANSACTIONS (a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p)
('t-e-dec24-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 6200.00, 'income', '2024-12-01', 'Salary', 'Monthly Pay', NULL),
('t-e-dec24-02', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 2100.00, 'expense', '2024-12-03', 'Housing', 'Apartment Rent', NULL),
('t-e-dec24-03', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 280.00, 'expense', '2024-12-10', 'Utilities', 'Electric Bill (High usage)', NULL), -- Over budget
('t-e-dec24-04', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 1500.00, 'expense', '2024-12-28', 'Savings', 'Contribution to Home Goal', NULL),
('t-e-jan25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 450.00, 'expense', '2025-01-15', 'Debt', 'Student Loan Payment', NULL),
('t-e-jan25-02', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 500.00, 'expense', '2025-01-20', 'Clothing', 'New winter coat', NULL),
('t-e-apr25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 1500.00, 'expense', '2025-04-10', 'Taxes', 'Quarterly Estimated Tax Payment', NULL),
('t-e-jun25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 30.00, 'expense', '2025-06-05', 'Subscriptions', 'Spotify Premium', NULL),
('t-e-aug25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 5000.00, 'income', '2025-08-01', 'Bonus', 'Annual Performance Bonus', NULL),
('t-e-oct25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 2000.00, 'expense', '2025-10-25', 'Savings', 'Contribution to Home Goal', NULL),
('t-e-nov25-01', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 6200.00, 'income', '2025-11-01', 'Salary', 'Monthly Pay', NULL);


-- 8. FINANCIAL OVERVIEW TABLE DATA (Calculated Summaries)

-- Zackary's Calculations (using previous logic: 56000 income, 24190 expenses)
INSERT INTO financial_overview (user_id, total_income, total_expenses, net_worth, last_updated) VALUES
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 56000.00, 24190.00, 31810.00, CURRENT_TIMESTAMP());

-- Elara's Estimated 1-Year Totals (12 * 6200 Salary + 5000 Bonus = 79400 Income)
-- (12 * 2100 Rent + 12 * 250 Utilities + 1500 Taxes + 500 Clothing + 12 * 450 Loan + 1500 + 2000 Savings) = 40500 Expenses (Estimated)
INSERT INTO financial_overview (user_id, total_income, total_expenses, net_worth, last_updated) VALUES
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 79400.00, 40500.00, 38900.00, CURRENT_TIMESTAMP());


-- 7. NOTIFICATION TABLE DATA
INSERT INTO notification (user_id, content, type, is_read, created_at) VALUES
-- Zackary's Notifications
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Budget for Entertainment was exceeded by 20.00 in December 2024.', 'budget_exceeded', FALSE, '2024-12-31 10:00:00'),
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Goal achieved: New Car Downpayment is complete!', 'goal_achieved', TRUE, '2025-09-03 14:00:00'),
-- Elara's Notifications
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'The Utilities budget was slightly exceeded in December 2024.', 'budget_exceeded', TRUE, '2024-12-10 12:00:00'),
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'You are on track to meet your Retirement Boost goal by the deadline.', 'info', FALSE, '2025-11-25 09:00:00');


-- 9. INSIGHT TABLE DATA
INSERT INTO insight (user_id, message, type, created_at) VALUES
-- Zackary's Insights
('f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'Your average monthly spending on Groceries has increased by 10% in the last quarter.', 'spending_habit', CURRENT_TIMESTAMP()),
-- Elara's Insights
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Your discretionary spending (Entertainment, Clothing) is currently 15% lower than the last quarter, a great saving trend!', 'saving_tip', CURRENT_TIMESTAMP()),
('a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'Warning: High volatility detected in your Utilities expense. Consider fixing this with a balanced billing plan.', 'risk_alert', CURRENT_TIMESTAMP());


-- 6. REPORT TABLE DATA
INSERT INTO report (report_id, user_id, type, data, created_at) VALUES
('r-z-sum-nov25', 'f3582516-009b-4ff3-8e5f-efb2c4a4880d', 'monthly_summary', '{"net_income": 5300.00, "top_expense_category": "Investment", "expense_count": 4}', CURRENT_TIMESTAMP()),
('r-e-tax-2025', 'a9c1b2d3-4e5f-6g7h-8i9j-0k1l2m3n4o5p', 'tax_report', '{"income_sources": ["Salary", "Bonus"], "total_taxable_income": 79400.00}', CURRENT_TIMESTAMP());