from fastapi import FastAPI, Request
from api import auth
from graph.graph import build
from fastapi.middleware.cors import CORSMiddleware
from api import parsing
import logging 

app = FastAPI()
logger = logging.getLogger(__name__)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(parsing.router)

compiled_graph = None  # store compiled graph here

@app.on_event("startup")
async def startup_event():
    global compiled_graph
    compiled_graph = await build()  # ✅ Await here


@app.get("/")
async def send_to_client():
    return {"name": "server", "id": 45983}





@app.post("/chat")
async def chat(request: Request):
    config = {
        "configurable": {
            "thread_id": 5
        }
    }
    body = await request.json()
    logger.info(body)
    input_text = body.get("input")
    token = body.get("token")
    fileContent = body.get("fileContent")
    state = {
        "input": input_text,
        "token": token,
        "fileContent" : fileContent
    }

    result = await compiled_graph.ainvoke(state,config=config)  # ✅ Now it's correct
    return result
