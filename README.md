# Manual de Configuración y Ejecución - Far Corners Web Site

Este documento detalla los pasos necesarios para levantar el entorno de desarrollo local, la base de datos y la ejecución de los componentes de la plataforma.

## 1. Requisitos Previos

* Docker y Docker Compose instalados.
* Node.js (versión 20 o superior recomendada).

## 2. Configuración de Variables de Entorno

Se debe crear un archivo `.env` tanto en la carpeta `backend/` como en la carpeta `frontend/`, tomando como referencia los ejemplos provistos o utilizando las siguientes configuraciones predeterminadas para el entorno local.

Ejemplo para `backend/.env`:

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


3. Ejecutar en modo desarrollo:
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