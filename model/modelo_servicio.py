# modelo_servicio.py
import joblib
import numpy as np
from datetime import datetime
import pandas as pd

# Cargar modelo y scaler una sola vez
modelo_completo = joblib.load("modelo_svr.pkl")

def predecir_duracion(stop_inicio, stop_fin, time_str, date_str, weather, peak):
    try:
        hora, minuto = map(int, time_str.split(':'))
        segundo = 0  # si time viene como HH:MM, poner 0

        año, mes, dia = map(int, date_str.split('-'))
        dia_semana = datetime(año, mes, dia).weekday()

        entrada = pd.DataFrame([{
            'stop_name_num': stop_inicio,
            'paradero_siguiente_num': stop_fin,
            'hora': hora,
            'minuto': minuto,
            'segundo': segundo,
            'dia': dia,
            'mes': mes,
            'año': año,
            'dia_semana': dia_semana,
            'weather': weather,
            'peak': peak
        }])

        entrada_scaled = modelo_completo["scaler"].transform(entrada)
        prediccion = modelo_completo["modelo"].predict(entrada_scaled)

        return round(float(prediccion[0]), 2)
    
    except Exception as e:
        print("❌ Error en la predicción:", str(e))
        raise ValueError(f"Error en la predicción: {e}")
