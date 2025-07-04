package com.unmsm.bustrack.data.network

import com.unmsm.bustrack.data.model.BusStop
import com.unmsm.bustrack.data.model.NextBus
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface BusTrackApiService {
    @GET("paradero")
    suspend fun getBusStops() : List<BusStop>

    @GET("predict-eta/")
    suspend fun getTimes(@Query("paradero_id") busId: Int) : List<NextBus>
}
