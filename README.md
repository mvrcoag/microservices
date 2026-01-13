# Proyecto de Microservicios Educativo

Este proyecto es un ejemplo educativo de arquitectura de microservicios construido con Node.js, TypeScript y Docker.

## Tabla de Contenidos

- [¿Qué son los Microservicios?](#qué-son-los-microservicios)
- [Arquitectura del Proyecto](#arquitectura-del-proyecto)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Componentes Principales](#componentes-principales)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Ejecución](#instalación-y-ejecución)
- [Probando los Servicios](#probando-los-servicios)
- [Conceptos Clave](#conceptos-clave)
- [Variables de Entorno](#variables-de-entorno)

## ¿Qué son los Microservicios?

Los **microservicios** son un estilo de arquitectura de software donde una aplicación se divide en servicios pequeños e independientes que se comunican entre sí a través de la red. Cada microservicio:

- Se enfoca en una funcionalidad específica
- Puede desarrollarse, desplegarse y escalarse de forma independiente
- Tiene su propia base de código y puede usar diferentes tecnologías
- Se comunica con otros servicios mediante APIs (HTTP, mensajería, etc.)

### Ventajas de los Microservicios

- **Escalabilidad**: Cada servicio puede escalarse de forma independiente
- **Flexibilidad tecnológica**: Cada equipo puede elegir las mejores herramientas para su servicio
- **Despliegue independiente**: Los cambios en un servicio no afectan a los demás
- **Resiliencia**: Si un servicio falla, los demás pueden seguir funcionando
- **Equipos autónomos**: Cada equipo puede trabajar en su servicio sin interferir con otros

## Arquitectura del Proyecto

Este proyecto implementa una arquitectura de microservicios simple con los siguientes componentes:

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │ ◄── Puerto 4000 (expuesto)
│   (Express)         │
└──────┬──────────────┘
       │
       │ Red Interna (bridge)
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Servicio Users│ │Servicio Orders│ │  Más servicios│
│ (Hono)        │ │ (FastAPI)     │ │  (futuro...)  │
│ Puerto 3000   │ │ Puerto 8000   │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
```

### Flujo de Comunicación

1. El cliente hace una petición a `http://localhost:4000/api/{servicio}/...`
   - Ejemplo: `http://localhost:4000/api/users/...`
   - Ejemplo: `http://localhost:4000/api/orders`
2. El **API Gateway** recibe la petición
3. El Gateway aplica:
   - Rate limiting (límite de peticiones)
   - Logging (registro de peticiones)
   - Autenticación/Autorización (cuando se implemente)
4. El Gateway redirige (proxy) la petición al servicio correspondiente
5. El servicio procesa la petición y responde
6. El Gateway devuelve la respuesta al cliente

## Tecnologías Utilizadas

### API Gateway
- **Express**: Framework web para Node.js
- **Winston**: Sistema de logging robusto
- **Morgan**: Middleware para logging de peticiones HTTP
- **express-rate-limit**: Limitador de peticiones para prevenir abuso
- **http-proxy-middleware**: Proxy para redirigir peticiones a microservicios

### Servicio Users
- **Hono**: Framework web ultrarrápido y ligero
- **@hono/node-server**: Adaptador de Hono para Node.js

### Servicio Orders
- **FastAPI**: Framework moderno de Python para construir APIs de alto rendimiento
- **Uvicorn**: Servidor ASGI ultrarrápido para aplicaciones Python
- **Pydantic**: Validación de datos y configuración mediante type hints de Python

### Infraestructura
- **Docker**: Contenedores para empaquetar los servicios
- **Docker Compose**: Orquestación de múltiples contenedores
- **TypeScript**: Superset de JavaScript con tipado estático

## Estructura del Proyecto

```
microservices/
├── docker-compose.yml          # Configuración de Docker Compose
├── .gitignore                  # Archivos ignorados por Git
├── README.md                   # Esta documentación
│
├── services/
│   ├── gateway/                # API Gateway
│   │   ├── src/
│   │   │   ├── main.ts        # Código principal del gateway
│   │   │   ├── limiter.ts     # Configuración de rate limiting
│   │   │   └── loggers.ts     # Configuración de logging
│   │   ├── Dockerfile         # Imagen Docker del gateway
│   │   ├── package.json       # Dependencias del gateway
│   │   ├── tsconfig.json      # Configuración TypeScript
│   │   └── .env               # Variables de entorno (no en Git)
│   │
│   ├── users/                  # Servicio de Usuarios (Node.js)
│   │   ├── src/
│   │   │   └── index.ts       # Código principal del servicio
│   │   ├── Dockerfile         # Imagen Docker del servicio
│   │   ├── package.json       # Dependencias del servicio
│   │   ├── tsconfig.json      # Configuración TypeScript
│   │   └── .env               # Variables de entorno (no en Git)
│   │
│   └── orders/                 # Servicio de Pedidos (Python)
│       ├── main.py            # Código principal del servicio
│       ├── requirements.txt   # Dependencias de Python
│       ├── Dockerfile         # Imagen Docker del servicio
│       └── .env               # Entorno virtual de Python (no en Git)
```

## Componentes Principales

### 1. API Gateway (`services/gateway`)

El **API Gateway** es el punto de entrada único a la arquitectura de microservicios. Sus responsabilidades incluyen:

#### Arquitectura Modular
El gateway está organizado en módulos separados para mejor mantenibilidad:

- **`main.ts`**: Configuración principal y orquestación de middlewares
- **`limiter.ts`**: Configuración de rate limiting
- **`loggers.ts`**: Configuración de Winston para logging

#### Rate Limiting (`limiter.ts`)
Limita las peticiones a 3 por minuto por IP para prevenir abusos:

```typescript
export const limiter = rateLimit({
  windowMs: 60 * 1000,  // Ventana de 1 minuto
  max: 3,                // Máximo 3 peticiones
  message: { error: "Max requests per minute reached" },
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Logging (`loggers.ts`)
Registra todas las peticiones en consola y en archivo usando Winston:

```typescript
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "requests.log" })
  ]
});
```

#### Proxy Reverso Dinámico (`main.ts`)
Redirige las peticiones a los microservicios correspondientes mediante un loop escalable:

```typescript
const services = {
  users: process.env.USERS_SERVICE_URL,
  orders: process.env.ORDERS_SERVICE_URL,
};

