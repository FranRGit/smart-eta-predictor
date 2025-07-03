#include <WiFi.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <WiFiUdp.h> 
#include <ArduinoJson.h>
#include <esp_now.h>

// ===== CONFIGURACIONES WIFI, MQTT y UDP =====
const char* ssid = "Emergencia";
const char* password = "hola12345";
const char* tokenSecreto = "X9aLz7QkVm2";
const int puertoTCP = 5000;
const int puertoUDP = 4567;

const char* mqtt_server = "70f80b09998340c098a79b47d69a9b29.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "bus123";
const char* mqtt_password = "Busesp123";

// ===== VARIABLES GLOBALES =====
double latParadero = 0.0;
double lonParadero = 0.0;
bool FueraDeRango = false;
int nombreBus;
int codigoParadero = 0;
bool botonActivado = false;

// ===== OBJETOS DE RED =====
WiFiClient client;
WiFiUDP udp;
WiFiServer server(puertoTCP);
WiFiClientSecure espClient;
PubSubClient mqttclient(espClient);
const int ledPin1 = 25;
const int ledPin2 = 32;
// ===== CERTIFICADO MQTT =====
static const char* root_ca PROGMEM = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";


void setup_wifi() {
  delay(10);
  WiFi.mode(WIFI_STA);
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  Serial.print("Conectando a Wi-Fi ");
  for (int i = 0; i < 20 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado ip: ");
    Serial.println(WiFi.localIP());
    Serial.print("Canal Wi-Fi actual: ");
    Serial.println(WiFi.channel());
    IPAddress testIP;
    if (WiFi.hostByName("google.com", testIP)) {
      Serial.println("Internet disponible");
    } else {
      Serial.println("Sin acceso a Internet");
    }
  } else {
    Serial.println("\nError: No se pudo conectar al Wi-Fi");
  }
}

// ========== MQTT ==========
unsigned long ultimoIntentoMQTT = 0;
void reconnect() {
  if (millis() - ultimoIntentoMQTT > 2000) { 
    ultimoIntentoMQTT = millis();
    Serial.print("Conectando MQTT...");
    if (mqttclient.connect("ESP32Client", mqtt_username, mqtt_password)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttclient.state());
      Serial.println(" try again in 5 seconds");
      delay(2000);
    }
  }
}

// ========== UDP ==========
unsigned long tiempoUltimoAnuncio = 0;
void enviarAnuncioUDP() {
  StaticJsonDocument<256> doc;
  doc["nombre"] = nombreBus;
  doc["ip"] = WiFi.localIP().toString();
  doc["puerto"] = puertoTCP;
  doc["canal"] = WiFi.channel();

  String mensaje;
  serializeJson(doc, mensaje);

  udp.beginPacket("255.255.255.255", puertoUDP);
  udp.write((const uint8_t*)mensaje.c_str(), mensaje.length());
  udp.endPacket();

  Serial.println("UDP enviado: " + mensaje);
}

// ========== TCP ==========
void cliente_tcp(){
      // Cliente TCP
      if (!client || !client.connected()) {
      client = server.available();
      if (client) Serial.println("Cliente conectado");
      return;
    }
    // Leer datos TCP
    if (client.available()) {
      String datos = client.readStringUntil('\n');
      datos.trim();
      if (!datos.isEmpty()) procesarDatos(datos); 
    }
    // Desconectar si perdió conexión
    if (!client.connected()) {
      client.stop();
      Serial.println("Cliente desconectado");
  }
}

