"""
Multi-Agent Code Generation System using LangGraph and Cerebras API
This system uses multiple specialized agents to plan, write, and review code.
"""

import os
import sys
from typing import TypedDict, Annotated, Sequence
from langgraph.graph import StateGraph, END
from cerebras.cloud.sdk import Cerebras

# Add parent directory to path to import my_pause
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import my_pause


# ========== Configuration ==========
class CerebrasClient:
    """Wrapper for Cerebras API client"""
    
    def __init__(self, model: str = "llama-3.1-8b"):
        self.client = Cerebras(
            api_key=os.environ.get("CEREBRAS_API_KEY"),
        )
        self.model = model
    
    def chat(self, messages: list, temperature: float = 0.7, max_tokens: int = 2000) -> str:
        """Send chat completion request to Cerebras"""
        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error calling Cerebras API: {str(e)}"


# ========== State Schema ==========
class CodeGenState(TypedDict):
    """State that is passed between agents"""
    user_prompt: str  # Original user request
    plan: str  # High-level plan from planner
    code: str  # Generated code
    review: str  # Code review feedback
    iteration: int  # Current iteration count
    max_iterations: int  # Maximum iterations allowed
    final_code: str  # Final polished code
    messages: list  # Message history for context


# ========== Agent Implementations ==========

class PlannerAgent:
    """Agent that creates a high-level plan for the coding task"""
    
    def __init__(self, cerebras_client: CerebrasClient):
        self.client = cerebras_client
    
    def __call__(self, state: CodeGenState) -> dict:
        print("\n🎯 PLANNER AGENT: Creating implementation plan...")
        
        messages = [
            {
                "role": "system",
                "content": """You are an expert software architect. Your job is to analyze coding requests 
and create a clear, structured implementation plan. Break down the task into logical steps, 
identify key components, and suggest best practices. Keep the plan concise but comprehensive."""
            },
            {
                "role": "user",
                "content": f"""Create an implementation plan for the following coding task:

Task: {state['user_prompt']}

Provide a step-by-step plan that includes:
1. Main components/functions needed
2. Key logic flow
3. Any important considerations
4. Suggested structure"""
            }
        ]
        
        plan = self.client.chat(messages, temperature=0.5)
        print(f"📋 Plan created: {plan[:200]}...")
        
        return {
            "plan": plan,
            "messages": messages + [{"role": "assistant", "content": plan}]
        }


class CoderAgent:
    """Agent that writes the actual code based on the plan"""
    
    def __init__(self, cerebras_client: CerebrasClient):
        self.client = cerebras_client
    
    def __call__(self, state: CodeGenState) -> dict:
        print("\n💻 CODER AGENT: Writing code...")
        
        # Build context from previous review if exists
        context = ""
        if state.get('review') and state['iteration'] > 0:
            context = f"\n\nPrevious review feedback:\n{state['review']}\n\nPrevious code:\n{state['code']}\n\nPlease improve the code based on the feedback."
        
        messages = [
            {
                "role": "system",
                "content": """You are an expert programmer. Write clean, efficient, well-commented code.
Follow best practices, use meaningful variable names, and include docstrings.
Write complete, runnable code - not pseudocode or partial implementations."""
            },
            {
                "role": "user",
                "content": f"""Write code for the following task:

Task: {state['user_prompt']}

Implementation Plan:
{state['plan']}
{context}

Provide complete, working code with comments explaining key parts."""
            }
        ]
        
        code = self.client.chat(messages, temperature=0.3, max_tokens=3000)
        print(f"✍️ Code generated ({len(code)} characters)")
        
        return {
            "code": code,
            "iteration": state.get('iteration', 0) + 1
        }


class ReviewerAgent:
    """Agent that reviews code quality and provides feedback"""
    
    def __init__(self, cerebras_client: CerebrasClient):
        self.client = cerebras_client
    
    def __call__(self, state: CodeGenState) -> dict:
        print("\n🔍 REVIEWER AGENT: Reviewing code quality...")
        
        messages = [
            {
                "role": "system",
                "content": """You are a senior code reviewer. Evaluate code for:
1. Correctness and completeness
2. Code quality and readability
3. Best practices and potential bugs
4. Efficiency and performance

Provide constructive feedback. If the code is good, say "APPROVED" and give brief praise.
If improvements are needed, provide specific, actionable suggestions."""
            },
            {
                "role": "user",
                "content": f"""Review this code for the task: {state['user_prompt']}

Code to review:
{state['code']}

Provide your review:"""
            }
        ]
        
        review = self.client.chat(messages, temperature=0.4)
        print(f"📝 Review complete: {review[:150]}...")
        
        return {"review": review}


