package com.unmsm.bustrack.data.repository

import com.unmsm.bustrack.data.model.BusStop
import com.unmsm.bustrack.data.model.NextBus

interface MapRepository {
    suspend fun getBusStops(): List<BusStop>
//    suspend fun getBuses(): List<Bus>
//    suspend fun getRoutes(): List<Route>
//    suspend fun getMapData(): MapData
    suspend fun getTimes(busStopId: Int) : List<NextBus>
}