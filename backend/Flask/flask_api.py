"""Personal Finance and Budget Management System - Flask API Backend (PyMySQL Version)"""

from flask import Flask, request, jsonify, current_app, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json
import os
from functools import wraps

# Import PyMySQL
import pymysql.cursors

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURATION ====================

# Database Configuration (Using environment variables with local defaults)
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'password') 
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'personal_finance')
app.config['DATABASE_POOL_SIZE'] = 10 # For demonstration, though PyMySQL doesn't handle pooling directly in this setup

# ==================== DATABASE CONNECTION UTILITIES ====================

def get_db():
    """
    Establishes a connection to the MySQL database and stores it on Flask's g object.
    Uses DictCursor to fetch results as dictionaries.
    """
    if 'db_conn' not in g:
        try:
            g.db_conn = pymysql.connect(
                host=current_app.config['MYSQL_HOST'],
                user=current_app.config['MYSQL_USER'],
                password=current_app.config['MYSQL_PASSWORD'],
                database=current_app.config['MYSQL_DB'],
                cursorclass=pymysql.cursors.DictCursor
            )
        except Exception as e:
            current_app.logger.error(f"Database connection failed: {e}")
            raise ConnectionError("Could not connect to the database.") from e
    return g.db_conn

@app.teardown_appcontext
def close_db_connection(exception):
    """Closes the database connection at the end of the request."""
    db_conn = g.pop('db_conn', None)
    if db_conn is not None:
        db_conn.close()

def execute_db_query(query, params=None, fetch_one=False, commit=False):
    """
    Centralized function to handle database connection, cursor execution,
    and cleanup for a single operation.
    """
    conn = None
    try:
        conn = get_db()
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            
            if commit:
                conn.commit()
                return {'success': True, 'rowcount': cursor.rowcount}
            
            if fetch_one:
                return cursor.fetchone()
            else:
                return cursor.fetchall()
            
    except ConnectionError as e:
        # Re-raise connection error to be caught by the decorator
        raise e
    except pymysql.Error as e:
        # Rollback on query error
        if conn:
            conn.rollback()
        current_app.logger.error(f"Database error executing query: {e}")
        # Re-raise to be caught by the decorator
        raise e

def handle_db_error(func):
    """
    Decorator for handling database errors (ConnectionError or PyMySQL.Error).
    Returns a 500 JSON response on failure.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (ConnectionError, pymysql.Error) as e:
            error_message = f"Database Error: {e}"
            # Optionally log the exception details
            current_app.logger.error(error_message, exc_info=True)
            return jsonify({'error': 'A database error occurred.', 'detail': str(e)}), 500
        except Exception as e:
            # Catch other unexpected errors
            current_app.logger.error(f"Unexpected Error: {e}", exc_info=True)
            return jsonify({'error': 'An unexpected server error occurred.'}), 500
    return wrapper


# ==================== USER ENDPOINTS ====================

@app.route('/api/users', methods=['GET'])
@handle_db_error
def get_users():
    """Get all users"""
    query = "SELECT user_id, name, email, created_at FROM user"
    users = execute_db_query(query)
    return jsonify(users), 200

@app.route('/api/users/<user_id>', methods=['GET'])
@handle_db_error
def get_user(user_id):
    """Get single user by ID"""
    query = "SELECT user_id, name, email, created_at FROM user WHERE user_id = %s"
    user = execute_db_query(query, (user_id,), fetch_one=True)
    
    if user:
        return jsonify(user), 200
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/users', methods=['POST'])
@handle_db_error
def create_user():
    """Create new user"""
    data = request.get_json()
    
    required_fields = ['user_id', 'name', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    password_hash = generate_password_hash(data['password'])
    
    query = """
        INSERT INTO user (user_id, name, email, password_hash)
        VALUES (%s, %s, %s, %s)
    """
    params = (data['user_id'], data['name'], data['email'], password_hash)
    
    result = execute_db_query(query, params, commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'User created successfully'}), 201
    return jsonify({'error': 'Failed to create user (possible duplicate ID)'}), 409


@app.route('/api/users/<user_id>', methods=['PUT'])
@handle_db_error
def update_user(user_id):
    """Update user"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    if 'name' in data:
        update_fields.append("name = %s")
        values.append(data['name'])
    if 'email' in data:
        update_fields.append("email = %s")
        values.append(data['email'])
    if 'password' in data:
        # Only update password if a new one is provided
        update_fields.append("password_hash = %s")
        values.append(generate_password_hash(data['password']))
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(user_id)
    # Using parameterized query for the WHERE clause, but f-string for SET clause as fields are dynamic
    query = f"UPDATE user SET {', '.join(update_fields)} WHERE user_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'User updated successfully'}), 200
    return jsonify({'error': 'User not found or no changes made'}), 404

