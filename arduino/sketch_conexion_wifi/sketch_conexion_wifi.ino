#include <WiFi.h>
#include "secrets.h"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASS; 

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\nConectando a WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);
  
  // Conectar a WiFi
  WiFi.begin(ssid, password);
  
  // Esperar conexión
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // ¡Conectado!
  Serial.println("\n¡Conectado a WiFi!");
  Serial.print("IP asignada: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Verificar conexión cada 10 segundos
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi OK - IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("WiFi desconectado");
  }
  delay(10000);
}