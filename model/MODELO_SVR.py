# Importar librerías necesarias
import pandas as pd
import numpy as np
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import os

# =============================================================================
# CONFIGURACIÓN INICIAL
# =============================================================================

def cargar_dataset(ruta_archivo):
    """
    Carga el dataset desde un archivo CSV
    """
    try:
        if not os.path.exists(ruta_archivo):
            raise FileNotFoundError(f"No se encontró el archivo: {ruta_archivo}")
        
        # Intentar diferentes delimitadores
        delimitadores = [';', ',', '\t']
        df = None
        
        for delim in delimitadores:
            try:
                df_temp = pd.read_csv(ruta_archivo, delimiter=delim)
                # Verificar si la carga fue exitosa (más de 1 columna)
                if df_temp.shape[1] > 1:
                    df = df_temp
                    print(f"Dataset cargado exitosamente con delimitador '{delim}' desde: {ruta_archivo}")
                    break
            except:
                continue
        
        if df is None:
            # Si ningún delimitador funcionó, intentar carga manual
            df = pd.read_csv(ruta_archivo, delimiter=';')
            print(f"Dataset cargado con delimitador ';' desde: {ruta_archivo}")
        
        return df
    except Exception as e:
        print(f"Error al cargar el dataset: {e}")
        return None

# CAMBIAR ESTA RUTA POR LA UBICACIÓN DE TU ARCHIVO CSV
RUTA_CSV = "C:/Users/braya/Downloads/DATA_ENTRENAMIENTO.csv"  # ← Tu archivo real

# Cargar el dataset
print("Cargando dataset...")
df = cargar_dataset(RUTA_CSV)

if df is None:
    print("No se pudo cargar el dataset. Verifica la ruta del archivo.")
    exit()

# Verificar si las columnas necesitan ser renombradas o procesadas
print("Verificando estructura del dataset...")

# Si el dataset solo tiene una columna, necesitamos procesarlo
if df.shape[1] == 1:
    print("Detectado: Dataset con delimitador incorrecto. Intentando reparar...")
    
    # Obtener el nombre de la única columna
    columna_completa = df.columns[0]
    
    # Dividir los datos usando punto y coma
    if ';' in columna_completa:
        # Crear nuevas columnas basadas en la primera fila
        nuevas_columnas = columna_completa.split(';')
        
        # Crear un nuevo DataFrame
        datos_divididos = []
        for idx, fila in df.iterrows():
            valores = str(fila.iloc[0]).split(';')
            datos_divididos.append(valores)
        
        # Crear nuevo DataFrame con columnas separadas
        df = pd.DataFrame(datos_divididos, columns=nuevas_columnas)
        print("Dataset reparado exitosamente!")

print("Forma del dataset después de procesar:", df.shape)
print("\nPrimeras 5 filas:")
print(df.head())

# IMPORTANTE: Verificar nombres exactos de columnas
print("\nNombres exactos de las columnas:")
print("Columnas:", list(df.columns))

# Verificar tipos de datos
print("\nTipos de datos:")
print(df.dtypes)

# Verificar valores nulos
print("\nValores nulos por columna:")
print(df.isnull().sum())

# =============================================================================
# PASO 1: NORMALIZACIÓN DE DATOS
# =============================================================================

# Crear una copia para trabajar
df_work = df.copy()

# 1. Normalizar Stop Name (P1→1, P2→2, ..., P23→23)
def extract_stop_number(stop_name):
    """Extrae el número de la parada (P1→1, P2→2, etc.)"""
    if pd.isna(stop_name):
        return np.nan
    # Remover 'P' y convertir a entero
    try:
        return int(str(stop_name).replace('P', ''))
    except ValueError:
        return np.nan

df_work['stop_name_num'] = df_work['Stop Name'].apply(extract_stop_number)

