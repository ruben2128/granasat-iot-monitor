#!/bin/bash

# =====================================================
# TEST SUITE COMPLETO - Backend GranaSAT IoT
# =====================================================
# Uso: bash test-completo.sh
# Requiere: servidor corriendo en localhost:3001
# =====================================================

API="http://localhost:3001"
INST_A="d9c72d36-151f-4e96-bd98-f7d3042cc6f3"
INST_B="9f1755fc-431d-4b89-8227-8af3f17bce9e"
DISPOSITIVO_ID="55add4e0-10f0-4a4a-8b9b-80793800e1bf"
PASS=0
FAIL=0

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ok()     { echo -e "  ${GREEN}✓ PASS${NC} — $1"; ((PASS++)); }
fail()   { echo -e "  ${RED}✗ FAIL${NC} — $1"; echo -e "    Respuesta: $2"; ((FAIL++)); }
title()  { echo -e "\n${YELLOW}▶ $1${NC}"; }
section(){ echo -e "\n${BLUE}════════════════════════════════════════${NC}"; echo -e "${BLUE}  $1${NC}"; echo -e "${BLUE}════════════════════════════════════════${NC}"; }

# =====================================================
# LOGIN
# =====================================================
section "AUTENTICACIÓN"

title "1. Login como ADMIN"
LOGIN_ADMIN=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
TOKEN_ADMIN=$(echo "$LOGIN_ADMIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -n "$TOKEN_ADMIN" ]; then
  ok "Login admin exitoso"
else
  fail "Login admin fallido" "$LOGIN_ADMIN"
  exit 1
fi

title "2. Login como RESPONSABLE"
LOGIN_RESP=$(curl -s -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"responsable1","password":"resp123"}')
TOKEN_RESP=$(echo "$LOGIN_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
if [ -n "$TOKEN_RESP" ]; then
  ok "Login responsable exitoso"
else
  fail "Login responsable fallido" "$LOGIN_RESP"
fi

title "3. Login con credenciales incorrectas → 401"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrongpassword"}')
[ "$RES" == "401" ] && ok "401 con credenciales incorrectas" || fail "Se esperaba 401, llegó $RES" ""

title "4. GET /api/auth/me con token válido"
RES=$(curl -s -X GET "$API/api/auth/me" -H "Authorization: Bearer $TOKEN_ADMIN")
echo $RES | grep -q '"username":"admin"' && ok "Perfil del admin obtenido correctamente" || fail "No se obtuvo el perfil" "$RES"

title "5. GET /api/auth/me sin token → 401"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/auth/me")
[ "$RES" == "401" ] && ok "401 sin token" || fail "Se esperaba 401, llegó $RES" ""

# =====================================================
# INSTALACIONES
# =====================================================
section "INSTALACIONES"

title "6. GET /api/instalaciones como ADMIN → ve todas"
RES=$(curl -s -X GET "$API/api/instalaciones" -H "Authorization: Bearer $TOKEN_ADMIN")
TOTAL=$(echo $RES | grep -o '"total":[0-9]*' | cut -d':' -f2)
[ "$TOTAL" -ge "2" ] && ok "ADMIN ve todas las instalaciones (total: $TOTAL)" || fail "Se esperaban al menos 2" "$RES"

title "7. GET /api/instalaciones como RESPONSABLE → solo las suyas"
RES=$(curl -s -X GET "$API/api/instalaciones" -H "Authorization: Bearer $TOKEN_RESP")
echo $RES | grep -q '"instalaciones"' && ok "RESPONSABLE obtiene sus instalaciones" || fail "Error obteniendo instalaciones" "$RES"

title "8. GET /api/instalaciones sin token → 401"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/instalaciones")
[ "$RES" == "401" ] && ok "401 sin token" || fail "Se esperaba 401, llegó $RES" ""

title "9. GET /api/instalaciones/:id — obtener Instalación A"
RES=$(curl -s -X GET "$API/api/instalaciones/$INST_A" -H "Authorization: Bearer $TOKEN_ADMIN")
echo $RES | grep -q "INST_A" && ok "Instalación A obtenida correctamente" || fail "No se obtuvo la instalación" "$RES"

title "10. GET /api/instalaciones/:id inexistente → 404"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/instalaciones/00000000-0000-0000-0000-000000000000" \
  -H "Authorization: Bearer $TOKEN_ADMIN")
[ "$RES" == "404" ] && ok "404 con ID inexistente" || fail "Se esperaba 404, llegó $RES" ""

title "11. POST /api/instalaciones — crear instalación"
RES=$(curl -s -X POST "$API/api/instalaciones" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Instalación Test","codigo":"INST_TEST","ubicacion":"Planta 1"}')
INST_TEST_ID=$(echo $RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$INST_TEST_ID" ] && ok "Instalación de test creada (id: $INST_TEST_ID)" || fail "No se creó la instalación" "$RES"

title "12. POST con código duplicado → 409"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/instalaciones" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Otra","codigo":"INST_TEST"}')
[ "$RES" == "409" ] && ok "409 con código duplicado" || fail "Se esperaba 409, llegó $RES" ""

title "13. POST como RESPONSABLE → 403"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/instalaciones" \
  -H "Authorization: Bearer $TOKEN_RESP" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","codigo":"TEST_RESP"}')
[ "$RES" == "403" ] && ok "403 al crear instalación como RESPONSABLE" || fail "Se esperaba 403, llegó $RES" ""

title "14. PUT /api/instalaciones/:id — actualizar"
if [ -n "$INST_TEST_ID" ]; then
  RES=$(curl -s -X PUT "$API/api/instalaciones/$INST_TEST_ID" \
    -H "Authorization: Bearer $TOKEN_ADMIN" \
    -H "Content-Type: application/json" \
    -d '{"descripcion":"Instalación creada durante los tests"}')
  echo $RES | grep -q "actualizada" && ok "Instalación actualizada correctamente" || fail "No se actualizó" "$RES"
fi

title "15. DELETE /api/instalaciones/:id — eliminar instalación de test"
if [ -n "$INST_TEST_ID" ]; then
  RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/api/instalaciones/$INST_TEST_ID" \
    -H "Authorization: Bearer $TOKEN_ADMIN")
  [ "$RES" == "200" ] && ok "Instalación de test eliminada" || fail "Se esperaba 200, llegó $RES" ""
fi

# =====================================================
# DISPOSITIVOS
# =====================================================
section "DISPOSITIVOS"

title "16. GET /api/dispositivos como ADMIN"
RES=$(curl -s -X GET "$API/api/dispositivos" -H "Authorization: Bearer $TOKEN_ADMIN")
echo $RES | grep -q '"dispositivos"' && ok "ADMIN obtiene todos los dispositivos" || fail "Error obteniendo dispositivos" "$RES"

title "17. GET /api/dispositivos/:id"
RES=$(curl -s -X GET "$API/api/dispositivos/$DISPOSITIVO_ID" -H "Authorization: Bearer $TOKEN_ADMIN")
echo $RES | grep -q "84:1F:E8:39:54:D4" && ok "Dispositivo obtenido con MAC correcta" || fail "No se obtuvo el dispositivo" "$RES"

title "18. POST con MAC inválida → 400"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/dispositivos" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","mac_address":"MAC_INVALIDA"}')
[ "$RES" == "400" ] && ok "400 con MAC inválida" || fail "Se esperaba 400, llegó $RES" ""

title "19. POST con MAC duplicada → 409"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/dispositivos" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","mac_address":"84:1F:E8:39:54:D4"}')
[ "$RES" == "409" ] && ok "409 con MAC duplicada" || fail "Se esperaba 409, llegó $RES" ""

