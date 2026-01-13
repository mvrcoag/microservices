from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def get_orders():
    return {"orders": [1, 2, 3]}