for (const [service, target] of Object.entries(services)) {
  app.use(
    `/api/${service}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${service}`]: "/",
      },
    }),
  );
}
```

### 2. Servicio Users (`services/users`)

Un microservicio simple que maneja operaciones relacionadas con usuarios. Usa **Hono**, un framework web ultrarrápido basado en Node.js/TypeScript.

#### Endpoint de Health Check
```typescript
app.get("/health/:id", (c) => {
  const id = c.req.param("id");
  return c.text("Users service running " + id);
});
```

Este servicio está aislado y solo es accesible a través del API Gateway en la red interna de Docker.

### 3. Servicio Orders (`services/orders`)

Un microservicio construido con **FastAPI** (Python) que maneja operaciones relacionadas con pedidos. Este servicio demuestra la flexibilidad de usar diferentes tecnologías en una arquitectura de microservicios.

#### Características
- **Framework**: FastAPI, un framework moderno y de alto rendimiento para Python
- **Servidor**: Uvicorn (ASGI server)
- **Puerto**: 8000
- **Validación**: Pydantic para validación automática de datos

#### Endpoint Principal
```python
@app.get("/")
def get_orders():
    return {"orders": [1, 2, 3]}
```

Este servicio solo es accesible a través del API Gateway mediante `http://localhost:4000/api/orders`.

## Requisitos Previos

Antes de ejecutar este proyecto, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior) - Para servicios en TypeScript/JavaScript
- **Python** (versión 3.11 o superior) - Para el servicio de Orders
- **Docker** (versión 20 o superior)
- **Docker Compose** (versión 2 o superior)
- **npm** o **yarn** - Para gestión de paquetes de Node.js
- **pip** - Para gestión de paquetes de Python

## Instalación y Ejecución

### Opción 1: Usando Docker Compose (Recomendado)

Este método ejecuta todos los servicios en contenedores Docker:

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd microservices

# 2. Construir y ejecutar todos los servicios
docker-compose up --build

# Para ejecutar en segundo plano
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener los servicios
docker-compose down
```

### Opción 2: Desarrollo Local

Para desarrollo local sin Docker:

```bash
# 1. Instalar dependencias del Gateway
cd services/gateway
npm install

# Crear archivo .env
echo "PORT=3000" > .env
echo "USERS_SERVICE_URL=http://localhost:3001" >> .env
echo "ORDERS_SERVICE_URL=http://localhost:8000" >> .env

# Ejecutar en modo desarrollo
npm run dev

# 2. En otra terminal, instalar dependencias del servicio Users
cd services/users
npm install

# Crear archivo .env
echo "PORT=3001" > .env

# Ejecutar en modo desarrollo
npm run dev

# 3. En otra terminal, configurar el servicio Orders
cd services/orders

# Crear entorno virtual de Python
python3 -m venv .env
source .env/bin/activate  # En Windows: .env\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar en modo desarrollo
uvicorn main:app --reload --port 8000
```

## Probando los Servicios

Una vez que los servicios estén ejecutándose, puedes probarlos:

### Usando curl

```bash
# Health check del servicio Users a través del API Gateway
curl http://localhost:4000/api/users/health/123

# Respuesta esperada:
# Users service running 123

# Obtener pedidos del servicio Orders a través del API Gateway
curl http://localhost:4000/api/orders

# Respuesta esperada:
# {"orders":[1,2,3]}
```

### Usando el navegador

Abre tu navegador y visita:
```
http://localhost:4000/api/users/health/test
http://localhost:4000/api/orders
```

### Probando el Rate Limiting

Ejecuta este comando más de 3 veces en 1 minuto:

```bash
# Ejecutar varias veces rápidamente
curl http://localhost:4000/api/users/health/1
curl http://localhost:4000/api/users/health/2
curl http://localhost:4000/api/users/health/3
curl http://localhost:4000/api/users/health/4  # Esta debería ser bloqueada

