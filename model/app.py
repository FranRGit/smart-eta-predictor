# app.py
from flask import Flask, request, jsonify
from modelo_servicio import predecir_duracion
from flask_cors import CORS
app = Flask(__name__) 
CORS(app) 
@app.route('/predecir', methods=['POST'])
def predecir():
    try:
        data = request.get_json()
        resultado = predecir_duracion(
            int(data['stop_inicio']),
            int(data['stop_fin']),
            data['time'],
            data['date'],
            int(data['weather']),
            int(data['peak'])
        )
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
