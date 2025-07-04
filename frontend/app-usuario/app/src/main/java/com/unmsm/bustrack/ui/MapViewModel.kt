package com.unmsm.bustrack.ui

import android.util.Log
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.unmsm.bustrack.BusTrackApplication
import com.unmsm.bustrack.data.model.BusStop
import com.unmsm.bustrack.data.repository.MapRepository
import kotlinx.coroutines.launch

sealed interface MapUiState {
    data class Success(val map: List<BusStop>) : MapUiState
    object Error : MapUiState
    object Loading : MapUiState
}

class MapViewModel(private val repository: MapRepository) : ViewModel() {
    var mapUiState: MapUiState by mutableStateOf(MapUiState.Loading)

    init {
        getBusStops()
    }

    fun getBusStops() {
        mapUiState = MapUiState.Loading
        viewModelScope.launch {
            mapUiState = try {
                val status = repository.getBusStops()
                MapUiState.Success(status)
            } catch (e: Exception) {
                Log.d("MapViewModel", "getBusStops: ${e.message}")
                MapUiState.Error
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val application = (this[APPLICATION_KEY] as BusTrackApplication)
                val currentRepository = application.container.repository
                MapViewModel(currentRepository)
            }
        }
    }
}