#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "DIGIFIBRA-F09B";
const char* password = "R8#kNQA4hM";
//const char* mqtt_server = "192.168.1.249"; //Local
const chat* mqtt_server = "mqtt.granasat.space";

// Info del dispositivo
String device_mac;
String device_ip;
/*
  String device_mac = "XX:XX:XX:XX:XX:XX";
  String device_ip = "150.214.X.X";
*/
const char* hw_version = "v2.1.3";
const char* fw_version = "v1.5.2";

// Sensores/Estado
bool suministro_electrico = true;
float nivel_radiacion = 0.0;
bool elemento_irradiacion = true;

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  device_mac = WiFi.macAddress();
  device_ip = WiFi.localIP().toString();
  
  Serial.println("\n WiFi conectado");
  Serial.println("MAC: " + device_mac);
  Serial.println("IP: " + device_ip);
  
  // MQTT
  client.setServer(mqtt_server, 1883);
  conectarMQTT();
}

void conectarMQTT() {
  while (!client.connected()) {
    Serial.print("Conectando MQTT...");
    String clientId = "IoT_" + device_mac;
    if (client.connect(clientId.c_str())) {
      Serial.println("Conectado");
    } else {
      Serial.print("Error ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    conectarMQTT();
  }
  client.loop();
  
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 10000) {
    lastMsg = millis();
    
    // Simular lecturas
    nivel_radiacion = random(0, 10000) / 100.0; // 0.00 - 100.00
    suministro_electrico = random(0, 100) > 5; // 95% activo
    elemento_irradiacion = random(0, 100) > 10; // 90% activo
    
    // Formato: measurement,tags fields
    String msg = "radiacion_iot,";
    msg += "mac=" + device_mac + ",";
    msg += "ip=" + device_ip + ",";
    msg += "hw_version=" + String(hw_version) + ",";
    msg += "fw_version=" + String(fw_version) + " ";
    msg += "radiacion=" + String(nivel_radiacion, 2) + ",";
    msg += "suministro=" + String(suministro_electrico) + ",";
    msg += "elemento_activo=" + String(elemento_irradiacion);
    
    Serial.println(": " + msg);
    
    String topic = "iot/radiacion/" + device_mac;
    client.publish(topic.c_str(), msg.c_str());
  }
}