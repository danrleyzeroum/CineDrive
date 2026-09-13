package com.drivetv.cinema.ui.theme

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.tv.material3.ColorScheme
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.darkColorScheme

val CinemaBlack = Color(0xFF0A0A0C)
val CinemaSurface = Color(0xFF141418)
val CinemaCard = Color(0xFF1C1C22)
val CinemaRose = Color(0xFFE11D48)
val CinemaRoseBright = Color(0xFFF43F5E)
val CinemaTextWhite = Color(0xFFF8FAFC)
val CinemaTextMuted = Color(0xFF94A3B8)
val CinemaFocusBorder = Color(0xFFFFFFFF)

private val TvDarkColors: ColorScheme = darkColorScheme(
    primary = CinemaRose,
    onPrimary = Color.White,
    primaryContainer = CinemaRoseBright,
    surface = CinemaBlack,
    onSurface = CinemaTextWhite,
    surfaceVariant = CinemaSurface,
    onSurfaceVariant = CinemaTextMuted,
    border = CinemaFocusBorder
)

@Composable
fun DriveCinemaTvTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = TvDarkColors,
        content = content
    )
}
