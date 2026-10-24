import logging
from typing import Any, Dict, List, Optional, TypedDict

from langgraph.graph import END, StateGraph

from app.services.chromadb_service import ChromaService

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    task_id: str
    instruction: str
    project_id: Optional[str]
    is_confirmed: bool
    intent: str
    target_project: Optional[Dict[str, Any]]
    all_projects: List[Dict[str, Any]]
    action_result: Optional[Dict[str, Any]]
    proposed_changes: Optional[Dict[str, Any]]
    response_message: str
    requires_approval: bool
    status: str
    error: Optional[str]


# Node 1: Validate Request
def validate_request_node(state: AgentState) -> Dict[str, Any]:
    instruction = (state.get("instruction") or "").strip()
    if not instruction:
        return {
            "status": "failed",
            "error": "Empty instruction provided",
            "response_message": "Please provide a valid instruction or query.",
        }
    return {"status": "validated"}


# Node 2: Classify Intent
def classify_intent_node(state: AgentState) -> Dict[str, Any]:
    instruction = state["instruction"].lower()

    if any(w in instruction for w in ["find", "search", "list", "show", "filter", "look for", "do i have"]):
        intent = "search"
    elif any(w in instruction for w in ["summarize", "summary", "overview", "describe", "explain"]):
        intent = "summary"
    elif any(w in instruction for w in ["analyze", "analysis", "inspect", "manifest", "technologies", "structure"]):
        intent = "analysis"
    elif any(w in instruction for w in ["update", "set status", "change", "mark", "rename", "edit", "status to"]):
        intent = "update_metadata"
    elif any(w in instruction for w in ["run", "launch", "clone and run", "start"]):
        intent = "run_local"
    elif any(w in instruction for w in ["stop", "kill", "terminate"]):
        intent = "stop_local"
    else:
        intent = "general_qa"

    return {"intent": intent}


# Node 3: Retrieve Project Data
def retrieve_context_node(state: AgentState) -> Dict[str, Any]:
    state.get("intent")
    instruction = state.get("instruction", "")
    all_projects = state.get("all_projects", [])
    target_project = state.get("target_project")

    # If project_id is provided, prioritize it
    if state.get("project_id"):
        for p in all_projects:
            if p.get("id") == state["project_id"]:
                target_project = p
                break

    # If target_project not found yet, try fuzzy matching instruction with project names
    if not target_project:
        words = instruction.lower().split()
        for p in all_projects:
            p_name = p.get("name", "").lower()
            if p_name and any(p_name in instruction.lower() or word in p_name for word in words if len(word) > 3):
                target_project = p
                break

    return {
        "target_project": target_project,
        "status": "context_retrieved",
    }


# Node 4: Execute Approved Action
def execute_action_node(state: AgentState) -> Dict[str, Any]:
    intent = state.get("intent")
    instruction = state.get("instruction", "")
    target = state.get("target_project")
    all_projects = state.get("all_projects", [])
    is_confirmed = state.get("is_confirmed", False)

    if intent == "search":
        # Semantic search using ChromaDB if available, fallback to keyword matching
        chroma_ids = ChromaService.search(instruction, n_results=5)
        matching_projects = []
        if chroma_ids:
            matching_projects = [p for p in all_projects if p.get("id") in chroma_ids]

        if not matching_projects:
            import re
            stopwords = {"find", "all", "projects", "project", "using", "with", "show", "me", "list", "the", "a", "an", "is", "for", "in", "and", "or"}
            tokens = [w for w in re.sub(r'[^a-zA-Z0-9]', ' ', instruction.lower()).split() if w not in stopwords]
            if not tokens:
                tokens = [instruction.lower().strip()]

            matching_projects = [
                p for p in all_projects
                if any(
                    token in p.get("name", "").lower()
                    or token in p.get("description", "").lower()
                    or any(token in t.lower() for t in p.get("technologies", []))
                    or token in p.get("status", "").lower()
                    or token in (p.get("primary_language") or "").lower()
                    for token in tokens
                )
            ]

        res = {
            "matches_count": len(matching_projects),
            "projects": [
                {
                    "id": p.get("id"),
                    "name": p.get("name"),
                    "status": p.get("status"),
                    "category": p.get("project_type"),
                    "technologies": p.get("technologies", []),
                    "deployment_url": p.get("deployment_url"),
                    "repository_url": p.get("repository_url"),
                }
                for p in matching_projects[:10]
            ],
        }
        return {"action_result": res, "status": "executed"}

    elif intent == "summary":
        if not target:
            return {
                "action_result": None,
                "error": "Please select or name a project to summarize.",
                "status": "requires_target",
            }
        summary_text = (
            f"Project **{target.get('name')}** is a {target.get('project_type', 'project')} currently in '{target.get('status')}'. "
            f"Built with {', '.join(target.get('technologies', []) or ['various tools'])}. "
            f"{target.get('readme_summary') or target.get('description') or 'No additional details provided.'}"
        )
        return {
            "action_result": {
                "project_id": target.get("id"),
                "name": target.get("name"),
                "summary": summary_text,
            },
            "status": "executed",
        }

    elif intent == "analysis":
        if not target:
            return {
                "action_result": None,
                "error": "Please specify which project's repository analysis you wish to inspect.",
                "status": "requires_target",
            }
        return {
            "action_result": {
                "project_id": target.get("id"),
                "name": target.get("name"),
                "repository_url": target.get("repository_url"),
                "primary_language": target.get("primary_language"),
                "frontend_framework": target.get("frontend_framework"),
                "backend_framework": target.get("backend_framework"),
                "database_technology": target.get("database_technology"),
                "entry_points": target.get("entry_points", {}),
                "dependency_manifests": target.get("dependency_manifests", {}),
                "notebook_urls": target.get("notebook_urls", []),
            },
            "status": "executed",
        }

    elif intent == "update_metadata":
        if not target:
            return {
                "action_result": None,
                "error": "Target project not identified for update.",
                "status": "requires_target",
            }

        # Parse proposed status update safely
        instruction_lower = instruction.lower()
        proposed = {}
        for st in ["completed", "in development", "incomplete", "archived", "planning"]:
            if st in instruction_lower:
                title_st = {
                    "completed": "Completed",
                    "in development": "In Development",
                    "incomplete": "Incomplete",
                    "archived": "Archived",
                    "planning": "Planning",
                }[st]
                proposed["status"] = title_st
                break

        if not proposed:
            return {
                "action_result": None,
                "error": "Could not identify a valid status to update (Planning, In Development, Incomplete, Completed, Archived).",
                "status": "failed",
            }

        if not is_confirmed:
            # Require explicit confirmation before mutating database
            return {
                "proposed_changes": proposed,
                "requires_approval": True,
                "action_result": {"target_project_id": target.get("id"), "proposed": proposed},
                "status": "awaiting_approval",
            }

        return {
            "action_result": {
                "applied": True,
                "target_project_id": target.get("id"),
                "updates": proposed,
            },
            "status": "executed",
        }

    elif intent in ["run_local", "stop_local"]:
        if not target:
            return {
                "action_result": None,
                "error": "Please select a project to run or stop locally.",
                "status": "requires_target",
            }
        return {
            "action_result": {
                "action": intent,
                "target_project_id": target.get("id"),
                "project_name": target.get("name"),
                "repo_url": target.get("repository_url"),
            },
            "status": "executed",
        }

    else:
        # General assistance
        total_p = len(all_projects)
        return {
            "action_result": {
                "general_info": f"I can help you search across your {total_p} projects, summarize repositories, inspect dependency manifests, update project statuses, or launch local dev servers on macOS."
            },
            "status": "executed",
        }


