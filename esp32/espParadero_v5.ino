#include <WiFi.h>
#include <WiFiUdp.h>
#include <esp_now.h>
#include <esp_wifi.h>

// === ESTRUCTURAS ===
typedef struct {
  int codigoParadero;
  float lat;
  float lon;
} DatosParadero;

typedef struct {
  int busID;
} NotificacionBus;

// === CONFIGURACIÓN PARADERO ===
const int idParadero = 3;
const float latParadero = -12.002687;
const float lonParadero = -77.103120;
const uint16_t puertoUDP = 5000;

WiFiUDP udp;
uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

const int ledPin = 25;
const int buttonPin = 14;

bool mensajeRecibido = false;
unsigned long tiempoUltimoMensaje = 0;
unsigned long tiempoUltimoEnvio = 0;

// === FUNCIONES AUXILIARES ===

void configurarPines() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect(true);
  pinMode(ledPin, OUTPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  digitalWrite(ledPin, LOW);
}

void configurarWiFi() {
  WiFi.begin();
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }
  Serial.println();
}

void configurarCanalWiFi(int canal) {
  esp_wifi_set_channel(canal, WIFI_SECOND_CHAN_NONE);
  Serial.printf("[WiFi] Canal forzado: %d\n", WiFi.channel());
}

int obtenerCanalDesdeUDP() {
  Serial.printf("[UDP] Iniciando escucha en puerto %d...\n", puertoUDP);
  udp.begin(puertoUDP);

  int canal = -1;
  unsigned long inicio = millis();

  while (millis() - inicio < 10000) {
    int packetSize = udp.parsePacket();
    if (packetSize > 0) {
      String msg;
      while (udp.available()) msg += (char)udp.read();

      int canalIndex = msg.indexOf("\"canal\":");
      if (canalIndex != -1) {
        canal = msg.substring(canalIndex + 8).toInt();
        if (canal > 0 && canal <= 13) {
          Serial.printf("[CANAL] Canal WiFi recibido: %d\n", canal);
          return canal;
        } else {
          Serial.println("[ERROR] Canal fuera de rango");
        }
      } else {
        Serial.println("[ERROR] Campo 'canal' no encontrado en mensaje UDP");
      }
    }
    delay(500);
  }

  Serial.println("[CANAL] No se obtuvo canal. Usando canal 1 por defecto.");
  return 1;
}

void inicializarESPNow() {
  Serial.println("[ESP-NOW] Inicializando...");
  if (esp_now_init() != ESP_OK) {
    Serial.println("[ERROR] Falló la inicialización de ESP-NOW");
    while (true);  // Detiene el sistema
  }

  esp_now_register_recv_cb(recibirCallback);
}

void registrarPeerBroadcast() {
  Serial.println("[ESP-NOW] Registrando peer broadcast...");
  esp_now_peer_info_t peerInfo = {};
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("[ERROR] Falló el registro de peer broadcast");
    while (true);
  }
}

void enviarMensaje() {
  DatosParadero mensaje;
  mensaje.codigoParadero = idParadero;
  mensaje.lat = latParadero;
  mensaje.lon = lonParadero;

  esp_err_t resultado = esp_now_send(broadcastAddress, (uint8_t*)&mensaje, sizeof(mensaje));
  if (resultado == ESP_OK) {
    Serial.printf("[ESP-NOW] ID '%d' enviado correctamente\n", idParadero);

  }
}

void recibirCallback(const esp_now_recv_info *info, const uint8_t *paquete, int len) {
  if (len == sizeof(NotificacionBus)) {
    NotificacionBus notif;
    memcpy(&notif, paquete, len);
    Serial.printf("[ESP-NOW] Bus recibido: %d\n", notif.busID);
    tiempoUltimoMensaje = millis();  // Guarda el momento del último mensaje
  }
}

typedef struct {
  bool enviar;
} MensajeActivacion;

void enviarActivacion(bool estado) {
  MensajeActivacion mensaje;
  mensaje.enviar = estado;

  esp_err_t resultado = esp_now_send(broadcastAddress, (uint8_t*)&mensaje, sizeof(mensaje));
  if (resultado == ESP_OK) {
    Serial.printf("[ESP-NOW] Mensaje de activación enviado: %s\n", estado ? "true" : "false");
  } else {
    Serial.println("[ESP-NOW] Error al enviar mensaje de activación");
  }
}

unsigned long tiempoUltimoEnvioActivacion = 0;

void actualizarLED() {
  bool botonPresionado = digitalRead(buttonPin) == LOW;
  //bool mensajeReciente = (millis() - tiempoUltimoMensaje < 3500);

  if (botonPresionado /*|| mensajeReciente*/) {
    digitalWrite(ledPin, HIGH);
    if (botonPresionado && (millis() - tiempoUltimoEnvioActivacion >= 300)) {
      enviarActivacion(true);
      verificarEnvio();
      tiempoUltimoEnvioActivacion = millis();
    }
  } else {
    digitalWrite(ledPin, LOW);
  }
}

void verificarEnvio() {
  if (millis() - tiempoUltimoEnvio > 3000) {
    enviarMensaje();
    tiempoUltimoEnvio = millis();
  }
}

// === SETUP Y LOOP PRINCIPAL ===

void setup() {
  Serial.begin(115200);
  Serial.println("\n===== INICIO PARADERO =====");

  configurarPines();
  configurarWiFi();
  int canal = obtenerCanalDesdeUDP();
  configurarCanalWiFi(canal);
  inicializarESPNow();
  registrarPeerBroadcast();

  Serial.println("Paradero listo. Enviando ID cada 3 segundos...");
}

void loop() {
  actualizarLED();
  //verificarEnvio();
  delay(50); 
}