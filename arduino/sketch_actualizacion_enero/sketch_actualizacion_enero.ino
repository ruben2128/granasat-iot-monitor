#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "DIGIFIBRA-F09B";
const char* password = "R8#kNQA4hM";
//const char* mqtt_server = "192.168.1.249"; //Local
const char* mqtt_server = "mqtt.granasat.space";

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
float nivel_bateria = 100.0; 

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
  if (millis() - lastMsg > 60000) {
    lastMsg = millis();
    
    // Simular lecturas
    float base = 0.10 + (random(0, 40) / 100.0); // 0.10 - 0.50
    bool pico = random(0, 100) < 2; // 2% de probabilidad de pico
    nivel_radiacion = pico ? base + random(50, 150) / 10.0 : base; // pico: +5.0 a +15.0

    // Suministro: 98% activo
    suministro_electrico = random(0, 100) > 2;

    // Elemento activo: 95% activo
    elemento_irradiacion = random(0, 100) > 5;

    // Bateria: baja 1% cada envio, se recarga al llegar a 0
    nivel_bateria -= 1.0;

    if (nivel_bateria < 0.0) {
      nivel_bateria = 100.0;
    }
    
    // Formato: measurement,tags fields
    String msg = "radiacion_iot,";
    msg += "mac=" + device_mac + ",";
    msg += "ip=" + device_ip + ",";
    msg += "hw_version=" + String(hw_version) + ",";
    msg += "fw_version=" + String(fw_version) + " ";
    msg += "radiacion=" + String(nivel_radiacion, 2) + ",";
    msg += "suministro=" + String(suministro_electrico) + ",";
    msg += "elemento_activo=" + String(elemento_irradiacion);
    msg += ",bateria=" + String(nivel_bateria, 1);
    
    Serial.println(": " + msg);
    
    String topic = "iot/radiacion/" + device_mac;
    client.publish(topic.c_str(), msg.c_str());
  }
}