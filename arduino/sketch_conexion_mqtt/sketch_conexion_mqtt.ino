#include <WiFi.h>
#include <PubSubClient.h>
#include "secrets.h"

// WiFi
const char* ssid = WIFI_SSID;
const char* password = WIFI_PASS;

// MQTT Broker
const char* mqtt_server = "192.168.1.249"; 
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Conectar WiFi
  Serial.println("Conectando a WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n¡WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Configurar MQTT
  client.setServer(mqtt_server, mqtt_port);
  
  // Conectar a MQTT
  conectarMQTT();
}

void conectarMQTT() {
  while (!client.connected()) {
    Serial.println("Conectando a MQTT...");
    
    // Intentar conexión
    if (client.connect("ESP32_Test")) {
      Serial.println("¡Conectado a MQTT!");
    } else {
      Serial.print("Error de conexión, rc=");
      Serial.println(client.state());
      Serial.println("Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

void loop() {
  // Mantener conexión MQTT
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();
  
  // Publicar mensaje cada 5 segundos
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
}