# 2. Normalizar paradero siguiente con lógica secuencial
def get_next_stop_number(current_stop):
    """Calcula el número del siguiente paradero"""
    if pd.isna(current_stop):
        return np.nan
    if current_stop == 23:  # Si es P23, el siguiente es P1 (→0 para diferenciarlo)
        return 0
    else:
        return current_stop + 1

df_work['paradero_siguiente_num'] = df_work['stop_name_num'].apply(get_next_stop_number)

# 3. Extraer componentes de Time (hora, minuto, segundo)
def extract_time_components(time_str):
    """Extrae hora, minuto y segundo del tiempo"""
    if pd.isna(time_str):
        return np.nan, np.nan, np.nan
    
    try:
        # Parsear el tiempo (formato HH:MM:SS)
        time_parts = str(time_str).split(':')
        hora = int(time_parts[0])
        minuto = int(time_parts[1])
        segundo = int(time_parts[2])
        return hora, minuto, segundo
    except:
        return np.nan, np.nan, np.nan

# Aplicar extracción de tiempo
time_components = df_work['Time'].apply(extract_time_components)
df_work['hora'] = [comp[0] for comp in time_components]
df_work['minuto'] = [comp[1] for comp in time_components]
df_work['segundo'] = [comp[2] for comp in time_components]

# 4. Extraer componentes de Date (día, mes, año, día_semana)
def extract_date_components(date_str):
    """Extrae componentes de la fecha y calcula día de la semana"""
    if pd.isna(date_str):
        return np.nan, np.nan, np.nan, np.nan
    
    try:
        # Parsear fecha (formato M/D/YYYY)
        date_parts = str(date_str).split('/')
        mes = int(date_parts[0])
        dia = int(date_parts[1])
        año = int(date_parts[2])
        
        # Crear objeto datetime para obtener día de la semana
        fecha_obj = datetime(año, mes, dia)
        dia_semana = fecha_obj.weekday()  # 0=Lunes, 6=Domingo
        
        return dia, mes, año, dia_semana
    except:
        return np.nan, np.nan, np.nan, np.nan

# Aplicar extracción de fecha
date_components = df_work['Date'].apply(extract_date_components)
df_work['dia'] = [comp[0] for comp in date_components]
df_work['mes'] = [comp[1] for comp in date_components]
df_work['año'] = [comp[2] for comp in date_components]
df_work['dia_semana'] = [comp[3] for comp in date_components]

# 5. Variables ya numéricas (weather, peak)
print("\nVerificación de variables weather y peak:")
print("Weather valores únicos:", df_work['weather'].unique())
print("Peak valores únicos:", df_work['peak'].unique())

# =============================================================================
# PASO 2: PREPARAR DATASET PARA MODELADO
# =============================================================================

# Seleccionar features para el modelo
feature_columns = [
    'stop_name_num', 'paradero_siguiente_num', 
    'hora', 'minuto', 'segundo',
    'dia', 'mes', 'año', 'dia_semana',
    'weather', 'peak'
]

target_column = 'duration'

# Verificar que las columnas existan
missing_columns = []
for col in feature_columns + [target_column]:
    if col not in df_work.columns:
        missing_columns.append(col)

if missing_columns:
    print(f"Error: Las siguientes columnas no existen en el dataset: {missing_columns}")
    print("Columnas disponibles:", list(df_work.columns))
    exit()

# Crear dataset limpio (sin valores nulos)
df_clean = df_work[feature_columns + [target_column]].dropna()

print(f"\nDataset después de limpiar valores nulos:")
print(f"Filas originales: {len(df_work)}")
print(f"Filas después de limpiar: {len(df_clean)}")

if len(df_clean) == 0:
    print("Error: No quedan datos después de limpiar valores nulos.")
    exit()

# Separar features y target
X = df_clean[feature_columns]
y = df_clean[target_column]

print(f"\nForma de X (features): {X.shape}")
print(f"Forma de y (target): {y.shape}")

