"""
Advanced Multi-Agent Orchestrator
Integrates the new agent framework with existing functionality
"""

from .agent_framework import AgentRegistry, AgentWorkflowEngine, AgentContext, BaseAgent
from .specialized_agents import (
    DataQualityAgent,
    VisualizationAgent,
    DataAnalysisPlannerAgent,
    QueryWriterAgent
)
from .agents import CerebrasAPI, SQLAgent, DataAnalysisAgent, DataIngestionAgent
from typing import Dict, Any, List
import re


class EnhancedDataAnalysisAgent(BaseAgent):
    """
    Enhanced DataAnalysisAgent that works within the agent framework
    This is a wrapper around the original agent with autonomous decision-making
    """
    
    def __init__(self, db_path: str, cerebras_api: CerebrasAPI):
        super().__init__("DataAnalysisAgent")
        self.db_path = db_path
        self.cerebras_api = cerebras_api
        from .agents import DataAnalysisAgent as OriginalAgent
        self.original_agent = OriginalAgent(db_path, cerebras_api)
    
    def can_handle(self, task: str, context: AgentContext) -> bool:
        return "analyz" in task.lower()
    
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Execute comprehensive analysis using query results and quality data"""
        # Get data from previous agents
        query_results = context.data.get("query_results", [])
        quality_report = context.data.get("quality_report", {})
        visualizations = context.data.get("visualizations", {})
        
        # Generate comprehensive analysis report
        report = self._generate_enhanced_report(context.task, query_results, quality_report, visualizations)
        
        context.data["final_report"] = report
        return report
    
    def _generate_enhanced_report(self, task: str, query_results: List, quality_report: Dict, visualizations: Dict) -> Dict[str, Any]:
        """Generate enhanced report incorporating all agent outputs"""
        # Prepare data summary for AI
        data_summary = []
        for i, qr in enumerate(query_results):
            if qr.get("success"):
                data_summary.append(f"Query {i+1} ({qr.get('purpose', 'N/A')}): {qr.get('row_count', 0)} rows returned")
        
        quality_summary = ""
        if quality_report:
            quality_score = quality_report.get("data_quality_score", 0)
            issues = quality_report.get("issues_found", [])
            quality_summary = f"Data Quality Score: {quality_score}/100. Issues found: {len(issues)}"
        
        viz_summary = ""
        if visualizations:
            charts = visualizations.get("text_charts", [])
            viz_summary = f"{len(charts)} visualizations generated"
        
        # Prepare ALL query results for the AI
        all_query_data = []
        for i, qr in enumerate(query_results):
            if qr.get("success"):
                all_query_data.append(f"\nQuery {i+1}: {qr.get('purpose', 'N/A')}")
                all_query_data.append(f"SQL: {qr.get('sql', 'N/A')}")
                all_query_data.append(f"Results: {str(qr.get('data', []))}")
                all_query_data.append(f"Row Count: {qr.get('row_count', 0)}")
        
        # Generate comprehensive report using AI
        messages = [
            {
                "role": "system",
                "content": """You are a data analyst. Write a concise professional analysis report.

CRITICAL: ONLY use numbers from the actual query results. DO NOT invent statistics.

Structure (be concise):

# EXECUTIVE SUMMARY
(2-3 sentences)

# KEY FINDINGS
(Top 3-5 findings from query results)

# STATISTICAL SUMMARY
(Key metrics from query results only)

# DATA QUALITY
(Score: {quality_score}, issues: {issues_count})

# RECOMMENDATIONS
(Top 3 actionable recommendations)

# CONCLUSION
(1 paragraph summary)

Keep it concise and data-driven."""
            },
            {
                "role": "user",
                "content": f"""Task: {task}

Query Results:
{chr(10).join(all_query_data[:2000])}

Quality: {quality_summary}

