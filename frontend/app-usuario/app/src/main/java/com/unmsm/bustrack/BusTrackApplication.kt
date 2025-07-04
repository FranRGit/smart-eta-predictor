package com.unmsm.bustrack

import android.app.Application
import com.unmsm.bustrack.data.AppContainer
import com.unmsm.bustrack.data.DefaultAppContainer

class BusTrackApplication : Application() {
    lateinit var container: AppContainer
    override fun onCreate() {
        super.onCreate()
        container = DefaultAppContainer()
    }
}