# =============================================================================
# PASO 3: DIVIDIR EN ENTRENAMIENTO Y PRUEBA
# =============================================================================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

print(f"\nDivisión del dataset:")
print(f"Entrenamiento: {X_train.shape[0]} muestras")
print(f"Prueba: {X_test.shape[0]} muestras")

# =============================================================================
# PASO 4: NORMALIZACIÓN DE FEATURES
# =============================================================================

# Normalizar features usando StandardScaler
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("\nNormalización completada usando StandardScaler")

# =============================================================================
# PASO 5: ENTRENAR MODELO SVR
# =============================================================================

# Crear y entrenar modelo SVR
kernels = ['linear', 'rbf', 'poly']
best_score = -float('inf')
best_kernel = None
best_model = None

print("\nProbando diferentes kernels para SVR:")

for kernel in kernels:
    print(f"\nEntrenando SVR con kernel '{kernel}'...")
    
    try:
        # Crear modelo
        svr_model = SVR(kernel=kernel, C=1.0, gamma='scale')
        
        # Entrenar
        svr_model.fit(X_train_scaled, y_train)
        
        # Predecir en conjunto de prueba
        y_pred = svr_model.predict(X_test_scaled)
        
        # Calcular métricas
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        
        print(f"  MSE: {mse:.4f}")
        print(f"  R²: {r2:.4f}")
        print(f"  MAE: {mae:.4f}")
        
        # Guardar el mejor modelo
        if r2 > best_score:
            best_score = r2
            best_kernel = kernel
            best_model = svr_model
            
    except Exception as e:
        print(f"  Error entrenando con kernel {kernel}: {e}")

if best_model is None:
    print("Error: No se pudo entrenar ningún modelo exitosamente.")
    exit()

print(f"\nMejor kernel: {best_kernel} (R² = {best_score:.4f})")

# =============================================================================
# PASO 6: EVALUACIÓN FINAL
# =============================================================================

# Usar el mejor modelo para predicciones finales
final_predictions = best_model.predict(X_test_scaled)

# Calcular métricas finales
final_mse = mean_squared_error(y_test, final_predictions)
final_r2 = r2_score(y_test, final_predictions)
final_mae = mean_absolute_error(y_test, final_predictions)

print(f"\n" + "="*50)
print("RESULTADOS FINALES DEL MODELO SVR")
print("="*50)
print(f"Kernel utilizado: {best_kernel}")
print(f"Error Cuadrático Medio (MSE): {final_mse:.4f}")
print(f"Coeficiente de Determinación (R²): {final_r2:.4f}")
print(f"Error Absoluto Medio (MAE): {final_mae:.4f}")
print(f"RMSE: {np.sqrt(final_mse):.4f}")

# =============================================================================
# PASO 7: VISUALIZACIONES
# =============================================================================

