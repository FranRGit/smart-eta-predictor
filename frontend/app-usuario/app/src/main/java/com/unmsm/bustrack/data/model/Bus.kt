package com.unmsm.bustrack.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Bus(
    val id: Int,
    val name: String,
)
