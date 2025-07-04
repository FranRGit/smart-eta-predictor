package com.unmsm.bustrack.ui

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import com.mapbox.common.MapboxOptions
import com.mapbox.geojson.Point
import com.mapbox.maps.extension.compose.MapboxMap
import com.mapbox.maps.extension.compose.animation.viewport.rememberMapViewportState
import com.mapbox.maps.extension.compose.annotation.generated.PointAnnotation
import com.mapbox.maps.extension.compose.annotation.rememberIconImage
import com.unmsm.bustrack.R
import com.unmsm.bustrack.data.model.BusStop


@Composable
fun MapDisplay(
    busStops: List<BusStop>,
    onSelect: (Int) -> Unit,
    modifier: Modifier = Modifier
) {
//    val context = LocalContext.current
    MapboxOptions.accessToken = "pk.eyJ1Ijoia2pueCIsImEiOiJjbTZpcWo1NGUwYjhqMmpvcHJ4dnY1NmFyIn0.5HIvoMa78fPdrHm58UJS2w"
    var currentZoom by remember { mutableDoubleStateOf(16.0) }
    MapboxMap(
        modifier = modifier.fillMaxSize(),
        mapViewportState = rememberMapViewportState {
            setCameraOptions {
                zoom(currentZoom)
//                center(Point.fromLngLat(-98.0, 39.5))
                center(Point.fromLngLat(-77.085826, -12.053679))
                pitch(0.0)
                bearing(0.0)
            }
        }
    ) {
//        var text by remember { mutableStateOf("Paradero") }

        var markerResourceId by remember { mutableIntStateOf(R.drawable.bus_marker) }
        val marker = rememberIconImage(
            key = markerResourceId,
            painter = painterResource(markerResourceId)
        )
        busStops.forEach { i ->
            PointAnnotation(point = Point.fromLngLat(i.longitud, i.latitud)) {
                iconImage = marker
                textField = i.name
                iconSize = currentZoom / 32
                interactionsState.onClicked {
                    onSelect(i.id)
                    true
                }.also { it.isDraggable = false }
            }
        }
    }
}

@Composable
fun MapStage(
    mapsUiState: MapUiState,
    onSelect: (Int) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier
) {
    when(mapsUiState) {
        is MapUiState.Error -> ErrorScreen(onRetry, modifier)
        is MapUiState.Loading -> LoadingScreen(modifier)
        is MapUiState.Success -> MapDisplay(mapsUiState.map, onSelect, modifier)
    }
}

@Composable
fun MapScreen(
    onSelect: (Int) -> Unit,
    viewModel: MapViewModel = viewModel(factory = MapViewModel.Factory)
) {
    Scaffold(
        topBar = { TopBar() },
        floatingActionButton = {
            /*FloatingActionButton(onClick = {}) {
                Icon(
                    imageVector = Icons.Default.MyLocation,
                    contentDescription = "Center location"
                )
            }*/
        }
    ) { innerPadding ->
        MapStage(
            mapsUiState = viewModel.mapUiState,
            onSelect = onSelect,
            onRetry = viewModel::getBusStops,
            modifier = Modifier.padding(innerPadding)
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBar() {
    CenterAlignedTopAppBar(title = { Text(text = stringResource(R.string.app_name)) })
}
