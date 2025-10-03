"""
Specialized Agents for Data Analysis Workflow
"""

import json
import pandas as pd
import sqlite3
from typing import Dict, List, Any
from .agent_framework import BaseAgent, AgentContext
import re


class DataQualityAgent(BaseAgent):
    """Validates data quality, checks for issues, anomalies, and data integrity"""
    
    def __init__(self, db_path: str):
        super().__init__("DataQualityAgent")
        self.db_path = db_path
    
    def can_handle(self, task: str, context: AgentContext) -> bool:
        keywords = ["quality", "validate", "check", "anomaly", "integrity", "clean"]
        return any(keyword in task.lower() for keyword in keywords)
    
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Perform data quality checks on query results"""
        # Get query results from context
        query_results = context.data.get("query_results", [])
        
        quality_report = {
            "agent": self.name,
            "checks_performed": [],
            "issues_found": [],
            "warnings": [],
            "data_quality_score": 0,
            "recommendations": []
        }
        
        # Check if we have query results to validate
        if query_results and len(query_results) > 0:
            # Process first successful query result
            for query_result in query_results:
                if not query_result.get('success', False):
                    continue
                    
                data = query_result.get('data', [])
                columns = query_result.get('columns', [])
            
            if data and columns:
                df = pd.DataFrame(data, columns=columns)
                
                # Perform quality checks
                quality_report["checks_performed"].append("Missing values check")
                missing = df.isnull().sum()
                if missing.any():
                    for col, count in missing[missing > 0].items():
                        quality_report["issues_found"].append({
                            "type": "missing_values",
                            "column": col,
                            "count": int(count),
                            "percentage": round(count / len(df) * 100, 2)
                        })
                
                # Check for duplicates
                quality_report["checks_performed"].append("Duplicate rows check")
                duplicates = df.duplicated().sum()
                if duplicates > 0:
                    quality_report["warnings"].append({
                        "type": "duplicate_rows",
                        "count": int(duplicates),
                        "message": f"Found {duplicates} duplicate rows"
                    })
                
                # Check data types consistency
                quality_report["checks_performed"].append("Data type consistency")
                for col in df.columns:
                    if df[col].dtype == 'object':
                        # Check for mixed types in string columns
                        try:
                            pd.to_numeric(df[col], errors='raise')
                            quality_report["warnings"].append({
                                "type": "data_type_mismatch",
                                "column": col,
                                "message": f"Column '{col}' appears to be numeric but stored as text"
                            })
                        except:
                            pass
                
                # Check for outliers in numeric columns
                quality_report["checks_performed"].append("Outlier detection")
                numeric_cols = df.select_dtypes(include=['number']).columns
                for col in numeric_cols:
                    Q1 = df[col].quantile(0.25)
                    Q3 = df[col].quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = ((df[col] < (Q1 - 1.5 * IQR)) | (df[col] > (Q3 + 1.5 * IQR))).sum()
                    if outliers > 0:
                        quality_report["warnings"].append({
                            "type": "outliers",
                            "column": col,
                            "count": int(outliers),
                            "message": f"Found {outliers} potential outliers in {col}"
                        })
                
                # Calculate overall quality score
                total_checks = len(quality_report["checks_performed"])
                issues_count = len(quality_report["issues_found"]) + len(quality_report["warnings"])
                quality_report["data_quality_score"] = max(0, 100 - (issues_count / total_checks * 20))
                
                # Generate recommendations
                if quality_report["issues_found"]:
                    quality_report["recommendations"].append("Address missing values through imputation or removal")
                if duplicates > 0:
                    quality_report["recommendations"].append("Review and remove duplicate rows if appropriate")
                if quality_report["data_quality_score"] < 70:
                    quality_report["recommendations"].append("Data quality needs improvement before analysis")
                else:
                    quality_report["recommendations"].append("Data quality is acceptable for analysis")
        
        quality_report["success"] = True
        context.data["quality_report"] = quality_report
        
        return quality_report
    
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """After quality check, go to visualization or analysis"""
        # Agent name mapping for backwards compatibility
        agent_name_map = {
            "SQLAgent": "QueryWriterAgent",
            "QueryAgent": "QueryWriterAgent",
        }
        
        # Check the plan
        plan = context.data.get("analysis_plan", {})
        workflow_steps = plan.get("workflow_steps", [])
        
        if workflow_steps:
            # Find our current step
            our_index = next((i for i, step in enumerate(workflow_steps) if step.get("agent") == self.name), -1)
            if our_index >= 0 and our_index < len(workflow_steps) - 1:
                # Return next agent in plan
                next_step = workflow_steps[our_index + 1]
                next_agent = next_step.get("agent", "")
                # Map old names to new names
                next_agent = agent_name_map.get(next_agent, next_agent)
                if next_agent:
                    return [next_agent]
        
        # Default: go to visualization if we have data
        if context.data.get("query_results"):
            return ["VisualizationAgent"]
        
        return []


class VisualizationAgent(BaseAgent):
    """Generates text-based visualizations, charts descriptions, and data summaries"""
    
    def __init__(self, cerebras_api):
        super().__init__("VisualizationAgent")
        self.cerebras_api = cerebras_api
    
    def can_handle(self, task: str, context: AgentContext) -> bool:
        keywords = ["visualize", "chart", "graph", "plot", "dashboard", "visual"]
        return any(keyword in task.lower() for keyword in keywords)
    
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Generate visualization recommendations and text-based charts"""
        # Get query results from context
        query_results = context.data.get("query_results", [])
        
        viz_result = {
            "agent": self.name,
            "visualizations": [],
            "recommendations": [],
            "text_charts": []
        }
        
        # Check if we have query results to visualize
        if query_results and len(query_results) > 0:
            # Process first successful query result
            for query_result in query_results:
                if not query_result.get('success', False):
                    continue
                    
                data = query_result.get('data', [])
                columns = query_result.get('columns', [])
            
            if data and columns:
                df = pd.DataFrame(data, columns=columns)
                
                # Generate text-based visualizations
                numeric_cols = df.select_dtypes(include=['number']).columns
                categorical_cols = df.select_dtypes(include=['object']).columns
                
                # Distribution chart for numeric data
                for col in numeric_cols[:3]:  # Limit to 3 columns
                    text_chart = self._create_text_histogram(df[col], col)
                    viz_result["text_charts"].append(text_chart)
                
                # Bar chart for categorical data
                for col in categorical_cols[:2]:  # Limit to 2 columns
                    if df[col].nunique() <= 10:  # Only if not too many categories
                        text_chart = self._create_text_bar_chart(df[col], col)
                        viz_result["text_charts"].append(text_chart)
                
                # AI-powered visualization recommendations
                summary = f"Data has {len(df)} rows, {len(columns)} columns. "
                summary += f"Numeric columns: {', '.join(numeric_cols)}. "
                summary += f"Categorical columns: {', '.join(categorical_cols)}."
                
                messages = [
                    {
                        "role": "system",
                        "content": "You are a data visualization expert. Recommend the best visualizations for the given data."
                    },
                    {
                        "role": "user",
                        "content": f"Data summary: {summary}\n\nTask: {context.task}\n\nRecommend 3-5 specific visualizations that would best represent this data. Be specific about chart types and what insights they would reveal."
                    }
                ]
                
                recommendations = self.cerebras_api.chat_completion(messages, temperature=0.6, max_tokens=500)
                viz_result["recommendations"] = recommendations
        
        viz_result["success"] = True
        context.data["visualizations"] = viz_result
        
        return viz_result
    
    def _create_text_histogram(self, series: pd.Series, name: str) -> Dict[str, Any]:
        """Create a text-based histogram"""
        bins = 10
        hist, edges = pd.cut(series, bins=bins, retbins=True, duplicates='drop')
        counts = hist.value_counts().sort_index()
        
        max_count = counts.max()
        chart_lines = [f"\n📊 Distribution of {name}:"]
        chart_lines.append("=" * 50)
        
        for interval, count in counts.items():
            if pd.isna(interval):
                continue
            bar_length = int((count / max_count) * 40)
            bar = "█" * bar_length
            label = f"{interval.left:.1f}-{interval.right:.1f}"
            chart_lines.append(f"{label:15} | {bar} {count}")
        
        return {
            "type": "histogram",
            "column": name,
            "chart": "\n".join(chart_lines)
        }
    
    def _create_text_bar_chart(self, series: pd.Series, name: str) -> Dict[str, Any]:
        """Create a text-based bar chart"""
        value_counts = series.value_counts().head(10)
        max_count = value_counts.max()
        
        chart_lines = [f"\n📊 {name} Distribution:"]
        chart_lines.append("=" * 50)
        
        for value, count in value_counts.items():
            bar_length = int((count / max_count) * 40)
            bar = "█" * bar_length
            chart_lines.append(f"{str(value):15} | {bar} {count}")
        
        return {
            "type": "bar_chart",
            "column": name,
            "chart": "\n".join(chart_lines)
        }
    
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """After visualization, go to final analysis agent"""
        # Agent name mapping for backwards compatibility
        agent_name_map = {
            "SQLAgent": "QueryWriterAgent",
            "QueryAgent": "QueryWriterAgent",
        }
        
        # Check the plan
        plan = context.data.get("analysis_plan", {})
        workflow_steps = plan.get("workflow_steps", [])
        
        if workflow_steps:
            # Find our current step
            our_index = next((i for i, step in enumerate(workflow_steps) if step.get("agent") == self.name), -1)
            if our_index >= 0 and our_index < len(workflow_steps) - 1:
                # Return next agent in plan
                next_step = workflow_steps[our_index + 1]
                next_agent = next_step.get("agent", "")
                # Map old names to new names
                next_agent = agent_name_map.get(next_agent, next_agent)
                if next_agent:
                    return [next_agent]
        
        # Default: go to analysis agent to generate final report
        return ["DataAnalysisAgent"]


