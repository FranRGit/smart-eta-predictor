package com.unmsm.bustrack

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.unmsm.bustrack.data.model.ViewData
import com.unmsm.bustrack.ui.InformationScreen
import com.unmsm.bustrack.ui.MapScreen
import com.unmsm.bustrack.ui.theme.BusTrackTheme

enum class BusTrack {
    Map,
    Display
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BusTrackTheme {
                val navController = rememberNavController()
                NavHost(navController = navController, startDestination = BusTrack.Map.name) {
                    composable(BusTrack.Map.name) {
                        MapScreen(
                            onSelect = { i ->
                                navController.navigate(BusTrack.Display.name)
                                ViewData.selected = i
                                ViewData.apply {
                                    selected = i

                                }
                            }
                        )
                    }
                    composable(BusTrack.Display.name) {
                        InformationScreen(
                            onReturn = {
                                navController.popBackStack(
                                    route = BusTrack.Map.name,
                                    inclusive = false
                                )
                            }
                        )
                    }
                }
            }
        }
    }
}
