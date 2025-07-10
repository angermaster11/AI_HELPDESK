from langgraph.graph import StateGraph,END
from models.schema import State
from graph.auth_node import auth_node
from graph.rag_node import rag_node
from graph.student_node import student_node
from graph.staff_node import staff_node
from langgraph.checkpoint.memory import MemorySaver

#Contants
AUTH = "auth"
RAG = "rag"
STUDENT = "student"
STAFF = "staff"

memory = MemorySaver()


async def build():
    graph = StateGraph(State)
    graph.add_node(AUTH,auth_node)
    graph.add_node(RAG,rag_node)
    graph.add_node(STUDENT,student_node)
    graph.add_node(STAFF,staff_node)
    graph.set_entry_point(AUTH)
    
    def route_auth(state):
        if not state.get("auth"):
            return "rag"
        return "student" if state["role"] == "student" else "staff"

    graph.add_conditional_edges("auth", route_auth, {
        "rag": "rag",
        "student": "student",
        "staff": "staff"
    })

    graph.add_edge("rag", END)
    graph.add_edge("student", END)
    graph.add_edge("staff", END)

    return graph.compile(checkpointer=memory)
