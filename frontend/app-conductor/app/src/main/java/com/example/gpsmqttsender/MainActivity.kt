package com.example.gpsmqttsender

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Looper
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import org.json.JSONObject
import java.util.*

import java.io.PrintWriter
import java.net.*

class MainActivity : AppCompatActivity() {
    private var socketUDP: DatagramSocket? = null
    private var socket: Socket? = null
    private var writer: PrintWriter? = null
    private var sendingData = false
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback
    private lateinit var txtStatus: TextView

    private val tokenSecreto = "X9aLz7QkVm2"
    private lateinit var locationRequest: LocationRequest

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        txtStatus = findViewById(R.id.txtStatus)
        val btnStart = findViewById<Button>(R.id.btnStart)
        val btnStop = findViewById<Button>(R.id.btnStop)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        locationRequest = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY, 10000).setMinUpdateIntervalMillis(5000).build()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                val location = result.lastLocation ?: return
                val calendario = Calendar.getInstance()

                val json = JSONObject().apply {
                    put("lat", location.latitude)
                    put("lon", location.longitude)
                    put("day", calendario.get(Calendar.DAY_OF_MONTH))
                    put("month", calendario.get(Calendar.MONTH) + 1)
                    put("year", calendario.get(Calendar.YEAR))
                    put("hour", calendario.get(Calendar.HOUR_OF_DAY))
                    put("minute", calendario.get(Calendar.MINUTE))
                    put("second", calendario.get(Calendar.SECOND))
                    put("token", tokenSecreto)
                }
                enviarPorSocket(json.toString())
            }
        }

        btnStart.setOnClickListener {
            if (!sendingData) {
                val permisosOk =
                    ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED

                if (!permisosOk) {
                    ActivityCompat.requestPermissions(
                        this,
                        arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                        1001
                    )
                    txtStatus.text = "Solicitando permisos de ubicación..."
                    return@setOnClickListener
                }

                txtStatus.text = "Buscando ESP32 cercano..."
                iniciarConexionAutomatica()
            }
        }

        btnStop.setOnClickListener {
            stopLocationUpdates()
            cerrarSocket()
            txtStatus.text = "Detenido. Conexión cerrada."
        }
    }

    private fun iniciarConexionAutomatica() {
        if (socketUDP != null && !socketUDP!!.isClosed) {
            socketUDP!!.close()
            Log.w("UDP", "Socket ya estaba en uso, cerrado para reiniciar")
            runOnUiThread {
                txtStatus.text = "Reiniciando búsqueda del ESP32..."
            }
        }

        Thread {
            try {
                socketUDP = DatagramSocket(4567) // o usar 0 para aleatorio
                socketUDP!!.soTimeout = 5000 // ⏱ Timeout de 5 segundos

                val buffer = ByteArray(256)
                val packet = DatagramPacket(buffer, buffer.size)

                Log.d("UDP", "Esperando mensaje UDP...")
                socketUDP!!.receive(packet)

                val mensaje = String(packet.data, 0, packet.length)
                val json = JSONObject(mensaje)

                val ip = json.getString("ip")
                val puerto = json.getInt("puerto")

                runOnUiThread {
                    txtStatus.text = "ESP32 detectado en $ip, conectando..."
                    conectarSocketESP32(ip, puerto) { exito ->
                        if (exito) {
                            txtStatus.text = "Conectado automáticamente a $ip"
                            startLocationUpdates(locationRequest)
                            sendingData = true
                        } else {
                            txtStatus.text = "Error al conectar con ESP32 en $ip"
                        }
                    }
                }

            } catch (e: SocketTimeoutException) {
                Log.e("UDP", "Timeout esperando UDP", e)
                runOnUiThread {
                    txtStatus.text = "No se detectó ningún ESP32"
                }
            } catch (e: Exception) {
                Log.e("UDP", "Error general al detectar ESP32", e)
                runOnUiThread {
                    txtStatus.text = "Error UDP: ${e.message}"
                }
            } finally {
                socketUDP?.close()
                socketUDP = null
            }
        }.start()
    }
    

    private fun conectarSocketESP32(ip: String, port: Int, callback: (Boolean) -> Unit) {
        Thread {
            try {
                socket = Socket(ip, port)
                writer = PrintWriter(socket!!.getOutputStream(), true)
                runOnUiThread { callback(true) }
            } catch (e: Exception) {
                Log.e("TCP", "Error al conectar con ESP32", e)
                runOnUiThread { callback(false) }
            }
        }.start()
    }

    private fun enviarPorSocket(mensaje: String) {
        Thread {
            try {
                if (socket != null && socket!!.isConnected && !socket!!.isClosed && writer != null) {
                    Log.d("TCP", "Enviando mensaje: $mensaje")
                    writer?.apply {
                        println(mensaje)
                        flush()
                    }
                    runOnUiThread {
                        try {
                            val jsonObj = JSONObject(mensaje)
                            jsonObj.remove("token") // quitar solo para mostrar
                            txtStatus.text = "Enviado: ${jsonObj.toString()}"
                        } catch (e: Exception) {
                            txtStatus.text = "Enviado"
                        }
                    }
                } else {
                    Log.e("TCP", "Socket no válido para enviar. Estado: conectado=${socket?.isConnected}, cerrado=${socket?.isClosed}")
                    runOnUiThread {
                        txtStatus.text = "No hay conexión activa con el ESP32"
                    }
                }
            } catch (e: Exception) {
                Log.e("TCP", "Error al enviar mensaje", e)
                runOnUiThread {
                    txtStatus.text = "Error al enviar datos: ${e.toString()}"
                }
            }
        }.start()
    }


    private fun cerrarSocket() {
        try {
            writer?.close()
            socket?.close()
            writer = null
            socket = null
        } catch (e: Exception) {
            Log.e("TCP", "Error al cerrar socket", e)
        }
    }

    private fun startLocationUpdates(request: LocationRequest) {
        if (!sendingData) {
            val permisoFine = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            val permisoCoarse = ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)

            if (permisoFine == PackageManager.PERMISSION_GRANTED || permisoCoarse == PackageManager.PERMISSION_GRANTED) {
                fusedLocationClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
                sendingData = true
                txtStatus.text = "Ubicación activa"
            } else {
                txtStatus.text = "Permiso de ubicación no concedido"
                Toast.makeText(this, "Activa los permisos de ubicación para continuar", Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun stopLocationUpdates() {
        if (sendingData) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            sendingData = false
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopLocationUpdates()
        cerrarSocket()
    }
}
