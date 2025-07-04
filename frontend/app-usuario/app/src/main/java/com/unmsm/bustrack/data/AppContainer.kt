package com.unmsm.bustrack.data

import com.google.gson.Gson
import com.jakewharton.retrofit2.converter.kotlinx.serialization.asConverterFactory
import com.unmsm.bustrack.data.network.BusTrackApiService
//import com.unmsm.bustrack.data.repository.FakeMapRepository
import com.unmsm.bustrack.data.repository.MapRepository
import com.unmsm.bustrack.data.repository.NetworkMapRepository
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

interface AppContainer {
    val repository: MapRepository
}

class DefaultAppContainer : AppContainer {
    private val baseUrl =
        "http://192.168.137.29:3000"

    private val retrofit: Retrofit = Retrofit.Builder()
        .addConverterFactory(GsonConverterFactory.create())
        .baseUrl(baseUrl)
        .build()

    private val retrofitService: BusTrackApiService by lazy {
        retrofit.create(BusTrackApiService::class.java)
    }

    override val repository by lazy {
        NetworkMapRepository(retrofitService)
    }
}