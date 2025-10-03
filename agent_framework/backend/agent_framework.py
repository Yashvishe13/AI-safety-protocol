"""
Advanced Multi-Agent Framework
Agents can autonomously decide which agents to call next based on the task
"""

from typing import Dict, List, Any, Optional, Callable
from abc import ABC, abstractmethod
import json
from dataclasses import dataclass, field
from agent_logger import get_logger


@dataclass
class AgentContext:
    """Context passed between agents"""
    task: str
    data: Dict[str, Any] = field(default_factory=dict)
    history: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def add_step(self, agent_name: str, action: str, result: Any):
        """Record an agent's action in the workflow"""
        self.history.append({
            "agent": agent_name,
            "action": action,
            "result": result,
            "step": len(self.history) + 1
        })
    
    def get_last_result(self) -> Optional[Any]:
        """Get result from the last agent"""
        if self.history:
            return self.history[-1].get('result')
        return None


class AgentRegistry:
    """Registry to track all available agents"""
    
    def __init__(self):
        self._agents: Dict[str, 'BaseAgent'] = {}
    
    def register(self, name: str, agent: 'BaseAgent'):
        """Register an agent"""
        self._agents[name] = agent
        agent.set_registry(self)
    
    def get(self, name: str) -> Optional['BaseAgent']:
        """Get agent by name"""
        return self._agents.get(name)
    
    def list_agents(self) -> List[str]:
        """List all registered agent names"""
        return list(self._agents.keys())


class BaseAgent(ABC):
    """Base class for all agents"""
    
    def __init__(self, name: str):
        self.name = name
        self.registry: Optional[AgentRegistry] = None
    
    def set_registry(self, registry: AgentRegistry):
        """Set the agent registry for inter-agent communication"""
        self.registry = registry
    
    @abstractmethod
    def can_handle(self, task: str, context: AgentContext) -> bool:
        """Determine if this agent can handle the task"""
        pass
    
    @abstractmethod
    def execute(self, context: AgentContext) -> Dict[str, Any]:
        """Execute the agent's primary function"""
        pass
    
    @abstractmethod
    def decide_next_agents(self, context: AgentContext) -> List[str]:
        """Decide which agents should be called next"""
        pass
    
    def call_agent(self, agent_name: str, context: AgentContext) -> Dict[str, Any]:
        """Call another agent"""
        if not self.registry:
            raise RuntimeError(f"Agent {self.name} has no registry set")
        
        agent = self.registry.get(agent_name)
        if not agent:
            raise ValueError(f"Agent {agent_name} not found in registry")
        
        result = agent.execute(context)
        context.add_step(agent_name, "execute", result)
        return result
    
    def call_agents_sequence(self, agent_names: List[str], context: AgentContext) -> List[Dict[str, Any]]:
        """Call multiple agents in sequence"""
        results = []
        for agent_name in agent_names:
            result = self.call_agent(agent_name, context)
            results.append(result)
        return results
    
    def get_capabilities(self) -> Dict[str, Any]:
        """Return agent capabilities description"""
        return {
            "name": self.name,
            "description": self.__doc__ or "No description",
            "can_handle": "Override in subclass"
        }


class AgentWorkflowEngine:
    """Engine that manages agent workflow execution"""
    
    def __init__(self, registry: AgentRegistry):
        self.registry = registry
        self.logger = get_logger()
    
    def execute_workflow(self, initial_agent: str, task: str, initial_data: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a workflow starting from an initial agent"""
        # Start execution logging
        execution_id = self.logger.start_execution(task, task)
        
        context = AgentContext(
            task=task,
            data=initial_data or {},
            metadata={
                "workflow_start": initial_agent,
                "execution_id": execution_id,
                "log_file": self.logger.get_current_log_file()
            }
        )
        
        # Start with the initial agent
        current_agent = self.registry.get(initial_agent)
        if not current_agent:
            raise ValueError(f"Initial agent {initial_agent} not found")
        
        # Log agent start
        self.logger.log_agent_start(initial_agent, f"Execute {task}", 1)
        
        # Execute the initial agent
        try:
            result = current_agent.execute(context)
            context.add_step(initial_agent, "execute", result)
            
            # Log agent completion
            self.logger.log_agent_complete(initial_agent, result, success=True)
        except Exception as e:
            self.logger.log_agent_complete(initial_agent, {"error": str(e)}, success=False, error=str(e))
            raise
        
        # Continue with workflow - agents decide next steps
        self._continue_workflow(current_agent, context)
        
        final_result = {
            "success": True,
            "final_result": context.get_last_result(),
            "workflow": context.history,
            "total_steps": len(context.history),
            "execution_id": execution_id,
            "log_file": self.logger.get_current_log_file()
        }
        
        # End execution logging
        self.logger.end_execution(final_result, success=True)
        
        return final_result
    
    def _continue_workflow(self, current_agent: BaseAgent, context: AgentContext):
        """Continue workflow by calling next agents"""
        # Ask current agent what to do next
        next_agents = current_agent.decide_next_agents(context)
        
        if not next_agents:
            # Workflow complete
            return
        
        # Execute next agents in sequence
        for agent_name in next_agents:
            agent = self.registry.get(agent_name)
            if agent:
                # Calculate step number
                step_number = len(context.history) + 1
                
                # Log agent start
                self.logger.log_agent_start(agent_name, f"Execute via {current_agent.name}", step_number)
                
                try:
                    result = agent.execute(context)
                    context.add_step(agent_name, "execute", result)
                    
                    # Log agent completion
                    self.logger.log_agent_complete(agent_name, result, success=True)
                except Exception as e:
                    # Log agent failure
                    self.logger.log_agent_complete(agent_name, {"error": str(e)}, success=False, error=str(e))
                    raise
                
                # Recursively continue workflow
                self._continue_workflow(agent, context)
                break  # Only follow one path for now (can be extended for parallel execution)