# Node 5: Format Response
def format_response_node(state: AgentState) -> Dict[str, Any]:
    intent = state.get("intent", "general_qa")
    error = state.get("error")
    target = state.get("target_project")
    action_res = state.get("action_result") or {}
    requires_app = state.get("requires_approval", False)
    proposed = state.get("proposed_changes")

    if error:
        return {"response_message": f"Action could not be completed: {error}"}

    if requires_app and proposed:
        changes_desc = ", ".join(f"{k} -> '{v}'" for k, v in proposed.items())
        return {
            "response_message": f"I prepared the following update for **{target.get('name')}**: {changes_desc}. Please confirm to apply this change to PostgreSQL.",
            "requires_approval": True,
        }

    if intent == "search":
        count = action_res.get("matches_count", 0)
        projects = action_res.get("projects", [])
        if count == 0:
            msg = "No projects matching your query were found in your repository catalog."
        else:
            names = ", ".join(p['name'] for p in projects[:5])
            msg = f"Found {count} matching project(s): **{names}**."
        return {"response_message": msg}

    elif intent == "summary":
        summary = action_res.get("summary", "Summary unavailable.")
        return {"response_message": summary}

    elif intent == "analysis":
        name = action_res.get("name", "Project")
        prim = action_res.get("primary_language") or "Not detected"
        fe = action_res.get("frontend_framework") or "None"
        be = action_res.get("backend_framework") or "None"
        db = action_res.get("database_technology") or "None"
        msg = (
            f"**Repository Analysis for {name}**:\n"
            f"- Primary Language: {prim}\n"
            f"- Frontend Framework: {fe}\n"
            f"- Backend Framework: {be}\n"
            f"- Database: {db}\n"
            f"- Entry Points: {action_res.get('entry_points') or 'None detected'}\n"
            f"- Notebooks: {len(action_res.get('notebook_urls', []))} detected"
        )
        return {"response_message": msg}

    elif intent == "update_metadata":
        updates = action_res.get("updates", {})
        target_name = target.get("name") if target else "Project"
        desc = ", ".join(f"{k} to '{v}'" for k, v in updates.items())
        return {"response_message": f"Successfully updated **{target_name}** ({desc})."}

    elif intent == "run_local":
        target_name = target.get("name") if target else "Project"
        return {"response_message": f"Local execution task triggered for **{target_name}**. The agent will clone the repository, set up dependencies, and launch services on localhost."}

    elif intent == "stop_local":
        target_name = target.get("name") if target else "Project"
        return {"response_message": f"Stopped local processes for **{target_name}**."}

    else:
        return {"response_message": action_res.get("general_info", "How can I assist you with your projects today?")}


def route_validation(state: AgentState) -> str:
    if state.get("status") == "failed":
        return "format_response"
    return "classify_intent"


# Build the LangGraph StateGraph
def create_agent_graph():
    builder = StateGraph(AgentState)

    builder.add_node("validate_request", validate_request_node)
    builder.add_node("classify_intent", classify_intent_node)
    builder.add_node("retrieve_context", retrieve_context_node)
    builder.add_node("execute_action", execute_action_node)
    builder.add_node("format_response", format_response_node)

    builder.set_entry_point("validate_request")

    builder.add_conditional_edges(
        "validate_request",
        route_validation,
        {
            "classify_intent": "classify_intent",
            "format_response": "format_response",
        },
    )

    builder.add_edge("classify_intent", "retrieve_context")
    builder.add_edge("retrieve_context", "execute_action")
    builder.add_edge("execute_action", "format_response")
    builder.add_edge("format_response", END)

    return builder.compile()


# Compiled LangGraph Workflow instance
agent_workflow = create_agent_graph()
