from langgraph.graph import add_messages
from typing import TypedDict,Annotated,Optional,Any
from operator import concat

class State(TypedDict):
    input: str
    token: Optional[str]
    auth: Optional[bool]
    user_id: Optional[int]
    role: Optional[str]
    output: Optional[str]
    session : Optional[str]
    messages : Annotated[list,add_messages]
    fileContent : Optional[str]