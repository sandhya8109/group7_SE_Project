"""Personal Finance and Budget Management System - Flask API Backend (PyMySQL Version)"""

from flask import Flask, request, jsonify, current_app, g
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import calendar
from datetime import date, datetime, timedelta
from dateutil.relativedelta import relativedelta
import json
import os
from functools import wraps
import uuid
import jwt 
import pymysql.cursors

app = Flask(__name__)
CORS(app)

# ==================== CONFIGURATION ====================

# Database Configuration (Using environment variables with local defaults)
app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', 'password') # IMPORTANT: Replace with your actual password
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


# --- Configuration for Token (You need to set a SECRET_KEY) ---
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'your_strong_secret_key') 

# --- Helper Function for Token Validation ---
def get_user_by_token(token):
    """
    Decodes the token and attempts to retrieve the user_id. 
    (Assuming token is a simple JWT for a slightly more robust example)
    """
    try:
        # Decode the token using your secret key
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        # In a real system, you'd check token expiration here
        
        # Check if the user exists in the database
        user_query = "SELECT user_id, email FROM user WHERE user_id = %s"
        user_data = execute_db_query(user_query, (payload['user_id'],), fetch_one=True)
        return user_data 
        
    except jwt.ExpiredSignatureError:
        # Handle expired token
        return None
    except jwt.InvalidTokenError:
        # Handle invalid signature or malformed token
        return None
    except Exception:
        # Handle other errors (e.g., database connection issues)
        return None


# --- Security Decorator ---
def require_token(f):
    """Decorator to require a valid Bearer Token for API access and set g.user_id."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token is missing or invalid format'}), 401

        token = auth_header.split(' ')[1]
        
        user_data = get_user_by_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Store the authenticated user's ID for use in the endpoint
        g.authenticated_user_id = user_data['user_id']
        
        return f(*args, **kwargs)
    return decorated


# ==================== AUTH ENDPOINTS ====================

# FIXED: Changed paths from /auth/... to /api/auth/...
@app.route('/api/auth/signup', methods=['POST'])
@handle_db_error
def signup():
    """Register a new user, generating user_id server-side."""
    data = request.get_json()
    
    required_fields = ['email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (email, password)'}), 400
    
    user_id = str(uuid.uuid4())
    name = data.get('name', data['email'].split('@')[0]) # Default name to email prefix
    password_hash = generate_password_hash(data['password'])

    # Check if email already exists
    check_query = "SELECT user_id FROM user WHERE email = %s"
    if execute_db_query(check_query, (data['email'],), fetch_one=True):
        return jsonify({'error': 'Email already registered'}), 409

    insert_query = """
        INSERT INTO user (user_id, name, email, password_hash)
        VALUES (%s, %s, %s, %s)
    """
    params = (user_id, name, data['email'], password_hash)
    
    result = execute_db_query(insert_query, params, commit=True)
    
    if result.get('rowcount', 0) > 0:
        # Successful signup returns user info and a 'token' (which is the user_id for simplicity)
        return jsonify({
            'message': 'User created successfully',
            'token': user_id,
            'user': {'user_id': user_id, 'email': data['email'], 'name': name}
        }), 201
    return jsonify({'error': 'Failed to create user'}), 500



@app.route('/api/auth/login', methods=['POST'])
@handle_db_error
def login():
    """Authenticate a user and return a JWT token."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    # 1. Fetch user by email
    query = "SELECT user_id, name, email, password_hash FROM user WHERE email = %s"
    user = execute_db_query(query, (email,), fetch_one=True)

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # 2. Check password
    if check_password_hash(user['password_hash'], password):
        
        # 3. JWT GENERATION (NEW)
        payload = {
            'user_id': user['user_id'],
            # Token expires 24 hours from now
            'exp': datetime.utcnow() + timedelta(hours=24), 
            'iat': datetime.utcnow()
        }
        # Encode the payload into a token
        token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm="HS256")
        
        # 4. Return the token and essential user details
        return jsonify({
            # JWT token is the new secure token
            'token': token, 
            'user': {'user_id': user['user_id'], 'email': user['email'], 'name': user['name']}
        }), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401


