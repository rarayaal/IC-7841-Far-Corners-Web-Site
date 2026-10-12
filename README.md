# Manual de Configuración y Ejecución - Far Corners Web Site

Este documento detalla los pasos necesarios para levantar el entorno de desarrollo local, la base de datos y la ejecución de los componentes de la plataforma del Teatro Comunitario Far Corners, conforme a la arquitectura establecida en el proyecto.

## 1. Requisitos Previos

* Docker y Docker Compose instalados.
* Node.js (versión 20 o superior recomendada).
* Cliente de bases de datos opcional (DBeaver recomendado para la gestión visual).

## 2. Configuración de Variables de Entorno

Se debe crear un archivo `.env` dentro de la carpeta `backend/` utilizando la siguiente configuración para el entorno local con contenedores:

Archivo `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://admin:adminpassword@db:5432/farcorners

```

## 3. Gestión de Contenedores (Docker)

Los comandos deben ejecutarse desde la raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).

* **Construir y levantar servicios en segundo plano:**
```bash
docker-compose up -d --build

```


* **Verificar el estado de los contenedores:**
```bash
docker ps

```


* **Detener los contenedores:**
```bash
docker-compose down

```



## 4. Ejecución de Componentes Locales

### Backend

1. Ingresar a la carpeta del servidor:
```bash
cd backend

```


2. Instalar las dependencias:
```bash
npm install

```


3. Ejecutar en modo desarrollo (con recarga automática):
```bash
npm run dev

```



### Frontend

1. Ingresar a la carpeta de la interfaz:
```bash
cd frontend

```


2. Instalar las dependencias:
```bash
npm install

```


3. Ejecutar el servidor de desarrollo de Vite:
```bash
npm run dev

```



---

## 5. Verificación y Pruebas del Sistema

### Endpoints de Comprobación (Health Checks)

Una vez que el backend esté en ejecución, se pueden verificar los servicios mediante las siguientes rutas en el navegador o un cliente HTTP:

* **Estado general de la API:** `http://localhost:3000/api/health`

* **Verificación de conexión con PostgreSQL:** `http://localhost:3000/api/health/db`

* **Listado de proyectos (Ejemplo de API):** `http://localhost:3000/api/v1/projects`


### Parámetros de Conexión a la Base de Datos (Cliente SQL)

Para conectarse a la base de datos relacional administrada por Docker:

* **Driver:** PostgreSQL
* **Host:** `localhost`
* **Port:** `5432`
* **Database:** `farcorners`
* **Username:** `admin`
* **Password:** `adminpassword`