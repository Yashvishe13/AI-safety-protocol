"""
Script to populate the database with sample data for demonstration
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'enterprise.db')

def populate_sample_data():
    """Populate database with sample enterprise data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if data already exists
    cursor.execute("SELECT COUNT(*) FROM employees")
    if cursor.fetchone()[0] > 0:
        print("Database already contains data. Skipping sample data insertion.")
        conn.close()
        return
    
    # Insert sample departments
    departments = [
        ('Sales', 'Jane Smith', 500000),
        ('Engineering', 'Bob Johnson', 800000),
        ('Marketing', 'Alice Williams', 300000),
        ('HR', 'Charlie Brown', 200000),
        ('Finance', 'Diana Prince', 400000)
    ]
    
    cursor.executemany(
        "INSERT INTO departments (name, manager, budget) VALUES (?, ?, ?)",
        departments
    )
    
    # Insert sample employees
    employees = [
        ('Jane Smith', 'Sales', 95000, '2020-01-15', 'jane.smith@company.com'),
        ('Bob Johnson', 'Engineering', 120000, '2019-03-20', 'bob.johnson@company.com'),
        ('Alice Williams', 'Marketing', 85000, '2021-06-10', 'alice.williams@company.com'),
        ('Charlie Brown', 'HR', 75000, '2020-09-01', 'charlie.brown@company.com'),
        ('Diana Prince', 'Finance', 90000, '2018-11-15', 'diana.prince@company.com'),
        ('John Doe', 'Sales', 65000, '2022-02-01', 'john.doe@company.com'),
        ('Emma Davis', 'Engineering', 110000, '2021-01-10', 'emma.davis@company.com'),
        ('Michael Chen', 'Engineering', 105000, '2021-08-15', 'michael.chen@company.com'),
        ('Sarah Johnson', 'Marketing', 70000, '2022-04-20', 'sarah.johnson@company.com'),
        ('David Lee', 'Sales', 72000, '2021-12-05', 'david.lee@company.com'),
        ('Lisa Anderson', 'Finance', 80000, '2020-07-10', 'lisa.anderson@company.com'),
        ('Tom Wilson', 'Engineering', 98000, '2022-01-15', 'tom.wilson@company.com'),
        ('Rachel Green', 'HR', 68000, '2021-09-20', 'rachel.green@company.com'),
        ('Kevin Martinez', 'Sales', 78000, '2020-05-01', 'kevin.martinez@company.com'),
        ('Amy Taylor', 'Marketing', 73000, '2021-11-15', 'amy.taylor@company.com')
    ]
    
    cursor.executemany(
        "INSERT INTO employees (name, department, salary, hire_date, email) VALUES (?, ?, ?, ?, ?)",
        employees
    )
    
    # Insert sample projects
    projects = [
        ('Website Redesign', 2, '2024-01-01', '2024-06-30', 150000),
        ('Mobile App Launch', 2, '2024-02-15', '2024-12-31', 300000),
        ('Q1 Marketing Campaign', 3, '2024-01-01', '2024-03-31', 75000),
        ('Sales Training Program', 1, '2024-03-01', '2024-05-31', 50000),
        ('HR System Upgrade', 4, '2024-04-01', '2024-09-30', 100000),
        ('Financial Audit 2024', 5, '2024-01-01', '2024-12-31', 80000),
        ('Customer Portal', 2, '2024-05-01', '2024-11-30', 250000)
    ]
    
    cursor.executemany(
        "INSERT INTO projects (name, department_id, start_date, end_date, budget) VALUES (?, ?, ?, ?, ?)",
        projects
    )
    
    conn.commit()
    conn.close()
    
    print("✅ Sample data inserted successfully!")
    print(f"   - {len(departments)} departments")
    print(f"   - {len(employees)} employees")
    print(f"   - {len(projects)} projects")

if __name__ == '__main__':
    populate_sample_data()