class RefinerAgent:
    """Agent that produces the final polished version"""
    
    def __init__(self, cerebras_client: CerebrasClient):
        self.client = cerebras_client
    
    def __call__(self, state: CodeGenState) -> dict:
        print("\n✨ REFINER AGENT: Creating final polished version...")
        
        messages = [
            {
                "role": "system",
                "content": """You are a code quality expert. Polish the code to make it production-ready.
Ensure it's clean, well-documented, follows best practices, and is ready to use."""
            },
            {
                "role": "user",
                "content": f"""Create the final polished version of this code:

Original Task: {state['user_prompt']}

Current Code:
{state['code']}

Review Feedback:
{state['review']}

Provide the final, production-ready code:"""
            }
        ]
        
        final_code = self.client.chat(messages, temperature=0.2, max_tokens=3000)
        print("🎉 Final code ready!")
        
        return {"final_code": final_code}


# ========== Routing Logic ==========

def should_continue(state: CodeGenState) -> str:
    """Decide whether to refine code or finish"""
    
    # Check if we've hit max iterations
    if state['iteration'] >= state['max_iterations']:
        print(f"\n⏱️ Max iterations ({state['max_iterations']}) reached. Moving to refinement...")
        return "refine"
    
    # Check if review approves the code
    review = state.get('review', '').lower()
    if 'approved' in review or 'looks good' in review or 'lgtm' in review:
        print("\n✅ Code approved by reviewer! Moving to refinement...")
        return "refine"
    
    # Need another iteration
    print(f"\n🔄 Improvements needed. Starting iteration {state['iteration'] + 1}...")
    return "continue"


# ========== Build the LangGraph ==========

def create_code_generation_graph(model: str = "llama-4-scout-17b-16e-instruct") -> StateGraph:
    """Create and compile the multi-agent code generation graph"""
    
    # Initialize Cerebras client
    cerebras = CerebrasClient(model=model)
    
    # Initialize agents
    planner = PlannerAgent(cerebras)
    coder = CoderAgent(cerebras)
    reviewer = ReviewerAgent(cerebras)
    refiner = RefinerAgent(cerebras)
    
    # Create the graph
    workflow = StateGraph(CodeGenState)
    
    # Add nodes
    workflow.add_node("planner", planner)
    workflow.add_node("coder", coder)
    workflow.add_node("reviewer", reviewer)
    workflow.add_node("refiner", refiner)
    
    # Define the flow
    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "coder")
    workflow.add_edge("coder", "reviewer")
    
    # Add conditional routing after review
    workflow.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "continue": "coder",  # Go back to coder for improvements
            "refine": "refiner"    # Move to final refinement
        }
    )
    
    workflow.add_edge("refiner", END)
    
    return workflow.compile()


# ========== Main Execution Function ==========

def generate_code(prompt: str, max_iterations: int = 2, model: str = "llama-4-scout-17b-16e-instruct") -> dict:
    """
    Generate code using the multi-agent system
    
    Args:
        prompt: The coding task description
        max_iterations: Maximum number of code improvement iterations
        model: Cerebras model to use
    
    Returns:
        Dictionary containing the final code and execution details
    """
    print("=" * 80)
    print("🚀 MULTI-AGENT CODE GENERATION SYSTEM")
    print("=" * 80)
    print(f"\n📝 Task: {prompt}")
    print(f"🔧 Model: {model}")
    print(f"🔄 Max Iterations: {max_iterations}\n")
    
    # Create the graph
    graph = create_code_generation_graph(model=model)
    
    # Initial state
    initial_state = {
        "user_prompt": prompt,
        "plan": "",
        "code": "",
        "review": "",
        "iteration": 0,
        "max_iterations": max_iterations,
        "final_code": "",
        "messages": []
    }
    
    # Run the workflow
    print("=" * 80)
    result = my_pause.run(graph, context=initial_state, seconds=5)
    print("=" * 80)
    
    return result


# ========== Example Usage ==========

if __name__ == "__main__":
    # Example 1: Simple function
    result = generate_code(
        prompt="Write a Python function to calculate the factorial of a number using recursion. Just write the code, no explanation.",
        max_iterations=2
    )
    
    print("\n" + "=" * 80)
    print("📦 FINAL CODE:")
    print("=" * 80)
    print(result['final_code'])
    
    print("\n" + "=" * 80)
