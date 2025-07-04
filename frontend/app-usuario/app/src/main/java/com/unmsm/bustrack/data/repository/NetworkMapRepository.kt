package com.unmsm.bustrack.data.repository

import com.unmsm.bustrack.data.model.BusStop
import com.unmsm.bustrack.data.model.NextBus
import com.unmsm.bustrack.data.network.BusTrackApiService

class NetworkMapRepository(private val apiService: BusTrackApiService) : MapRepository {
    override suspend fun getBusStops(): List<BusStop> = apiService.getBusStops()

    override suspend fun getTimes(busStopId: Int): List<NextBus> = apiService.getTimes(busStopId)
}