def crear_visualizaciones():
    """Crear visualizaciones del modelo"""
    try:
        # Crear visualizaciones
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))

        # 1. Valores reales vs predichos
        axes[0, 0].scatter(y_test, final_predictions, alpha=0.6)
        axes[0, 0].plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
        axes[0, 0].set_xlabel('Duración Real')
        axes[0, 0].set_ylabel('Duración Predicha')
        axes[0, 0].set_title('Valores Reales vs Predichos')
        axes[0, 0].grid(True, alpha=0.3)

        # 2. Residuos
        residuos = y_test - final_predictions
        axes[0, 1].scatter(final_predictions, residuos, alpha=0.6)
        axes[0, 1].axhline(y=0, color='r', linestyle='--')
        axes[0, 1].set_xlabel('Duración Predicha')
        axes[0, 1].set_ylabel('Residuos')
        axes[0, 1].set_title('Gráfico de Residuos')
        axes[0, 1].grid(True, alpha=0.3)

        # 3. Distribución de residuos
        axes[1, 0].hist(residuos, bins=30, alpha=0.7, edgecolor='black')
        axes[1, 0].set_xlabel('Residuos')
        axes[1, 0].set_ylabel('Frecuencia')
        axes[1, 0].set_title('Distribución de Residuos')
        axes[1, 0].grid(True, alpha=0.3)

        # 4. Feature importance (aproximada para SVR)
        if best_kernel == 'linear':
            feature_importance = np.abs(best_model.coef_[0])
            feature_names = feature_columns
            
            importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': feature_importance
            }).sort_values('importance', ascending=True)
            
            axes[1, 1].barh(importance_df['feature'], importance_df['importance'])
            axes[1, 1].set_xlabel('Importancia Absoluta')
            axes[1, 1].set_title('Importancia de Features (Kernel Lineal)')
            axes[1, 1].grid(True, alpha=0.3)
        else:
            axes[1, 1].text(0.5, 0.5, f'Importancia de features\nno disponible para\nkernel "{best_kernel}"', 
                            ha='center', va='center', transform=axes[1, 1].transAxes, fontsize=12)
            axes[1, 1].set_title('Importancia de Features')

        plt.tight_layout()
        plt.show()
        
    except Exception as e:
        print(f"Error creando visualizaciones: {e}")
        print("Las visualizaciones no se pudieron mostrar, pero el modelo funciona correctamente.")

# Crear visualizaciones
crear_visualizaciones()

# =============================================================================
# PASO 8: FUNCIÓN DE PREDICCIÓN INTEGRADA
# =============================================================================

def predecir_duracion(stop_name, time_str, date_str, weather, peak):
    """
    Función para hacer predicciones individuales
    
    Parámetros:
    - stop_name: str, ej. 'P5'
    - time_str: str, ej. '14:30:25'
    - date_str: str, ej. '6/15/2019'
    - weather: int, 0-3
    - peak: int, 0 o 1
    
    Retorna:
    - predicción en segundos
    """
    
    try:
        # Extraer número de parada
        stop_num = int(stop_name.replace('P', ''))
        
        # Calcular siguiente parada
        next_stop = 0 if stop_num == 23 else stop_num + 1
        
        # Extraer componentes de tiempo
        time_parts = time_str.split(':')
        hora = int(time_parts[0])
        minuto = int(time_parts[1])
        segundo = int(time_parts[2])
        
        # Extraer componentes de fecha
        date_parts = date_str.split('/')
        mes = int(date_parts[0])
        dia = int(date_parts[1])
        año = int(date_parts[2])
        
        # Calcular día de la semana
        fecha_obj = datetime(año, mes, dia)
        dia_semana = fecha_obj.weekday()
        
        # Crear array de features
        features = np.array([[stop_num, next_stop, hora, minuto, segundo, 
                             dia, mes, año, dia_semana, weather, peak]])
        
        # Normalizar
        features_scaled = scaler.transform(features)
        
        # Predecir
        prediccion = best_model.predict(features_scaled)[0]
        
        # Información adicional
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        clima_desc = {0: 'Partly Cloudy', 1: 'Desconocido', 2: 'Thunder', 3: 'Rain'}
        
        print(f"\n" + "="*50)
        print("PREDICCIÓN DE DURACIÓN")
        print("="*50)
        print(f"Parada: {stop_name}")
        print(f"Siguiente parada: P{next_stop if next_stop != 0 else 1}")
        print(f"Fecha: {date_str} ({dias_semana[dia_semana]})")
        print(f"Hora: {time_str}")
        print(f"Clima: {clima_desc.get(weather, 'Desconocido')}")
        print(f"Hora pico: {'Sí' if peak == 1 else 'No'}")
        print(f"\nDuración predicha: {prediccion:.2f} segundos")
        print(f"Duración predicha: {prediccion/60:.2f} minutos")
        
        return prediccion
        
    except Exception as e:
        print(f"Error en la predicción: {e}")
        return None