@app.route('/api/auth/me', methods=['GET'])
@handle_db_error
def me():
    """Retrieve current user info based on Authorization header (User ID as Bearer Token)."""
    # We assume the Bearer token IS the user_id for simple session management
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authorization token required'}), 401
    
    # Extract user_id from "Bearer <user_id>"
    user_id = auth_header.split(' ')[1]
    
    query = "SELECT user_id, name, email FROM user WHERE user_id = %s"
    user = execute_db_query(query, (user_id,), fetch_one=True)

    if user:
        return jsonify({'user': user}), 200
    
    # If the user_id from the token is invalid
    return jsonify({'error': 'Invalid or expired token'}), 401


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
    """Create new user (requires user_id in body, generally used for initial setup/testing)"""
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

@app.route('/api/transactions/<user_id>', methods=['GET'])
@handle_db_error
@require_token
def get_transactions(user_id):
    """Fetch all transactions for a specific user."""
    query = """
        SELECT transaction_id AS id, user_id, type, amount, date, category, description, receipt_data
        FROM transaction 
        WHERE user_id = %s
        ORDER BY date DESC
    """
    transactions = execute_db_query(query, (user_id,))
    # Ensure date fields are in a format the frontend expects (or handle conversion client-side)
    return jsonify(transactions), 200

@app.route('/api/transactions', methods=['POST'])
@handle_db_error
@require_token
def create_transaction():
    """Create a new transaction (Income or Expense)."""
    data = request.json
    required_fields = ['user_id', 'type', 'amount', 'date']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required transaction fields'}), 400
    
    transaction_id = str(uuid.uuid4())
    query = """
        INSERT INTO transaction 
        (transaction_id, user_id, type, amount, date, category, description, receipt_data)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        transaction_id, data['user_id'], data['type'], data['amount'], 
        data['date'], data.get('category'), data.get('description'), data.get('receipt_data')
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Transaction created successfully', 'id': transaction_id}), 201

@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
@handle_db_error
@require_token
def delete_transaction(transaction_id):
    """Delete a transaction."""
    # Assuming user_id is passed as a query param for authorization
    user_id = request.args.get('user_id') 
    if not user_id:
        return jsonify({'error': 'User ID required for authorization'}), 400
        
    query = "DELETE FROM transaction WHERE transaction_id = %s AND user_id = %s"
    result = execute_db_query(query, (transaction_id, user_id), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Transaction deleted successfully'}), 200
    return jsonify({'error': 'Transaction not found or unauthorized'}), 404


# ==================== REMINDER ENDPOINTS ====================

@app.route('/api/reminders/<user_id>', methods=['GET'])
@handle_db_error
@require_token
def get_reminders(user_id):
    """Fetch all reminders for a specific user."""
    query = """
        SELECT reminder_id AS id, user_id, title, category, description, amount, due_date AS dueDate, recurring
        FROM reminder 
        WHERE user_id = %s
        ORDER BY due_date ASC
    """
    reminders = execute_db_query(query, (user_id,))
    return jsonify(reminders), 200

@app.route('/api/reminders', methods=['POST'])
@handle_db_error
@require_token
def create_reminder():
    """Create a new reminder."""
    data = request.json
    required_fields = ['user_id', 'title', 'amount', 'dueDate', 'recurring']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required reminder fields'}), 400
    
    reminder_id = str(uuid.uuid4())
    query = """
        INSERT INTO reminder 
        (reminder_id, user_id, title, category, description, amount, due_date, recurring)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        reminder_id, data['user_id'], data['title'], data.get('category'), 
        data.get('description'), data['amount'], data['dueDate'], data['recurring']
    )
    
    execute_db_query(query, params, commit=True)
    return jsonify({'message': 'Reminder created successfully', 'id': reminder_id}), 201