Generate report using ONLY the data above."""
            }
        ]
        
        full_report = self.cerebras_api.chat_completion(messages, temperature=0.5, max_tokens=1500)
        
        # Generate executive summary
        summary_messages = [
            {
                "role": "system",
                "content": "Provide a concise 2-3 sentence executive summary."
            },
            {
                "role": "user",
                "content": f"Summarize: {full_report[:1000]}"
            }
        ]
        
        executive_summary = self.cerebras_api.chat_completion(summary_messages, temperature=0.5, max_tokens=100)
        
        return {
            "success": True,
            "agent": self.name,
            "analysis_title": f"Comprehensive Analysis: {task}",
            "executive_summary": executive_summary,
            "full_report": full_report,
            "data_quality_score": quality_report.get("data_quality_score", "N/A") if quality_report else "N/A",
            "queries_analyzed": len(query_results),
            "quality_issues": len(quality_report.get("issues_found", [])) if quality_report else 0,
            "visualizations_count": len(visualizations.get("text_charts", [])) if visualizations else 0,
            "query_results": query_results,
            "quality_report": quality_report,
            "visualizations": visualizations
        }
    
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """Analysis is usually the final step"""
        return []


class AdvancedMultiAgentOrchestrator:
    """
    Advanced orchestrator that manages both simple and complex multi-agent workflows
    """
    
    def __init__(self, db_path: str, cerebras_api_key: str, model: str = "llama3.1-8b"):
        self.db_path = db_path
        self.cerebras_api = CerebrasAPI(cerebras_api_key, model)
        
        # Initialize agent registry
        self.registry = AgentRegistry()
        
        # Initialize workflow engine
        self.workflow_engine = AgentWorkflowEngine(self.registry)
        
        # Keep original agents for backward compatibility
        self.sql_agent = SQLAgent(db_path, self.cerebras_api)
        self.analysis_agent = DataAnalysisAgent(db_path, self.cerebras_api)
        self.ingestion_agent = DataIngestionAgent(db_path, self.cerebras_api)
        
        # Initialize new specialized agents
        self._setup_advanced_agents()
    
    def _setup_advanced_agents(self):
        """Setup all agents in the framework"""
        # Register specialized agents
        planner = DataAnalysisPlannerAgent(self.cerebras_api)
        self.registry.register("DataAnalysisPlannerAgent", planner)
        
        query_writer = QueryWriterAgent(self.db_path, self.cerebras_api)
        self.registry.register("QueryWriterAgent", query_writer)
        
        quality_agent = DataQualityAgent(self.db_path)
        self.registry.register("DataQualityAgent", quality_agent)
        
        viz_agent = VisualizationAgent(self.cerebras_api)
        self.registry.register("VisualizationAgent", viz_agent)
        
        analysis_agent = EnhancedDataAnalysisAgent(self.db_path, self.cerebras_api)
        self.registry.register("DataAnalysisAgent", analysis_agent)
    
    def advanced_analysis(self, user_request: str) -> Dict[str, Any]:
        """
        Perform advanced multi-agent analysis workflow
        Agents autonomously decide their next steps
        """
        try:
            # Start with the planner agent
            result = self.workflow_engine.execute_workflow(
                initial_agent="DataAnalysisPlannerAgent",
                task=user_request,
                initial_data={}
            )
            
            # Format the result for the UI
            final_report = result.get("final_result", {})
            workflow_history = result.get("workflow", [])
            
            # Enhance with workflow information
            enhanced_result = {
                "success": True,
                "mode": "advanced_multi_agent",
                "analysis_title": final_report.get("analysis_title", "Advanced Analysis Report"),
                "executive_summary": final_report.get("executive_summary", ""),
                "full_report": final_report.get("full_report", ""),
                "workflow_steps": [
                    {
                        "step": i + 1,
                        "agent": step.get("agent", ""),
                        "action": step.get("action", ""),
                        "success": step.get("result", {}).get("success", False)
                    }
                    for i, step in enumerate(workflow_history)
                ],
                "total_agents_used": len(workflow_history),
                "data_quality_score": final_report.get("data_quality_score", "N/A"),
                "queries_executed": final_report.get("queries_analyzed", 0),
                "visualizations": final_report.get("visualizations", {}),
                "quality_report": final_report.get("quality_report", {}),
                "query_results": final_report.get("query_results", []),
                "execution_id": result.get("execution_id", ""),
                "log_file": result.get("log_file", "")
            }
            
            return enhanced_result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Advanced analysis failed: {str(e)}",
                "mode": "advanced_multi_agent"
            }
    
    def simple_analysis(self, user_request: str) -> Dict[str, Any]:
        """
        Simple analysis using the original agent (for backward compatibility)
        """
        return self.analysis_agent.analyze_data(user_request)
    
    def route_request(self, user_input: str, use_advanced: bool = True) -> Dict[str, Any]:
        """
        Route user request to appropriate workflow
        
        Args:
            user_input: User's request
            use_advanced: If True, use advanced multi-agent workflow; if False, use simple workflow
        """
        # Classify the request
        messages = [
            {
                "role": "system",
                "content": """Classify user requests into categories:
                
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
                "mode": "simple",
                "result": self.sql_agent.process_user_query(user_input)
            }
        elif "analysis" in category or "analys" in category:
            if use_advanced:
                result = self.advanced_analysis(user_input)
                return {
                    "agent": "Advanced Multi-Agent System",
                    "mode": "advanced",
                    "result": result
                }
            else:
                return {
                    "agent": "Analysis Agent",
                    "mode": "simple",
                    "result": self.simple_analysis(user_input)
                }
        elif "ingest" in category:
            return {
                "agent": "Ingestion Agent",
                "mode": "simple",
                "result": {"success": False, "message": "Please use the data ingestion API endpoint"}
            }
        else:
            # Default to SQL agent
            return {
                "agent": "SQL Agent",
                "mode": "simple",
                "result": self.sql_agent.process_user_query(user_input)
            }