title "20. POST como RESPONSABLE → 403"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/dispositivos" \
  -H "Authorization: Bearer $TOKEN_RESP" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","mac_address":"AA:BB:CC:DD:EE:FF"}')
[ "$RES" == "403" ] && ok "403 al crear dispositivo como RESPONSABLE" || fail "Se esperaba 403, llegó $RES" ""

# =====================================================
# ALERTAS CONFIG
# =====================================================
section "ALERTAS CONFIG"

title "21. GET /api/alertas-config como ADMIN"
RES=$(curl -s -X GET "$API/api/alertas-config" -H "Authorization: Bearer $TOKEN_ADMIN")
echo $RES | grep -q '"alertas"' && ok "ADMIN obtiene todas las alertas" || fail "Error obteniendo alertas" "$RES"

title "22. POST con operador inválido → 400"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/alertas-config" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d "{\"instalacion_id\":\"$INST_A\",\"tipo\":\"TEST\",\"nombre\":\"Test\",\"campo\":\"radiacion\",\"operador\":\"!=\",\"umbral\":10}")
[ "$RES" == "400" ] && ok "400 con operador inválido" || fail "Se esperaba 400, llegó $RES" ""

title "23. POST alerta válida"
RES=$(curl -s -X POST "$API/api/alertas-config" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -H "Content-Type: application/json" \
  -d "{\"instalacion_id\":\"$INST_A\",\"tipo\":\"TEST_SUITE\",\"nombre\":\"Alerta Test Suite\",\"campo\":\"radiacion\",\"operador\":\">\",\"umbral\":99,\"emails_destino\":[\"test@test.com\"]}")
ALERTA_TEST_ID=$(echo $RES | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -n "$ALERTA_TEST_ID" ] && ok "Alerta de test creada (id: $ALERTA_TEST_ID)" || fail "No se creó la alerta" "$RES"

title "24. DELETE alerta de test"
if [ -n "$ALERTA_TEST_ID" ]; then
  RES=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$API/api/alertas-config/$ALERTA_TEST_ID" \
    -H "Authorization: Bearer $TOKEN_ADMIN")
  [ "$RES" == "200" ] && ok "Alerta de test eliminada" || fail "Se esperaba 200, llegó $RES" ""
fi

# =====================================================
# HEALTH CHECK
# =====================================================
section "HEALTH CHECK"

title "25. GET /api/health"
RES=$(curl -s "$API/api/health")
echo $RES | grep -q '"status":"ok"' && ok "Servidor respondiendo correctamente" || fail "Health check fallido" "$RES"

title "26. Ruta no existente → 404"
RES=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/rutainexistente")
[ "$RES" == "404" ] && ok "404 en ruta no existente" || fail "Se esperaba 404, llegó $RES" ""

# =====================================================
# RESUMEN
# =====================================================
echo ""
echo "══════════════════════════════════════════════════"
echo -e "  RESULTADO FINAL: ${GREEN}$PASS passed${NC}  |  ${RED}$FAIL failed${NC}"
echo "══════════════════════════════════════════════════"
echo ""