@app.route('/api/reminders/<reminder_id>', methods=['PUT'])
@handle_db_error
@require_token
def update_reminder(reminder_id):
    """Update an existing reminder."""
    data = request.json
    
    field_mapping = {
        'dueDate': 'due_date',
        'title': 'title',
        'category': 'category',
        'description': 'description',
        'amount': 'amount',
        'recurring': 'recurring'
    }
    
    update_fields = []
    params = []
    for frontend_key, db_column in field_mapping.items():
        if frontend_key in data and frontend_key not in ['user_id', 'id']:
            update_fields.append(f"{db_column} = %s")
            params.append(data[frontend_key])
    
    if not update_fields:
        return jsonify({'error': 'No fields provided for update'}), 400

    query = f"UPDATE reminder SET {', '.join(update_fields)} WHERE reminder_id = %s AND user_id = %s"
    params.extend([reminder_id, data.get('user_id')])

    result = execute_db_query(query, tuple(params), commit=True)
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Reminder updated successfully'}), 200
    return jsonify({'error': 'Reminder not found or unauthorized'}), 404

@app.route('/api/reminders/<reminder_id>', methods=['DELETE'])
@handle_db_error
@require_token
def delete_reminder(reminder_id):
    """Delete a reminder."""
    # Assuming user_id is passed as a query param for authorization
    user_id = g.authenticated_user_id
    if not user_id:
        return jsonify({'error': 'User ID required for authorization'}), 400

    query = "DELETE FROM reminder WHERE reminder_id = %s AND user_id = %s"
    result = execute_db_query(query, (reminder_id, user_id), commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Reminder deleted successfully'}), 200
    return jsonify({'error': 'Reminder not found or unauthorized'}), 404

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
@require_token
@handle_db_error
def fetch_preferences(user_id):
    """Fetch user preferences."""
    if g.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    query = "SELECT currency, theme, notifications FROM preferences WHERE user_id = %s"
    preferences = execute_db_query(query, (user_id,), fetch_one=True)

    if preferences:
        # Ensure notifications is a boolean for the client
        preferences['notifications'] = bool(preferences.get('notifications'))
        return jsonify(preferences), 200
    return jsonify({'error': 'Preferences not found'}), 404

@app.route('/api/preferences/<user_id>', methods=['PUT'])
@require_token
@handle_db_error
def update_preferences(user_id):
    """Update existing user preferences."""
    if g.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    updates = []
    params = []

    if 'currency' in data:
        updates.append("currency = %s")
        params.append(data['currency'])
    
    if 'theme' in data:
        updates.append("theme = %s")
        params.append(data['theme'])
        
    if 'notifications' in data:
        updates.append("notifications = %s")
        params.append(data['notifications'])

    if not updates:
        return jsonify({'message': 'No changes provided'}), 200
    
    params.append(user_id)
    query = f"UPDATE preferences SET {', '.join(updates)} WHERE user_id = %s"

    result = execute_db_query(query, params, commit=True)
    
    if result.get('rowcount', 0) > 0:
        return jsonify({'message': 'Preferences updated successfully'}), 200
    return jsonify({'error': 'Preferences not found or no changes made'}), 404


@app.route('/api/preferences', methods=['POST'])
@require_token
@handle_db_error
def create_preferences():
    """
    NEW: Create new user preferences. 
    This is used as a fallback if PUT fails with 404.
    """
    data = request.get_json()
    user_id = g.user_id # Get user ID from the JWT token

    # Check if preferences already exist to avoid the duplicate key error
    existing_pref = execute_db_query("SELECT user_id FROM preferences WHERE user_id = %s", (user_id,), fetch_one=True)
    if existing_pref:
         # If it exists, return a 409 Conflict, letting the client know to use PUT next time.
         return jsonify({'error': 'Preferences already exist for this user. Use PUT to update.', 'user_id': user_id}), 409
    
    # Extract data, providing defaults where necessary
    currency = data.get('currency', 'USD')
    theme = data.get('theme', 'light')
    # Default to true if not explicitly provided
    notifications = data.get('notifications', True) 

    # The user_id is the PRIMARY KEY, so we insert it directly.
    query = "INSERT INTO preferences (user_id, currency, theme, notifications) VALUES (%s, %s, %s, %s)"
    params = (user_id, currency, theme, notifications)
    
    execute_db_query(query, params, commit=True)
    
    return jsonify({'message': 'Preferences created successfully', 'user_id': user_id}), 201


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


# ==================== DASHBOARD REPORTING ENDPOINT ====================

@app.route('/api/dashboard/summary/<user_id>', methods=['GET'])
@handle_db_error
def get_dashboard_summary(user_id):
    """
    Calculates and returns all dashboard summary data for a specific user,
    including totals, monthly trends, and category breakdowns.
    """
    
    # --- 1. TOTALS & BREAKDOWN (All Time / Last 12 Months) ---
    
    # For simplicity, we calculate totals for the last 12 months (or all data if less than 12 months)
    # The client-side logic calculates total savings, so we provide income and expense totals.
    
    # Calculate start date for 12 months ago
    twelve_months_ago = (date.today() - relativedelta(months=12)).isoformat()
    
    # Query 1: Total Income, Total Expense, and Expense Breakdown for the last year
    summary_query = """
        SELECT 
            t.type, 
            t.category,
            SUM(t.amount) AS total_amount
        FROM 
            transaction t
        WHERE 
            t.user_id = %s 
            AND t.date >= %s 
        GROUP BY 
            t.type, t.category
    """
    summary_data = execute_db_query(summary_query, (user_id, twelve_months_ago))

    total_income = 0.0
    total_expense = 0.0
    expense_breakdown = {}
    
    for row in summary_data:
        amount = float(row['total_amount'])
        if row['type'].lower() == 'income':
            total_income += amount
        elif row['type'].lower() == 'expense':
            total_expense += amount
            category = row['category'] if row['category'] else 'Uncategorized'
            expense_breakdown[category] = expense_breakdown.get(category, 0.0) + amount

    pie_data = [
        {'name': cat, 'value': val} 
        for cat, val in expense_breakdown.items()
    ]
    
    totals = {
        'income': total_income,
        'expense': total_expense,
        'savings': total_income - total_expense
    }
    
    # --- 2. MONTHLY TRENDS (Line Chart Data) ---
    
    # Query 2: Monthly Income and Expense
    monthly_query = """
        SELECT
            DATE_FORMAT(date, '%%Y-%%m') AS month,
            type,
            SUM(amount) AS total
        FROM
            transaction
        WHERE
            user_id = %s
            AND date >= %s 
        GROUP BY
            month, type
        ORDER BY 
            month
    """
    monthly_results = execute_db_query(monthly_query, (user_id, twelve_months_ago))
    
    monthly_map = {}
    for row in monthly_results:
        month = row['month']
        if month not in monthly_map:
            monthly_map[month] = {'month': month, 'income': 0.0, 'expense': 0.0}
            
        if row['type'].lower() == 'income':
            monthly_map[month]['income'] = float(row['total'])
        elif row['type'].lower() == 'expense':
            monthly_map[month]['expense'] = float(row['total'])

    monthly_data = list(monthly_map.values())
    
    # --- 3. ALERTS / NOTIFICATIONS ---
    
    # Query 3: Fetch active notifications (e.g., last 10 unread or all from last 30 days)
    notifications_query = """
        SELECT 
            notification_id AS id, content AS message, type, created_at AS date 
        FROM 
            notification 
        WHERE 
            user_id = %s AND is_read = FALSE 
        ORDER BY 
            created_at DESC 
        LIMIT 10
    """
    notifications = execute_db_query(notifications_query, (user_id,))
    
    # --- 4. INSIGHTS / REMINDERS (Fetch all reminders and last week's transactions) ---
    
    # Fetch all reminders
    reminders_query = "SELECT title, amount, due_date AS dueDate FROM reminder WHERE user_id = %s"
    reminders = execute_db_query(reminders_query, (user_id,))
    
    # Get transactions for the last two weeks for week-over-week comparison (The frontend handles this logic locally, 
    # but we can provide the raw transactions to simplify the API)
    fourteen_days_ago = (date.today() - relativedelta(days=14)).isoformat()
    weekly_txns_query = """
        SELECT 
            amount, date, type, category
        FROM 
            transaction
        WHERE 
            user_id = %s
            AND date >= %s
        ORDER BY date DESC
    """
    weekly_txns = execute_db_query(weekly_txns_query, (user_id, fourteen_days_ago))

    # Compile the final response
    return jsonify({
        'totals': totals,
        'monthly_trend': monthly_data,
        'expense_breakdown': pie_data,
        'notifications': notifications,
        'reminders': reminders,
        'weekly_transactions': weekly_txns, # Send raw data for weekly calculation
    }), 200


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