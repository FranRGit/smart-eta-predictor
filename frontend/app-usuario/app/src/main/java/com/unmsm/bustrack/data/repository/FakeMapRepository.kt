package com.unmsm.bustrack.data.repository

import com.unmsm.bustrack.data.model.BusStop
import com.unmsm.bustrack.data.model.NextBus
/*

class FakeMapRepository : MapRepository {
//    override suspend fun getMapData(): MapData = MapData(
//        bus = listOf(
//            Bus(
//                id = 0,
//                name = "BUS-1"
//            ),
//            Bus(
//                id = 1,
//                name = "BUS-2"
//            ),
//            Bus(
//                id = 2,
//                name = "BUS-3"
//            ),
//        ),
//        busStops = listOf(
//            BusStop(
//                id = 0,
//                name = "Facultad de Ingeniería de Sistemas e Informática",
//                longitude = -77.085826,
//                latitude = -12.053679,
//            ),
//            BusStop(
//                id = 1,
//                name = "Facultad de Odontología",
//                longitude = -77.086452,
//                latitude = -12.053858,
//            ),
//        ),
//        routes = listOf(
//            NextBus(
//                id = 0,
//                name = "El burro"
//            )
//        )
//    )

    override suspend fun getBusStops(): List<BusStop> = listOf(
        BusStop(
            id = 0,
            name = "Facultad de Ingeniería de Sistemas e Informática",
            longitud = -77.085826,
            latitud = -12.053679
        ),
        BusStop(
            id = 1,
            name = "Facultad de Odontología",
            longitud = -77.086452,
            latitud = -12.053858
        ),
    )

    override suspend fun getTimes(busStopId: Int): List<NextBus> = listOf(
        NextBus(
            id = 0,
            name = "A1",
            time = (0..20000).random() / 100f
        ),
        NextBus(
            id = 1,
            name = "A2",
            time = (0..20000).random() / 100f
        )
    )
}
*/