@app.route('/api/users/<user_id>', methods=['DELETE'])
@handle_db_error
def delete_user(user_id):
    """Delete user"""
    query = "DELETE FROM user WHERE user_id = %s"
    result = execute_db_query(query, (user_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'User deleted successfully'}), 200
    return jsonify({'error': 'User not found'}), 404


# ==================== TRANSACTION ENDPOINTS ====================

@app.route('/api/transactions', methods=['GET'])
@handle_db_error
def get_transactions():
    """Get all transactions with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM transaction"
    params = None
    
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
        
    query += " ORDER BY date DESC"
    
    transactions = execute_db_query(query, params)
    return jsonify(transactions), 200


@app.route('/api/transactions/<transaction_id>', methods=['GET'])
@handle_db_error
def get_transaction(transaction_id):
    """Get single transaction"""
    query = "SELECT * FROM transaction WHERE transaction_id = %s"
    transaction = execute_db_query(query, (transaction_id,), fetch_one=True)
    
    if transaction:
        return jsonify(transaction), 200
    return jsonify({'error': 'Transaction not found'}), 404


@app.route('/api/transactions', methods=['POST'])
@handle_db_error
def create_transaction():
    """Create new transaction"""
    data = request.get_json()
    
    required_fields = ['transaction_id', 'user_id', 'amount', 'date', 'type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    query = """
        INSERT INTO transaction 
        (transaction_id, user_id, amount, category, date, description, type) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        data['transaction_id'], data['user_id'], data['amount'],
        data.get('category'), data['date'], data.get('description'), data['type']
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Transaction created successfully'}), 201


@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
@handle_db_error
def update_transaction(transaction_id):
    """Update transaction"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    for field in ['amount', 'category', 'date', 'description', 'type']:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(transaction_id)
    query = f"UPDATE transaction SET {', '.join(update_fields)} WHERE transaction_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Transaction updated successfully'}), 200
    return jsonify({'error': 'Transaction not found or no changes made'}), 404


@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
@handle_db_error
def delete_transaction(transaction_id):
    """Delete transaction"""
    query = "DELETE FROM transaction WHERE transaction_id = %s"
    result = execute_db_query(query, (transaction_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    return jsonify({'error': 'Transaction not found'}), 404


# ==================== BUDGET ENDPOINTS ====================

@app.route('/api/budgets', methods=['GET'])
@handle_db_error
def get_budgets():
    """Get all budgets with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM budget"
    params = None
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
    
    budgets = execute_db_query(query, params)
    return jsonify(budgets), 200


@app.route('/api/budgets/<budget_id>', methods=['GET'])
@handle_db_error
def get_budget(budget_id):
    """Get single budget"""
    query = "SELECT * FROM budget WHERE budget_id = %s"
    budget = execute_db_query(query, (budget_id,), fetch_one=True)
    
    if budget:
        return jsonify(budget), 200
    return jsonify({'error': 'Budget not found'}), 404