void procesarDatos(const String& datos) {
  
  StaticJsonDocument<256> docIn;
  if (deserializeJson(docIn, datos)) {
    Serial.println("JSON inválido");
    return;
  }

  if (docIn["token"] != tokenSecreto) {
    Serial.println("Token inválido");
    return;
  }

  // Extraer valores
  double lat = docIn["lat"];
  double lon = docIn["lon"];
  int day = docIn["day"];
  int month = docIn["month"];
  int year = docIn["year"];
  int hour = docIn["hour"];
  int minute = docIn["minute"];
  int second = docIn["second"];
  String token = docIn["token"].as<String>();

  // ---- Construir JSON para bus/ubicacion ----
  StaticJsonDocument<256> docUbicacion;
  docUbicacion["nombre"] = nombreBus;
  docUbicacion["lat"] = lat;
  docUbicacion["lon"] = lon;
  docUbicacion["day"] = day;
  docUbicacion["month"] = month;
  docUbicacion["year"] = year;
  docUbicacion["hour"] = hour;
  docUbicacion["minute"] = minute;
  docUbicacion["second"] = second;

  String datosUbicacion;
  serializeJson(docUbicacion, datosUbicacion);
  mqttclient.publish("bus/ubicacion", datosUbicacion.c_str());

  // ---- Construir JSON para bus/paradero ----
  StaticJsonDocument<128> docParadero;
  docParadero["nombre"] = nombreBus;
  docParadero["paradero"] = codigoParadero;
  docParadero["day"] = day;
  docParadero["month"] = month;
  docParadero["year"] = year;
  docParadero["hour"] = hour;
  docParadero["minute"] = minute;
  docParadero["second"] = second;
  String datoParadero;
  serializeJson(docParadero, datoParadero);
  // ---- Calcular distancia y enviar si está cerca ----
  double d = calcularDistancia(lat, lon, latParadero, lonParadero);
  Serial.printf("Distancia al paradero: %.2f metros\n", d);
  Serial.printf("botonActivado = %s\n", botonActivado ? "true" : "false");
  if (botonActivado) {
    mqttclient.publish("bus/paradero", datoParadero.c_str());
    digitalWrite(ledPin1, HIGH);
    delay(500);
    digitalWrite(ledPin1, LOW);
    botonActivado = false;
    Serial.println("[MQTT] Publicación forzada por botón del paradero");
  }
  /*
  else if (d < 25 && !FueraDeRango) {
    mqttclient.publish("bus/paradero", datoParadero.c_str());
    FueraDeRango = true;
    digitalWrite(ledPin1, HIGH);
    delay(500);
    digitalWrite(ledPin1, LOW);
    Serial.println("[MQTT] Publicación automática por cercanía");
  } 
  else if (d >= 25) {
    FueraDeRango = false;
  }*/

  // ---- Mostrar por consola ----
  Serial.println("JSON mostrado en consola:");
  Serial.printf("{\"token\":\"%s\", \"nombre\":%d, \"paradero\":%d, ", token.c_str(), nombreBus, codigoParadero);
  Serial.printf("\"day\":%02d, \"month\":%02d, \"year\":%04d, ", day, month, year);
  Serial.printf("\"hour\":%02d, \"minute\":%02d, \"second\":%02d, ", hour, minute, second);
  Serial.printf("\"latBus\":%.6f, \"lonBus\":%.6f}\n", lat, lon);
}

double calcularDistancia(double lat1, double lon1, double lat2, double lon2) {
  const double R = 6371000;  // Radio de la Tierra en metros
  double rad = PI / 180;
  double dLat = (lat2 - lat1) * rad;
  double dLon = (lon2 - lon1) * rad;

  lat1 = lat1 * rad;
  lat2 = lat2 * rad;

  double a = sin(dLat / 2) * sin(dLat / 2) +
             sin(dLon / 2) * sin(dLon / 2) * cos(lat1) * cos(lat2);
  double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return R * c;
}

// ===== VARIABLES Y ESTRUCTURAS ESP-NOW =====
void setup_esp_now() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error al iniciar ESP-NOW");
    return;
  }
  esp_now_register_recv_cb(recibirDatosDesdeParadero);
}

// Estructura para enviar el ID del bus al paradero
typedef struct {
  int busID;
} NotificacionBus;

// ==== Estructura del mensaje enviado por el paradero al bus ====
typedef struct {
  int codigoParadero;
  float latitud;
  float longitud;
} DatosParadero;

typedef struct {
  bool enviar;
} MensajeActivacion;