class DataAnalysisPlannerAgent(BaseAgent):
    """Plans the entire data analysis workflow - the orchestrator of the analysis"""
    
    def __init__(self, cerebras_api):
        super().__init__("DataAnalysisPlannerAgent")
        self.cerebras_api = cerebras_api
    
    def can_handle(self, task: str, context: AgentContext) -> bool:
        # Planner can handle any analysis task
        return "analyz" in task.lower() or "plan" in task.lower()
    
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Create a comprehensive analysis plan"""
        # Get available agents
        available_agents = self.registry.list_agents() if self.registry else []
        
        messages = [
            {
                "role": "system",
                "content": f"""You are a data analysis planning expert. Create a detailed workflow plan.

IMPORTANT: You must use ONLY these exact agent names in your plan:
- QueryWriterAgent: Writes and executes SQL queries to gather data
- DataQualityAgent: Validates data quality and checks for issues
- VisualizationAgent: Creates visualizations and charts
- DataAnalysisAgent: Performs analysis and generates reports

Your job is to create a step-by-step plan for data analysis. A typical workflow:
1. QueryWriterAgent - Generate SQL queries to gather necessary data
2. DataQualityAgent - Check data quality and identify issues
3. VisualizationAgent - Create visualizations if needed
4. DataAnalysisAgent - Generate final comprehensive analysis report

