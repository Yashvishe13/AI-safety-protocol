"""
Multi-Agent System for Database Management
Agents: SQL Agent, Analysis Agent, Data Ingestion Agent
"""

import json
import sqlite3
from typing import Dict, List, Any, Optional
import requests
import pandas as pd
import re


class CerebrasAPI:
    """Cerebras API client for LLM interactions"""
    
    def __init__(self, api_key: str, model: str = "llama3.1-8b"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.cerebras.ai/v1/chat/completions"
        
    def chat_completion(self, messages: List[Dict[str, str]], temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """Send chat completion request to Cerebras API"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
        except Exception as e:
            return f"Error calling Cerebras API: {str(e)}"


class SQLAgent:
    """Agent responsible for SQL operations"""
    
    def __init__(self, db_path: str, cerebras_api: CerebrasAPI):
        self.db_path = db_path
        self.cerebras_api = cerebras_api
        self.initialize_db()
        
    def initialize_db(self):
        """Initialize database with sample schema if empty"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create sample tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department TEXT,
                salary REAL,
                hire_date TEXT,
                email TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                manager TEXT,
                budget REAL
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                department_id INTEGER,
                start_date TEXT,
                end_date TEXT,
                budget REAL,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )
        """)
        
        conn.commit()
        conn.close()
        
    def get_schema(self) -> str:
        """Get database schema information"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema_info = []
        for table in tables:
            table_name = table[0]
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            column_info = [f"{col[1]} ({col[2]})" for col in columns]
            schema_info.append(f"Table: {table_name}\nColumns: {', '.join(column_info)}")
        
        conn.close()
        return "\n\n".join(schema_info)
    
    def natural_language_to_sql(self, query: str) -> str:
        """Convert natural language query to SQL using Cerebras API"""
        schema = self.get_schema()
        
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert SQL generator. Convert natural language queries to SQLite SQL queries.
                
Database Schema:
{schema}

Rules:
1. Return ONLY the SQL query, no explanations
2. Use proper SQLite syntax
3. For SELECT queries, include appropriate WHERE, JOIN, GROUP BY, ORDER BY clauses as needed
4. For INSERT queries, use proper INSERT INTO syntax
5. For UPDATE queries, use proper UPDATE syntax with WHERE clause
6. For DELETE queries, use proper DELETE syntax with WHERE clause
7. Do not include markdown formatting, just the raw SQL query"""
            },
            {
                "role": "user",
                "content": f"Convert this to SQL: {query}"
            }
        ]
        
        sql_query = self.cerebras_api.chat_completion(messages, temperature=0.3)
        # Clean up the response - remove markdown code blocks if present
        sql_query = sql_query.strip()
        sql_query = re.sub(r'```sql\n?', '', sql_query)
        sql_query = re.sub(r'```\n?', '', sql_query)
        return sql_query.strip()
    
    def execute_query(self, sql_query: str) -> Dict[str, Any]:
        """Execute SQL query and return results"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Determine query type
            query_type = sql_query.strip().split()[0].upper()
            
            cursor.execute(sql_query)
            
            if query_type == "SELECT":
                results = cursor.fetchall()
                columns = [description[0] for description in cursor.description] if cursor.description else []
                conn.close()
                
                return {
                    "success": True,
                    "data": results,
                    "columns": columns,
                    "row_count": len(results),
                    "query": sql_query
                }
            else:
                conn.commit()
                affected_rows = cursor.rowcount
                conn.close()
                
                return {
                    "success": True,
                    "message": f"{query_type} operation successful. Rows affected: {affected_rows}",
                    "affected_rows": affected_rows,
                    "query": sql_query
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": sql_query
            }
    
    def process_user_query(self, user_query: str) -> Dict[str, Any]:
        """Process natural language query from user"""
        sql_query = self.natural_language_to_sql(user_query)
        result = self.execute_query(sql_query)
        return result


class DataAnalysisAgent:
    """Agent responsible for autonomous data analysis and report generation"""
    
    def __init__(self, db_path: str, cerebras_api: CerebrasAPI):
        self.db_path = db_path
        self.cerebras_api = cerebras_api
        
    def get_database_context(self) -> str:
        """Get comprehensive database context for analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [table[0] for table in cursor.fetchall()]
        
        context = "Database Structure:\n\n"
        
        for table in tables:
            # Get table schema
            cursor.execute(f"PRAGMA table_info({table});")
            columns = cursor.fetchall()
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            
            context += f"Table: {table} ({count} rows)\n"
            context += "Columns: " + ", ".join([f"{col[1]} ({col[2]})" for col in columns]) + "\n\n"
        
        conn.close()
        return context
    
    def execute_analysis_queries(self, queries: List[str]) -> Dict[str, pd.DataFrame]:
        """Execute multiple analysis queries and return results"""
        results = {}
        conn = sqlite3.connect(self.db_path)
        
        for i, query in enumerate(queries):
            try:
                df = pd.read_sql_query(query, conn)
                results[f"query_{i+1}"] = df
            except Exception as e:
                results[f"query_{i+1}"] = pd.DataFrame({"error": [str(e)]})
        
        conn.close()
        return results
    
    def generate_statistical_summary(self, df: pd.DataFrame) -> str:
        """Generate comprehensive statistical summary"""
        if df.empty:
            return "No data available for statistical analysis."
        
        summary = []
        
        # Basic info
        summary.append(f"Dataset Size: {len(df)} rows, {len(df.columns)} columns")
        
        # Numeric columns analysis
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            summary.append("\nNumeric Columns Statistics:")
            for col in numeric_cols:
                stats = df[col].describe()
                summary.append(f"\n  {col}:")
                summary.append(f"    - Mean: {stats['mean']:.2f}")
                summary.append(f"    - Median: {df[col].median():.2f}")
                summary.append(f"    - Std Dev: {stats['std']:.2f}")
                summary.append(f"    - Min: {stats['min']:.2f}")
                summary.append(f"    - Max: {stats['max']:.2f}")
        
        # Categorical columns analysis
        categorical_cols = df.select_dtypes(include=['object']).columns
        if len(categorical_cols) > 0:
            summary.append("\nCategorical Columns:")
            for col in categorical_cols:
                unique_count = df[col].nunique()
                summary.append(f"\n  {col}:")
                summary.append(f"    - Unique values: {unique_count}")
                if unique_count <= 10:  # Show distribution for small number of categories
                    value_counts = df[col].value_counts().head(5)
                    summary.append(f"    - Top values: {dict(value_counts)}")
        
        return "\n".join(summary)
    
    def analyze_data(self, user_request: str) -> Dict[str, Any]:
        """Autonomously analyze data and generate comprehensive text report"""
        
        # Step 1: Get database context
        db_context = self.get_database_context()
        
        # Step 2: Ask AI to create analysis plan with multiple queries
        planning_messages = [
            {
                "role": "system",
                "content": f"""You are an expert data analyst. Create a comprehensive analysis plan.

{db_context}

Your task:
1. Understand the user's analysis request
2. Determine which tables and columns to analyze
3. Generate 2-5 SQL queries to gather necessary data
4. Plan what insights to extract

Respond with a JSON object:
{{
    "analysis_title": "Title for the analysis",
    "tables_involved": ["table1", "table2"],
    "sql_queries": [
        "SELECT query 1...",
        "SELECT query 2...",
        "SELECT query 3..."
    ],
    "focus_areas": ["area1", "area2", "area3"]
}}

Generate queries that cover different aspects of the analysis."""
            },
            {
                "role": "user",
                "content": f"Analysis Request: {user_request}"
            }
        ]
        
        plan_response = self.cerebras_api.chat_completion(planning_messages, temperature=0.5, max_tokens=1500)
        
        try:
            # Extract JSON plan
            json_match = re.search(r'\{.*\}', plan_response, re.DOTALL)
            if json_match:
                analysis_plan = json.loads(json_match.group())
            else:
                # Fallback plan
                analysis_plan = {
                    "analysis_title": "Data Analysis",
                    "tables_involved": [],
                    "sql_queries": ["SELECT * FROM employees LIMIT 100"],
                    "focus_areas": ["General overview"]
                }
            
            # Step 3: Execute all planned queries
            query_results = self.execute_analysis_queries(analysis_plan.get('sql_queries', []))
            
            # Step 4: Prepare data summaries for each query result
            query_summaries = []
            for query_name, df in query_results.items():
                if not df.empty and 'error' not in df.columns:
                    summary = {
                        "query": analysis_plan['sql_queries'][int(query_name.split('_')[1]) - 1],
                        "rows": len(df),
                        "columns": list(df.columns),
                        "sample_data": df.head(10).to_string(),
                        "statistics": self.generate_statistical_summary(df)
                    }
                    query_summaries.append(summary)
            
            # Step 5: Generate comprehensive analysis report
            report_messages = [
                {
                    "role": "system",
                    "content": """You are a senior data analyst writing a comprehensive analysis report.

Based on the query results provided, write a detailed, professional analysis report.

Structure your report as follows:

# EXECUTIVE SUMMARY
(2-3 sentences overview of key findings)

# DETAILED ANALYSIS

## [Finding 1 Title]
- Detailed explanation
- Supporting data points
- Implications

## [Finding 2 Title]
- Detailed explanation
- Supporting data points
- Implications

(Continue for all major findings)

# KEY METRICS
- Metric 1: [value and context]
- Metric 2: [value and context]
(etc.)

# INSIGHTS & PATTERNS
- Pattern 1: [explanation]
- Pattern 2: [explanation]
(etc.)

# RECOMMENDATIONS
1. [Actionable recommendation based on findings]
2. [Another recommendation]
(etc.)

# CONCLUSION
(Brief summary and next steps)

Write in a professional, clear style. Use actual numbers from the data. Be specific and actionable."""
                },
                {
                    "role": "user",
                    "content": f"""Analysis Request: {user_request}

Query Results:

{chr(10).join([f"Query {i+1}: {summary['query']}\nRows returned: {summary['rows']}\nStatistics:\n{summary['statistics']}\n\nSample Data:\n{summary['sample_data']}\n" for i, summary in enumerate(query_summaries)])}

Generate a comprehensive analysis report based on this data."""
                }
            ]
            
            # Generate the full report
            analysis_report = self.cerebras_api.chat_completion(report_messages, temperature=0.7, max_tokens=3000)
            
            # Step 6: Create executive summary separately for quick view
            summary_messages = [
                {
                    "role": "system",
                    "content": "You are a data analyst. Provide a concise 2-3 sentence executive summary of the key findings."
                },
                {
                    "role": "user",
                    "content": f"Summarize these findings in 2-3 sentences:\n\n{analysis_report}"
                }
            ]
            
            executive_summary = self.cerebras_api.chat_completion(summary_messages, temperature=0.5, max_tokens=200)
            
            # Return comprehensive results
            return {
                "success": True,
                "analysis_title": analysis_plan.get('analysis_title', 'Data Analysis Report'),
                "executive_summary": executive_summary,
                "full_report": analysis_report,
                "queries_executed": analysis_plan.get('sql_queries', []),
                "tables_analyzed": analysis_plan.get('tables_involved', []),
                "total_queries": len(query_summaries),
                "focus_areas": analysis_plan.get('focus_areas', []),
                "raw_statistics": {f"query_{i+1}": summary['statistics'] for i, summary in enumerate(query_summaries)},
                "sample_data": query_summaries[0].get('sample_data', '') if query_summaries else ''
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}",
                "details": plan_response if 'plan_response' in locals() else "No plan generated"
            }


class DataIngestionAgent:
    """Agent responsible for data ingestion"""
    
    def __init__(self, db_path: str, cerebras_api: CerebrasAPI):
        self.db_path = db_path
        self.cerebras_api = cerebras_api
        
    def ingest_csv(self, file_path: str, table_name: str) -> Dict[str, Any]:
        """Ingest data from CSV file"""
        try:
            df = pd.read_csv(file_path)
            
            conn = sqlite3.connect(self.db_path)
            df.to_sql(table_name, conn, if_exists='append', index=False)
            conn.close()
            
            return {
                "success": True,
                "message": f"Successfully ingested {len(df)} rows into {table_name}",
                "rows_inserted": len(df)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def ingest_json(self, data: List[Dict], table_name: str) -> Dict[str, Any]:
        """Ingest data from JSON"""
        try:
            df = pd.DataFrame(data)
            
            conn = sqlite3.connect(self.db_path)
            df.to_sql(table_name, conn, if_exists='append', index=False)
            conn.close()
            
            return {
                "success": True,
                "message": f"Successfully ingested {len(df)} rows into {table_name}",
                "rows_inserted": len(df)
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def smart_ingest(self, data_description: str, data: Any) -> Dict[str, Any]:
        """Use AI to intelligently ingest data"""
        # Use Cerebras to understand the data and create appropriate table
        messages = [
            {
                "role": "system",
                "content": "You are a database architect. Analyze data and suggest table name and schema."
            },
            {
                "role": "user",
                "content": f"Data description: {data_description}\nSuggest a table name (respond with just the table name, lowercase, no spaces)"
            }
        ]
        
        table_name = self.cerebras_api.chat_completion(messages, temperature=0.3).strip().lower()
        table_name = re.sub(r'[^a-z0-9_]', '_', table_name)
        
        if isinstance(data, list):
            return self.ingest_json(data, table_name)
        else:
            return {
                "success": False,
                "error": "Unsupported data format"
            }


class MultiAgentOrchestrator:
    """Orchestrates multiple agents for database management"""
    
    def __init__(self, db_path: str, cerebras_api_key: str, model: str = "llama3.1-8b"):
        self.cerebras_api = CerebrasAPI(cerebras_api_key, model)
        self.sql_agent = SQLAgent(db_path, self.cerebras_api)
        self.analysis_agent = DataAnalysisAgent(db_path, self.cerebras_api)
        self.ingestion_agent = DataIngestionAgent(db_path, self.cerebras_api)
        
    def route_request(self, user_input: str) -> Dict[str, Any]:
        """Route user request to appropriate agent"""
        messages = [
            {
                "role": "system",
                "content": """You are a request router. Classify user requests into one of these categories:
                
1. "sql" - Direct database queries (SELECT, INSERT, UPDATE, DELETE)
2. "analysis" - Data analysis, insights, trends, statistics
3. "ingestion" - Data import, upload, or bulk insert

Respond with ONLY the category name: sql, analysis, or ingestion"""
            },
            {
                "role": "user",
                "content": user_input
            }
        ]
        
        category = self.cerebras_api.chat_completion(messages, temperature=0.2).strip().lower()
        
        if "sql" in category or "query" in category:
            return {
                "agent": "SQL Agent",
                "result": self.sql_agent.process_user_query(user_input)
            }
        elif "analysis" in category or "analys" in category:
            return {
                "agent": "Analysis Agent",
                "result": self.analysis_agent.analyze_data(user_input)
            }
        elif "ingest" in category:
            return {
                "agent": "Ingestion Agent",
                "result": {"success": False, "message": "Please use the data ingestion API endpoint"}
            }
        else:
            # Default to SQL agent
            return {
                "agent": "SQL Agent",
                "result": self.sql_agent.process_user_query(user_input)
            }

