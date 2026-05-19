import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import InstalacionScreen from "./src/screens/InstalacionScreen";

const Stack = createNativeStackNavigator();

function NavegacionRaiz() {
  const { usuario, cargando } = useAuth();

  if(cargando) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a'}}>
        <ActivityIndicator size = "large" color="#e8550a"/>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {usuario ? (
        //Pantallas autenticadas
        <>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Instalacion" component={InstalacionScreen} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App(){
  return (
    <AuthProvider>
      <NavigationContainer>
        <NavegacionRaiz />
      </NavigationContainer>
    </AuthProvider>
  );
}