// ==== Cuando se recibe un mensaje desde un paradero por ESP-NOW ====
uint8_t ultimaMacParadero[6]; 
void recibirDatosDesdeParadero(const esp_now_recv_info *info, const uint8_t *paquete, int longitud) {
  Serial.printf("Longitud recibida: %d, Esperada (Paradero): %d, Esperada (Activación): %d\n",
              longitud, sizeof(DatosParadero), sizeof(MensajeActivacion));

  if (longitud == sizeof(DatosParadero)) {
    DatosParadero mensaje;
    memcpy(&mensaje, paquete, longitud);
    // Guardar los datos del paradero
    codigoParadero = mensaje.codigoParadero;
    latParadero = mensaje.latitud;
    lonParadero = mensaje.longitud;
    // Guardar MAC del paradero
    memcpy(ultimaMacParadero, info->src_addr, 6);
    digitalWrite(ledPin2, HIGH);
    delay(500);
    digitalWrite(ledPin2, LOW);
    Serial.printf("PARADERO DETECTADO: %d\n", codigoParadero);
    Serial.printf("Ubicación del paradero: %.6f, %.6f\n", latParadero, lonParadero);

    // Registrar peer si aún no lo es
    if (!esp_now_is_peer_exist(ultimaMacParadero)) {
      esp_now_peer_info_t peerInfo = {};
      memcpy(peerInfo.peer_addr, ultimaMacParadero, 6);
      peerInfo.channel = 0;  // Canal automático
      peerInfo.encrypt = false;

      if (esp_now_add_peer(&peerInfo) == ESP_OK) {
        Serial.println("Paradero registrado correctamente como peer.");
      } else {
        Serial.println("Error al registrar el paradero como peer.");
      }
    }

    // Mostrar MAC del paradero
    char macTexto[18];
    snprintf(macTexto, sizeof(macTexto),
             "%02X:%02X:%02X:%02X:%02X:%02X",
             info->src_addr[0], info->src_addr[1], info->src_addr[2],
             info->src_addr[3], info->src_addr[4], info->src_addr[5]);

    Serial.print("MAC del paradero: ");
    Serial.println(macTexto);
    enviarNombreBusAlParadero();

  } else if (longitud == sizeof(MensajeActivacion)) {
    MensajeActivacion msg;
    memcpy(&msg, paquete, longitud);
    Serial.printf("Valor crudo recibido: %d\n", msg.enviar);
    if (msg.enviar != 0) {
      botonActivado = true;
      Serial.println("[ESP-NOW] Activación recibida desde paradero.");
    }
  } else {
    Serial.println("[ESP-NOW] Mensaje recibido con tamaño desconocido. Ignorado.");
  }
}


// ==== Enviar el nombre del bus al paradero por ESP-NOW ====
void enviarNombreBusAlParadero() {
  NotificacionBus mensaje;
  mensaje.busID = nombreBus;

  esp_err_t estado = esp_now_send(ultimaMacParadero, (uint8_t*)&mensaje, sizeof(mensaje));
  if (estado == ESP_OK) {
    Serial.printf("ID del bus (%d) enviado correctamente al paradero.\n", mensaje.busID);
  } else {
    Serial.println("Error al enviar el ID del bus al paradero.");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ledPin1, OUTPUT);
  pinMode(ledPin2, OUTPUT);
  nombreBus = 1;
  // Conexión Wi-Fi
  setup_wifi();
  Serial.println("Nombre: " + nombreBus);
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Canal actual del WiFi: " + String(WiFi.channel()));
  
  // Inicializar UDP
  udp.begin(puertoUDP);
  // Inicializar servidor TCP
  server.begin();

  //Inicializar ESP-NOW
  setup_esp_now();
  // Configurar MQTT seguro
  espClient.setCACert(root_ca);
  mqttclient.setServer(mqtt_server, mqtt_port);

}

void loop() {
  if (!mqttclient.connected()) {
    reconnect();
  }

  mqttclient.loop();
  cliente_tcp();

  if (millis() - tiempoUltimoAnuncio > 3000) {
    enviarAnuncioUDP();
    tiempoUltimoAnuncio = millis();
  }
}