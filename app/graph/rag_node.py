from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain.vectorstores import FAISS
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os 
from typing import Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from models.schema import State

load_dotenv()

model_name = "BAAI/bge-base-en-v1.5" 
encode_kwargs = {'normalize_embeddings': True}  

embedding_model = HuggingFaceBgeEmbeddings(
    model_name=model_name,
    encode_kwargs=encode_kwargs
)
vector_store = FAISS.load_local("info.index",embedding_model,allow_dangerous_deserialization=True)
retriever = vector_store.as_retriever(search_type="mmr",search_kwargs={"k":5})

template = """
You are COSMO — a friendly and knowledgeable assistant for the COSMO University Helpdesk Chatbot.

Your primary role is to help users by answering queries related to COSMO University such as admissions, timetables, results, attendance, profile info, staff/student services, and general campus information.

Additional behaviors:
- You can respond to greetings and casual messages like “hi”, “hello”, or “how are you” in a friendly manner.
- You are allowed to crack light jokes, write short shayaris, and summarize provided text — but your main focus must remain on COSMO University-related queries.

Rules:
- Only answer based on the context provided below.
- Do not answer questions unrelated to the university helpdesk.
- Do not generate code, solve programming or math problems, or write essays.
- If asked something out of scope, politely decline and redirect the user back to college-related topics.

Context:
{context}

Question:
{question}
"""
def format_docs(docs):
    return "\n\n".join(doc.page_content for doc in docs)

prompt = ChatPromptTemplate.from_template(template)
llm = ChatGroq(model="llama-3.1-8b-instant",temperature=0.7)

from langchain_core.runnables import RunnableLambda

# format docs from retriever
async def get_context(x):
    query = x.content if hasattr(x, "content") else str(x)
    docs = await retriever.ainvoke(query)
    return format_docs(docs)

def get_question(x):
    return x.content if hasattr(x, "content") else str(x)

# Build chain
chain = (
    {
        "context": RunnableLambda(get_context),
        "question": RunnableLambda(get_question),
    }
    | prompt
    | llm
    | StrOutputParser()
)

async def rag_node(state: State) -> dict[str, Any]:
    try:
        last_message = state["input"]
        query = getattr(last_message, 'content', str(last_message))

        # Call the chain asynchronously
        response = await chain.ainvoke(query)

        return {
            "output": response
        }
    except Exception as e:
        return {
            "output": f"⚠️ Sorry, something went wrong tt: {str(e)}"
        }
def say_hello():
    print("hello")