Respond with a JSON plan using ONLY the agent names listed above:
{{
    "analysis_goal": "clear goal statement",
    "workflow_steps": [
        {{"step": 1, "agent": "QueryWriterAgent", "action": "description", "rationale": "why"}},
        {{"step": 2, "agent": "DataQualityAgent", "action": "description", "rationale": "why"}},
        ...
    ],
    "expected_insights": ["insight 1", "insight 2"],
    "success_criteria": "how to measure success"
}}"""
            },
            {
                "role": "user",
                "content": f"Create an analysis plan for: {context.task}"
            }
        ]
        
        plan_response = self.cerebras_api.chat_completion(messages, temperature=0.5, max_tokens=1000)
        
        # Parse the plan - handle markdown code blocks
        try:
            # Remove markdown code blocks if present
            cleaned_response = plan_response
            if '```json' in plan_response:
                # Extract JSON from markdown code blocks
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', plan_response, re.DOTALL)
                if json_match:
                    cleaned_response = json_match.group(1)
            elif '```' in plan_response:
                # Handle generic code blocks
                json_match = re.search(r'```\s*(\{.*?\})\s*```', plan_response, re.DOTALL)
                if json_match:
                    cleaned_response = json_match.group(1)
            
            # Try to find JSON object
            json_match = re.search(r'\{.*\}', cleaned_response, re.DOTALL)
            if json_match:
                plan = json.loads(json_match.group())
            else:
                # Default plan
                plan = {
                    "analysis_goal": context.task,
                    "workflow_steps": [
                        {"step": 1, "agent": "QueryWriterAgent", "action": "Generate and execute queries", "rationale": "Need data"},
                        {"step": 2, "agent": "DataQualityAgent", "action": "Validate data quality", "rationale": "Ensure quality"},
                        {"step": 3, "agent": "VisualizationAgent", "action": "Create visualizations", "rationale": "Visual insights"},
                        {"step": 4, "agent": "DataAnalysisAgent", "action": "Generate comprehensive report", "rationale": "Final analysis"}
                    ],
                    "expected_insights": ["Data patterns", "Key metrics", "Recommendations"],
                    "success_criteria": "Comprehensive analysis report"
                }
        except Exception as e:
            # Fallback plan on any error
            plan = {
                "analysis_goal": context.task,
                "workflow_steps": [
                    {"step": 1, "agent": "QueryWriterAgent", "action": "Generate and execute queries", "rationale": "Need data"},
                    {"step": 2, "agent": "DataQualityAgent", "action": "Validate data quality", "rationale": "Ensure quality"},
                    {"step": 3, "agent": "VisualizationAgent", "action": "Create visualizations", "rationale": "Visual insights"},
                    {"step": 4, "agent": "DataAnalysisAgent", "action": "Generate comprehensive report", "rationale": "Final analysis"}
                ],
                "expected_insights": ["Data patterns", "Key metrics", "Recommendations"],
                "success_criteria": "Comprehensive analysis report",
                "parse_error": str(e)
            }
        
        plan["agent"] = self.name
        plan["success"] = True
        context.data["analysis_plan"] = plan
        
        return plan
    
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """Based on the plan, decide which agent to call first"""
        # Agent name mapping for backwards compatibility
        agent_name_map = {
            "SQLAgent": "QueryWriterAgent",
            "QueryAgent": "QueryWriterAgent",
        }
        
        plan = context.data.get("analysis_plan", {})
        workflow_steps = plan.get("workflow_steps", [])
        
        if workflow_steps and len(workflow_steps) > 0:
            # Find the first step that's not the planner itself
            for step in workflow_steps:
                agent_name = step.get("agent", "")
                # Map old names to new names
                agent_name = agent_name_map.get(agent_name, agent_name)
                if agent_name != "DataAnalysisPlannerAgent" and agent_name:
                    return [agent_name]
        
        # Default workflow - start with QueryWriter
        return ["QueryWriterAgent"]


class QueryWriterAgent(BaseAgent):
    """Specialized agent for writing optimized SQL queries"""
    
    def __init__(self, db_path: str, cerebras_api):
        super().__init__("QueryWriterAgent")
        self.db_path = db_path
        self.cerebras_api = cerebras_api
    
    def can_handle(self, task: str, context: AgentContext) -> bool:
        keywords = ["query", "sql", "select", "data", "fetch", "retrieve"]
        return any(keyword in task.lower() for keyword in keywords)
    
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Generate optimized SQL queries for the task"""
        # Get database schema
        schema = self._get_schema()
        
        # Check if we have an analysis plan
        plan = context.data.get("analysis_plan", {})
        workflow_steps = plan.get("workflow_steps", [])
        
        # Find our step in the plan
        our_step = next((step for step in workflow_steps if step.get("agent") == self.name), None)
        action_context = our_step.get("action", context.task) if our_step else context.task
        
        messages = [
            {
                "role": "system",
                "content": f"""You are an expert SQL query writer for SQLite databases. Generate optimized queries.

Database Schema:
{schema}

CRITICAL SQLite Rules:
1. Use strftime('%Y', date_column) instead of YEAR() function
2. Use strftime('%m', date_column) instead of MONTH() function  
3. When using COUNT with GROUP BY, use COUNT(*) or COUNT(1), not COUNT(column)
4. When grouping, only select aggregated columns or columns in GROUP BY
5. SQLite has: julianday(), date(), strftime() for date operations

Generate 2-5 SQL queries that will gather the necessary data for analysis.
Consider:
- Aggregations (GROUP BY, AVG, SUM, COUNT(*))
- Joins if multiple tables needed
- Filtering (WHERE clauses)
- Sorting (ORDER BY)
- Use COUNT(*) for counting rows

Example: SELECT department, COUNT(*) as employee_count, AVG(salary) as avg_salary FROM employees GROUP BY department

Respond with JSON:
{{
    "queries": [
        {{"purpose": "description", "sql": "SELECT ..."}},
        {{"purpose": "description", "sql": "SELECT ..."}}
    ],
    "rationale": "why these queries"
}}"""
            },
            {
                "role": "user",
                "content": f"Task: {action_context}\n\nGenerate SQL queries for this analysis."
            }
        ]
        
        response = self.cerebras_api.chat_completion(messages, temperature=0.3, max_tokens=1500)
        
        # Parse queries
        try:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                queries_data = json.loads(json_match.group())
            else:
                queries_data = {"queries": [], "error": "Failed to parse queries"}
        except:
            queries_data = {"queries": [], "error": "JSON parse error", "raw": response}
        
        # Execute queries
        executed_queries = []
        for query_info in queries_data.get("queries", []):
            sql = query_info.get("sql", "")
            if sql:
                try:
                    conn = sqlite3.connect(self.db_path)
                    df = pd.read_sql_query(sql, conn)
                    conn.close()
                    
                    executed_queries.append({
                        "purpose": query_info.get("purpose", ""),
                        "sql": sql,
                        "success": True,
                        "data": df.to_dict('records'),
                        "columns": list(df.columns),
                        "row_count": len(df)
                    })
                except Exception as e:
                    executed_queries.append({
                        "purpose": query_info.get("purpose", ""),
                        "sql": sql,
                        "success": False,
                        "error": str(e)
                    })
        
        result = {
            "agent": self.name,
            "success": True,
            "queries_executed": executed_queries,
            "total_queries": len(executed_queries)
        }
        
        context.data["query_results"] = executed_queries
        
        return result
    
    def _get_schema(self) -> str:
        """Get database schema"""
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
    
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """After writing queries, go to data quality or visualization"""
        # Agent name mapping for backwards compatibility
        agent_name_map = {
            "SQLAgent": "QueryWriterAgent",
            "QueryAgent": "QueryWriterAgent",
        }
        
        # Check the plan
        plan = context.data.get("analysis_plan", {})
        workflow_steps = plan.get("workflow_steps", [])
        
        if workflow_steps:
            # Find our current step
            our_index = next((i for i, step in enumerate(workflow_steps) if step.get("agent") == self.name), -1)
            if our_index >= 0 and our_index < len(workflow_steps) - 1:
                # Return next agent in plan
                next_step = workflow_steps[our_index + 1]
                next_agent = next_step.get("agent", "")
                # Map old names to new names
                next_agent = agent_name_map.get(next_agent, next_agent)
                if next_agent:
                    return [next_agent]
        
        # Default: go to data quality check if we have query results
        if context.data.get("query_results"):
            return ["DataQualityAgent"]
        
        return []

