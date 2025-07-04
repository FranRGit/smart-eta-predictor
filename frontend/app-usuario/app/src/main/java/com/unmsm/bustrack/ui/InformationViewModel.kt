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
import com.unmsm.bustrack.data.model.NextBus
import com.unmsm.bustrack.data.model.ViewData
import com.unmsm.bustrack.data.repository.MapRepository
import kotlinx.coroutines.launch

sealed interface InformationUiState {
    data class Success(val map: List<NextBus>) : InformationUiState
    object Error : InformationUiState
    object Loading : InformationUiState
}

class InformationViewModel(private val repository: MapRepository) : ViewModel() {
    var informationUiState: InformationUiState by mutableStateOf(InformationUiState.Loading)

    init {
        getPredictions()
    }

    fun getPredictions() {
        informationUiState = InformationUiState.Loading
        viewModelScope.launch {
            informationUiState = try {
                val status = repository.getTimes(ViewData.selected)
                InformationUiState.Success(status)
            } catch (e: Exception) {
                Log.d("InformationViewModel", "getPredictions: ${e.message}")
                InformationUiState.Error
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = viewModelFactory {
            initializer {
                val application = (this[APPLICATION_KEY] as BusTrackApplication)
                val currentRepository = application.container.repository
                InformationViewModel(currentRepository)
            }
        }
    }
}