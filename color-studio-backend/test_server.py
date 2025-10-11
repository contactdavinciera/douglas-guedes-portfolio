"""
Teste ULTRA simples de servidor Flask
Para verificar se o problema é do código ou do Windows
"""
from flask import Flask

app = Flask(__name__)

@app.route('/test')
def test():
    return {"message": "FUNCIONA!", "status": "ok"}

if __name__ == '__main__':
    print("🔥 Iniciando servidor de teste...")
    print("📍 Acesse: http://localhost:5002/test")
    app.run(host='0.0.0.0', port=5002, debug=False)
