package com.unmsm.bustrack.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class NextBus(
    val bus_id: Int,
//    @SerialName(value = "ruta_id")
    val ruta_id: Int,
//    @SerialName(value = "tiempo_estimado")
    val tiempo_estimado: Float, // in seconds
//    @SerialName(value = "paradero_actual")
    val paradero_actual: Int
) {
    val formattedTime: String
        get() {
            val millis = (tiempo_estimado * 100 % 100).toInt()
            val minutes = (tiempo_estimado / 60).toInt()
            val seconds = (tiempo_estimado % 60).toInt()
            return "${if(minutes > 0) "${minutes}m" else ""}${seconds}${if(millis > 0) ".${millis}" else ""}s"
        }
}