@app.route('/api/budgets', methods=['POST'])
@handle_db_error
def create_budget():
    """Create new budget"""
    data = request.get_json()
    
    required_fields = ['budget_id', 'user_id', 'category', 'amount', 'period', 'start_date', 'end_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    query = """
        INSERT INTO budget 
        (budget_id, user_id, category, amount, period, start_date, end_date, is_exceeded) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        data['budget_id'], data['user_id'], data['category'], data['amount'],
        data['period'], data['start_date'], data['end_date'], data.get('is_exceeded', False)
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Budget created successfully'}), 201


@app.route('/api/budgets/<budget_id>', methods=['PUT'])
@handle_db_error
def update_budget(budget_id):
    """Update budget"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    for field in ['category', 'amount', 'period', 'start_date', 'end_date', 'is_exceeded']:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(budget_id)
    query = f"UPDATE budget SET {', '.join(update_fields)} WHERE budget_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Budget updated successfully'}), 200
    return jsonify({'error': 'Budget not found or no changes made'}), 404


@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
@handle_db_error
def delete_budget(budget_id):
    """Delete budget"""
    query = "DELETE FROM budget WHERE budget_id = %s"
    result = execute_db_query(query, (budget_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Budget deleted successfully'}), 200
    return jsonify({'error': 'Budget not found'}), 404


# ==================== INVESTMENT ENDPOINTS ====================

@app.route('/api/investments', methods=['GET'])
@handle_db_error
def get_investments():
    """Get all investments with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM investment"
    params = None
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
    
    investments = execute_db_query(query, params)
    return jsonify(investments), 200


@app.route('/api/investments/<investment_id>', methods=['GET'])
@handle_db_error
def get_investment(investment_id):
    """Get single investment"""
    query = "SELECT * FROM investment WHERE investment_id = %s"
    investment = execute_db_query(query, (investment_id,), fetch_one=True)
    
    if investment:
        return jsonify(investment), 200
    return jsonify({'error': 'Investment not found'}), 404


@app.route('/api/investments', methods=['POST'])
@handle_db_error
def create_investment():
    """Create new investment"""
    data = request.get_json()
    
    required_fields = ['investment_id', 'user_id', 'name', 'type', 'amount', 'purchase_date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    query = """
        INSERT INTO investment 
        (investment_id, user_id, name, type, amount, purchase_date, current_value) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        data['investment_id'], data['user_id'], data['name'], data['type'],
        data['amount'], data['purchase_date'], data.get('current_value')
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Investment created successfully'}), 201


@app.route('/api/investments/<investment_id>', methods=['PUT'])
@handle_db_error
def update_investment(investment_id):
    """Update investment"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    for field in ['name', 'type', 'amount', 'purchase_date', 'current_value']:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(investment_id)
    query = f"UPDATE investment SET {', '.join(update_fields)} WHERE investment_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Investment updated successfully'}), 200
    return jsonify({'error': 'Investment not found or no changes made'}), 404


@app.route('/api/investments/<investment_id>', methods=['DELETE'])
@handle_db_error
def delete_investment(investment_id):
    """Delete investment"""
    query = "DELETE FROM investment WHERE investment_id = %s"
    result = execute_db_query(query, (investment_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Investment deleted successfully'}), 200
    return jsonify({'error': 'Investment not found'}), 404


# ==================== GOAL ENDPOINTS ====================

@app.route('/api/goals', methods=['GET'])
@handle_db_error
def get_goals():
    """Get all goals with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM goal"
    params = None
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
    
    goals = execute_db_query(query, params)
    return jsonify(goals), 200


@app.route('/api/goals/<goal_id>', methods=['GET'])
@handle_db_error
def get_goal(goal_id):
    """Get single goal"""
    query = "SELECT * FROM goal WHERE goal_id = %s"
    goal = execute_db_query(query, (goal_id,), fetch_one=True)
    
    if goal:
        return jsonify(goal), 200
    return jsonify({'error': 'Goal not found'}), 404


@app.route('/api/goals', methods=['POST'])
@handle_db_error
def create_goal():
    """Create new goal"""
    data = request.get_json()
    
    required_fields = ['goal_id', 'user_id', 'name', 'target_amount']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    query = """
        INSERT INTO goal 
        (goal_id, user_id, name, target_amount, current_amount, deadline) 
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    params = (
        data['goal_id'], data['user_id'], data['name'], data['target_amount'],
        data.get('current_amount', 0), data.get('deadline')
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Goal created successfully'}), 201


@app.route('/api/goals/<goal_id>', methods=['PUT'])
@handle_db_error
def update_goal(goal_id):
    """Update goal"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    for field in ['name', 'target_amount', 'current_amount', 'deadline']:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(goal_id)
    query = f"UPDATE goal SET {', '.join(update_fields)} WHERE goal_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Goal updated successfully'}), 200
    return jsonify({'error': 'Goal not found or no changes made'}), 404


@app.route('/api/goals/<goal_id>', methods=['DELETE'])
@handle_db_error
def delete_goal(goal_id):
    """Delete goal"""
    query = "DELETE FROM goal WHERE goal_id = %s"
    result = execute_db_query(query, (goal_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Goal deleted successfully'}), 200
    return jsonify({'error': 'Goal not found'}), 404


# ==================== PREFERENCES ENDPOINTS ====================

@app.route('/api/preferences/<user_id>', methods=['GET'])
@handle_db_error
def get_preferences(user_id):
    """Get user preferences"""
    query = "SELECT * FROM preferences WHERE user_id = %s"
    preferences = execute_db_query(query, (user_id,), fetch_one=True)
    
    if preferences:
        return jsonify(preferences), 200
    return jsonify({'error': 'Preferences not found'}), 404


@app.route('/api/preferences', methods=['POST'])
@handle_db_error
def create_preferences():
    """Create user preferences"""
    data = request.get_json()
    
    if 'user_id' not in data:
        return jsonify({'error': 'user_id is required'}), 400
    
    query = """
        INSERT INTO preferences (user_id, currency, theme, notifications) 
        VALUES (%s, %s, %s, %s)
    """
    params = (
        data['user_id'], data.get('currency', 'USD'),
        data.get('theme', 'light'), data.get('notifications', True)
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Preferences created successfully'}), 201


@app.route('/api/preferences/<user_id>', methods=['PUT'])
@handle_db_error
def update_preferences(user_id):
    """Update user preferences"""
    data = request.get_json()
    
    update_fields = []
    values = []
    
    for field in ['currency', 'theme', 'notifications']:
        if field in data:
            update_fields.append(f"{field} = %s")
            values.append(data[field])
    
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    
    values.append(user_id)
    query = f"UPDATE preferences SET {', '.join(update_fields)} WHERE user_id = %s"
    
    result = execute_db_query(query, tuple(values), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Preferences updated successfully'}), 200
    return jsonify({'error': 'Preferences not found or no changes made'}), 404


# ==================== NOTIFICATION ENDPOINTS ====================

@app.route('/api/notifications', methods=['GET'])
@handle_db_error
def get_notifications():
    """Get notifications with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM notification"
    params = None
    
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
        
    query += " ORDER BY created_at DESC"
    
    notifications = execute_db_query(query, params)
    return jsonify(notifications), 200


@app.route('/api/notifications', methods=['POST'])
@handle_db_error
def create_notification():
    """Create new notification"""
    data = request.get_json()
    
    required_fields = ['user_id', 'content', 'type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    query = """
        INSERT INTO notification (user_id, content, type, is_read) 
        VALUES (%s, %s, %s, %s)
    """
    params = (
        data['user_id'], data['content'], data['type'], data.get('is_read', False)
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Notification created successfully'}), 201


@app.route('/api/notifications/<int:notification_id>', methods=['PUT'])
@handle_db_error
def update_notification(notification_id):
    """Update notification (e.g., mark as read)"""
    data = request.get_json()
    
    is_read_value = data.get('is_read', True)
    
    query = "UPDATE notification SET is_read = %s WHERE notification_id = %s"
    params = (is_read_value, notification_id)
    
    result = execute_db_query(query, params, commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Notification updated successfully'}), 200
    return jsonify({'error': 'Notification not found or no changes made'}), 404


@app.route('/api/notifications/<int:notification_id>', methods=['DELETE'])
@handle_db_error
def delete_notification(notification_id):
    """Delete notification"""
    query = "DELETE FROM notification WHERE notification_id = %s"
    result = execute_db_query(query, (notification_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Notification deleted successfully'}), 200
    return jsonify({'error': 'Notification not found'}), 404


# ==================== REPORT ENDPOINTS ====================

@app.route('/api/reports', methods=['GET'])
@handle_db_error
def get_reports():
    """Get reports with optional user_id filter"""
    user_id = request.args.get('user_id')
    
    query = "SELECT * FROM report"
    params = None
    
    if user_id:
        query += " WHERE user_id = %s"
        params = (user_id,)
        
    query += " ORDER BY created_at DESC"
    
    reports = execute_db_query(query, params)
    
    # JSON loads the 'data' field since it's stored as JSON string in the DB
    for report in reports:
        if 'data' in report and report['data'] is not None:
            try:
                report['data'] = json.loads(report['data'])
            except json.JSONDecodeError:
                report['data'] = {} # Fallback for malformed JSON
                
    return jsonify(reports), 200


@app.route('/api/reports/<report_id>', methods=['GET'])
@handle_db_error
def get_report(report_id):
    """Get single report"""
    query = "SELECT * FROM report WHERE report_id = %s"
    report = execute_db_query(query, (report_id,), fetch_one=True)
    
    if report:
        # JSON loads the 'data' field since it's stored as JSON string in the DB
        if 'data' in report and report['data'] is not None:
            try:
                report['data'] = json.loads(report['data'])
            except json.JSONDecodeError:
                report['data'] = {} # Fallback for malformed JSON
                
        return jsonify(report), 200
    return jsonify({'error': 'Report not found'}), 404


@app.route('/api/reports', methods=['POST'])
@handle_db_error
def create_report():
    """Create new report"""
    data = request.get_json()
    
    required_fields = ['report_id', 'user_id', 'type', 'data']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Dump the dict to a JSON string for storage
    report_data_json = json.dumps(data['data'])
    
    query = "INSERT INTO report (report_id, user_id, type, data) VALUES (%s, %s, %s, %s)"
    params = (data['report_id'], data['user_id'], data['type'], report_data_json)
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Report created successfully'}), 201


@app.route('/api/reports/<report_id>', methods=['DELETE'])
@handle_db_error
def delete_report(report_id):
    """Delete report"""
    query = "DELETE FROM report WHERE report_id = %s"
    result = execute_db_query(query, (report_id,), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Report deleted successfully'}), 200
    return jsonify({'error': 'Report not found'}), 404


# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Try a simple connection and query to verify database health
        db_status = execute_db_query("SELECT 1", fetch_one=True)
        db_healthy = db_status is not None and db_status.get('1') == 1
    except Exception:
        db_healthy = False

    return jsonify({
        'status': 'healthy' if db_healthy else 'degraded', 
        'timestamp': datetime.now().isoformat(),
        'database_status': 'OK' if db_healthy else 'ERROR'
    }), 200


if __name__ == '__main__':
    # Log configuration for easier debugging
    import logging
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=5000)