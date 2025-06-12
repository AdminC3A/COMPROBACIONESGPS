const form = document.getElementById("ubicacionForm");
const estado = document.getElementById("estado");
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token") || "sin-token";
document.getElementById("token").value = token;

const ocultarDatos = true; // cambia a false para mostrar el texto

const coordenadasObras = {
  obra1: { nombre: "Obra 1 - Quivira - Casa Tres Aguas", lat: 22.874979, lon: -109.961205 },
  obra2: { nombre: "Obra 2 - Cabo Real", lat: 22.9903641, lon: -109.7694588 },
  obra3: { nombre: "Obra 3 - Chileno Lote 23", lat: 22.945385, lon: -109.8167839 },
  oficina: { nombre: "Oficina Central", lat: 23.0634537, lon: -109.7004738 }
};

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function reenviarCoordenadasCorregidas(lat, lon, refObra, distancia, enObra, tipoRed) {
  const dataFix = new URLSearchParams();
  dataFix.append("token", "corregido");
  dataFix.append("nombre", "Corrección");
  dataFix.append("motivo", "Ajuste GPS");
  dataFix.append("obra", refObra.nombre);
  dataFix.append("lat", lat.toString());
  dataFix.append("lon", lon.toString());
  dataFix.append("fecha", new Date().toLocaleString());
  dataFix.append("distancia", distancia.toFixed(1));
  dataFix.append("enObra", enObra);
  dataFix.append("tipoRed", tipoRed);
  dataFix.append("userAgent", navigator.userAgent);

  fetch("https://script.google.com/macros/s/AKfycbwBQWL7R22qX1t_J9uSNLeTkSebhOyuqf6CSCrrEojSR57Qry006DkDnTbqdtmdp0S3/exec", {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: dataFix
  });
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  if (!navigator.geolocation) {
    estado.textContent = "La geolocalización no está soportada por tu navegador.";
    return;
  }

  estado.textContent = "Obteniendo ubicación...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = Number(position.coords.latitude).toFixed(8);
      const lon = Number(position.coords.longitude).toFixed(8);
      const selectedObra = form.obra.value;
      const refObra = coordenadasObras[selectedObra];
      const distancia = calcularDistancia(lat, lon, refObra.lat, refObra.lon);
      const enObra = distancia <= 100 ? "✅ Sí" : "❌ No";
      const tipoRed = navigator.connection ? navigator.connection.effectiveType : "desconocido";

      const data = new URLSearchParams();
      data.append("token", token);
      data.append("nombre", form.nombre.value);
      data.append("motivo", form.motivo.value);
      data.append("obra", refObra.nombre);
      data.append("lat", lat.toString());
      data.append("lon", lon.toString());
      data.append("fecha", new Date().toLocaleString());
      data.append("distancia", distancia.toFixed(1));
      data.append("enObra", enObra);
      data.append("tipoRed", tipoRed);
      data.append("userAgent", navigator.userAgent);

      fetch("https://script.google.com/macros/s/AKfycbwBQWL7R22qX1t_J9uSNLeTkSebhOyuqf6CSCrrEojSR57Qry006DkDnTbqdtmdp0S3/exec", {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: data
      })
      .then(() => {
        const colorTexto = ocultarDatos ? "#f7f7f7" : "black";
        estado.innerHTML = `
          <div id="datosUbicacion" style="color: ${colorTexto};">
            <b>Ubicación enviada:</b><br>
            Latitud: ${lat}<br>
            Longitud: ${lon}<br>
            Distancia a la obra: ${distancia.toFixed(1)} m<br>
            En obra: ${enObra}
          </div>
        `;
        reenviarCoordenadasCorregidas(lat, lon, refObra, distancia, enObra, tipoRed);
        form.reset();
      })
      .catch((error) => {
        estado.textContent = "Error al enviar los datos.";
        console.error("Error en fetch:", error);
      });
    },
    (error) => {
      estado.textContent = "No se pudo obtener la ubicación.";
    }
  );
});
