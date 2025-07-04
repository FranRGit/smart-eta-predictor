package com.unmsm.bustrack.data.model

import kotlinx.serialization.Serializable

@Serializable
data class BusStop(
    val id: Int,
    val name: String,
    val longitud: Double,
    val latitud: Double,
//    val population: Int, // Cantidad de usuarios en dicho paradero
)