# Respuesta esperada después de 3 peticiones:
# {"error":"Max requests per minute reached"}
```

### Verificando los Logs

```bash
# Ver logs del Gateway
cat services/gateway/requests.log

# O si usas Docker Compose
docker-compose logs gateway
```

## Conceptos Clave

### 1. API Gateway

El **API Gateway** es un patrón de diseño que actúa como punto de entrada único para todos los clientes. Proporciona:

- **Routing**: Enruta peticiones a los microservicios correctos
- **Composición**: Puede combinar respuestas de múltiples servicios
- **Autenticación**: Valida tokens y credenciales
- **Rate Limiting**: Previene abusos limitando peticiones
- **Logging y Monitoreo**: Registra todas las peticiones
- **Transformación**: Convierte formatos de request/response

### 2. Rate Limiting

Técnica para limitar el número de peticiones que un cliente puede hacer en un período de tiempo. Beneficios:

- Previene ataques DDoS
- Protege contra abuso de API
- Garantiza disponibilidad para todos los usuarios
- Controla costos de infraestructura

### 3. Logging

Sistema de registro de eventos para:

- **Debugging**: Encontrar y solucionar problemas
- **Auditoría**: Rastrear quién hizo qué y cuándo
- **Monitoreo**: Detectar patrones anómalos
- **Análisis**: Entender el uso de la API

### 4. Proxy Reverso

Un proxy reverso recibe peticiones y las reenvía a otros servidores. En este proyecto:

- El Gateway actúa como proxy reverso
- Los clientes no conocen los servicios internos
- Permite cambiar la ubicación de los servicios sin afectar clientes
- Proporciona una capa de seguridad adicional

### 5. Docker Networking

Docker Compose crea una red interna (`bridge`) donde:

- Los servicios pueden comunicarse por nombre (DNS interno)
- Los servicios no expuestos son inaccesibles desde fuera
- Mayor seguridad: solo el Gateway es accesible públicamente

### 6. Variables de Entorno

Configuración que se inyecta en tiempo de ejecución:

- Permite diferentes configuraciones por ambiente (dev, staging, prod)
- Mantiene secretos fuera del código fuente
- Facilita el despliegue en diferentes entornos

## Variables de Entorno

### Gateway (`services/gateway/.env`)

```env
PORT=3000                                    # Puerto interno del gateway
USERS_SERVICE_URL=http://users:3000        # URL del servicio de usuarios
ORDERS_SERVICE_URL=http://orders:8000      # URL del servicio de pedidos
```

### Users Service (`services/users/.env`)

```env
PORT=3000                                    # Puerto del servicio
```

### Orders Service

El servicio de Orders no requiere un archivo `.env` para su configuración básica. FastAPI y Uvicorn usan el puerto especificado en el comando de ejecución (8000).

### Docker Compose

Las variables de entorno se configuran en `docker-compose.yml`:

```yaml
gateway:
  environment:
    - PORT=3000
    - USERS_SERVICE_URL=http://users:3000
    - ORDERS_SERVICE_URL=http://orders:8000
  depends_on:
    - users
    - orders
```

## Ventajas del Enfoque Poliglota

Este proyecto demuestra una ventaja clave de los microservicios: **la libertad tecnológica**. Hemos implementado:

- **Gateway y Users**: Node.js/TypeScript con Express y Hono
- **Orders**: Python con FastAPI

Cada servicio usa la tecnología más apropiada para sus necesidades, demostrando que en una arquitectura de microservicios puedes:
- Elegir el lenguaje y framework más adecuado para cada tarea
- Aprovechar las fortalezas específicas de cada tecnología
- Permitir que diferentes equipos trabajen con sus tecnologías preferidas
- Migrar servicios individuales sin afectar el resto del sistema

## Próximos Pasos

Para expandir este proyecto educativo, considera implementar:

1. **Autenticación y Autorización**
   - JWT (JSON Web Tokens)
   - OAuth 2.0
   - Middleware de autenticación en el Gateway

2. **Más Microservicios**
   - Servicio de productos
   - Servicio de notificaciones
   - Servicio de pagos

3. **Base de Datos**
   - PostgreSQL para cada servicio
   - MongoDB para datos no estructurados
   - Redis para caché

4. **Comunicación entre Servicios**
   - REST APIs
   - Message Brokers (RabbitMQ, Kafka)
   - gRPC

5. **Observabilidad**
   - Prometheus para métricas
   - Grafana para visualización
   - Jaeger para tracing distribuido
   - ELK Stack para logs centralizados

6. **Testing**
   - Unit tests (Jest, Vitest)
   - Integration tests
   - E2E tests (Playwright, Cypress)

7. **CI/CD**
   - GitHub Actions
   - GitLab CI
   - Jenkins

8. **Orquestación Avanzada**
   - Kubernetes
   - Helm Charts
   - Service Mesh (Istio)

## Contribuciones

Este es un proyecto educativo. Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añade nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## Contacto

Si tienes preguntas o sugerencias, no dudes en abrir un issue en el repositorio.

---

**¡Feliz aprendizaje!** 🚀
