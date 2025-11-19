from flask import Flask, request, jsonify
from flask_mysqldb import MySQL # or import mysql.connector

app = Flask(__name__)
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'password'
app.config['MYSQL_DB'] = 'fin_db'
mysql = MySQL(app)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/data', methods=['GET'])
def get_data():
    cur = mysql.connection.cursor()
    cur.execute('''SELECT * FROM example''')
    data = cur.fetchall()
    cur.close()
    return jsonify(data)



if __name__ == '__main__':
    app.run(debug=True)