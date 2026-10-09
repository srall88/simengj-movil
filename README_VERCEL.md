# SIMENGJ Móvil • Corte Superior de Justicia de Lima Este (CSJLE)
## Despliegue en Vercel para Consultas en Celulares (Magistrados y Funcionarios)

Esta aplicación móvil está diseñada exclusivamente para **consultas rápidas de indicadores y metas judiciales** desde cualquier teléfono celular (Android o iPhone), sin necesidad de instalar APKs ni estar conectado a la red interna judicial.

---

### ¿Qué KPIs muestra la aplicación?
1. 📈 **Total de Producción:** Producción acumulada de enero a la fecha consultada.
2. 📅 **Producción del Mes:** Resueltos en el mes específico seleccionado.
3. 🎯 **Meta Preliminar:** Meta oficial anual o ajustada fijada para la dependencia.
4. ⚡ **% de Avance:** Porcentaje de cumplimiento alcanzado respecto a la meta preliminar.
5. ⏱️ **% Ideal del Mes:** Meta esperada al mes de corte.
6. 🏆 **Nivel Resolutivo / Cumplimiento:** Calificación oficial (`MUY BUENO`, `BUENO`, `BAJO`) con badge visual de color.

---

### Pasos para Desplegar en Vercel Gratis (Menos de 2 minutos)

#### Opción 1: Despliegue con Vercel CLI (Línea de Comandos)
1. Abra una ventana de terminal (PowerShell o CMD) en la carpeta:
   ```bash
   cd d:\SIMENGJ\movil-vercel
   ```
2. Ejecute:
   ```bash
   npx vercel
   ```
3. Si es la primera vez, ingrese su correo para iniciar sesión en Vercel.
4. Presione `Enter` para aceptar las opciones predeterminadas:
   - *Set up and deploy?* **Y**
   - *Which scope?* (su usuario)
   - *Link to existing project?* **N**
   - *What's your project's name?* **simengj-movil**
   - *In which directory is your code located?* **./**
5. Para el despliegue a producción final:
   ```bash
   npx vercel --prod
   ```
6. Vercel le entregará un enlace HTTPS público, por ejemplo:
   👉 `https://simengj-movil.vercel.app`

---

#### Opción 2: Despliegue conectando con GitHub (Recomendado para actualizaciones automáticas)
1. Suba esta carpeta `movil-vercel` a un repositorio en su cuenta de GitHub (ej: `simengj-movil`).
2. Ingrese a [https://vercel.com](https://vercel.com) y haga clic en **"Add New..." > "Project"**.
3. Seleccione el repositorio `simengj-movil`.
4. Haga clic en **"Deploy"**. Vercel detectará la configuración automáticamente (`vercel.json`) y generará el enlace web.

---

### ¿Cómo actualizar los datos cuando se cargue un nuevo mes en el SIMENGJ?
Cuando ingeste nuevos archivos CSV en el SIMENGJ de su computadora:
1. En la consola del backend de SIMENGJ, ejecute:
   ```bash
   cd d:\SIMENGJ\backend
   node src/tools/generateConsultasData.js
   ```
2. Esto actualizará automáticamente el archivo `consultasData.json`.
3. Vuelva a ejecutar `npx vercel --prod` en `d:\SIMENGJ\movil-vercel` y los nuevos datos estarán disponibles al instante en todos los celulares.