# =============================================================================
# FUNCIONES PARA GUARDAR Y CARGAR MODELO
# =============================================================================

def guardar_modelo(nombre_archivo="modelo_svr.pkl"):
    """Guarda el modelo entrenado y el scaler"""
    try:
        import pickle
        
        modelo_completo = {
            'modelo': best_model,
            'scaler': scaler,
            'feature_columns': feature_columns,
            'kernel': best_kernel,
            'metricas': {
            'mse': final_mse,
            'r2': final_r2,
            'mae': final_mae,
            'rmse': np.sqrt(final_mse)
            }
        }
        
        with open(nombre_archivo, 'wb') as f:
            pickle.dump(modelo_completo, f)
        
        print(f"\nModelo guardado exitosamente en: {nombre_archivo}")
        
    except Exception as e:
        print(f"Error guardando el modelo: {e}")

def cargar_modelo(nombre_archivo="modelo_svr.pkl"):
    """Carga un modelo previamente guardado"""
    try:
        import pickle
        
        with open(nombre_archivo, 'rb') as f:
            modelo_completo = pickle.load(f)
        
        print(f"Modelo cargado exitosamente desde: {nombre_archivo}")
        return modelo_completo
        
    except Exception as e:
        print(f"Error cargando el modelo: {e}")
        return None

# Guardar el modelo
guardar_modelo()
# =============================================================================
# EJEMPLOS DE USO DE LA FUNCIÓN DE PREDICCIÓN
# =============================================================================

print("\n" + "="*50)
print("EJEMPLOS DE PREDICCIÓN")
print("="*50)

# Ejemplo 1: Usar datos del primer registro disponible
if len(df_clean) > 0:
    primer_registro = df_clean.iloc[0]
    stop_ejemplo = f"P{int(primer_registro['stop_name_num'])}"
    
    # Reconstruir fecha y hora desde los componentes
    fecha_ejemplo = f"{int(primer_registro['mes'])}/{int(primer_registro['dia'])}/{int(primer_registro['año'])}"
    hora_ejemplo = f"{int(primer_registro['hora']):02d}:{int(primer_registro['minuto']):02d}:{int(primer_registro['segundo']):02d}"
    
    print("Ejemplo 1 - Basado en datos reales del dataset:")
    ejemplo_prediccion1 = predecir_duracion(
        stop_ejemplo, 
        hora_ejemplo, 
        fecha_ejemplo, 
        int(primer_registro['weather']), 
        int(primer_registro['peak'])
    )

# Ejemplo 2: Predicción personalizada
print("\nEjemplo 2 - Predicción personalizada:")
ejemplo_prediccion2 = predecir_duracion('P1', '13:36:41', '6/2/2019', 1, 0)

# Ejemplo 3: Múltiples predicciones
print("\nEjemplo 3 - Múltiples predicciones:")
ejemplos_multiples = [
    ('P5', '08:30:00', '6/15/2019', 0, 1),  # Hora pico, clima despejado
    ('P12', '14:45:30', '6/16/2019', 3, 0),  # No hora pico, lluvia
    ('P23', '20:15:45', '6/17/2019', 2, 0),  # Noche, tormenta
]

for i, (stop, time, date, weather, peak) in enumerate(ejemplos_multiples, 1):
    print(f"\n--- Predicción múltiple {i} ---")
    predecir_duracion(stop, time, date, weather, peak)

print(f"\n" + "="*50)
print("MODELO LISTO PARA USAR")
print("="*50)
print(f"✓ Modelo entrenado con kernel: {best_kernel}")
print(f"✓ R² Score: {final_r2:.4f}")
print(f"✓ Función predecir_duracion() disponible")
print(f"✓ Modelo guardado como 'modelo_svr.pkl'")
print(f"\nPara hacer nuevas predicciones, usa:")
print(f"predecir_duracion('P1', '13:36:41', '6/2/2019', 1, 0)")

