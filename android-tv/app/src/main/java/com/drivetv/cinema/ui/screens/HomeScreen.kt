package com.drivetv.cinema.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.drivetv.cinema.model.MediaItem
import com.drivetv.cinema.model.MediaType
import com.drivetv.cinema.ui.components.TvMediaCard
import com.drivetv.cinema.ui.theme.*

@Composable
fun HomeScreen(
    mediaList: List<MediaItem>,
    isLoading: Boolean,
    onSelectMedia: (MediaItem) -> Unit,
    onRefreshDrive: () -> Unit,
    onOpenSettings: () -> Unit
) {
    var selectedFilter by remember { mutableStateOf("all") } // "all", "movie", "series"
    val featuredItem = remember(mediaList) { mediaList.firstOrNull { it.backdropUrl != null } ?: mediaList.firstOrNull() }

    val movies = remember(mediaList) { mediaList.filter { it.type == MediaType.MOVIE } }
    val series = remember(mediaList) { mediaList.filter { it.type == MediaType.SERIES } }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CinemaBlack)
    ) {
        // Hero Backdrop (dimmed)
        if (featuredItem?.backdropUrl != null) {
            AsyncImage(
                model = featuredItem.backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp)
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(380.dp)
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(
                                Color.Black.copy(alpha = 0.4f),
                                CinemaBlack.copy(alpha = 0.85f),
                                CinemaBlack
                            )
                        )
                    )
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 36.dp, vertical = 24.dp)
        ) {
            // Header / Navigation Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "DRIVE CINEMA TV",
                        color = CinemaRose,
                        fontWeight = FontWeight.Black,
                        fontSize = 20.sp,
                        letterSpacing = 1.sp
                    )

                    // Navigation Tabs
                    TvNavButton(
                        label = "Todos (${mediaList.size})",
                        isSelected = selectedFilter == "all",
                        onClick = { selectedFilter = "all" }
                    )
                    TvNavButton(
                        label = "Filmes (${movies.size})",
                        isSelected = selectedFilter == "movie",
                        onClick = { selectedFilter = "movie" }
                    )
                    TvNavButton(
                        label = "Séries (${series.size})",
                        isSelected = selectedFilter == "series",
                        onClick = { selectedFilter = "series" }
                    )
                }

                // Action Buttons (Refresh / Settings)
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    TvIconButton(
                        icon = Icons.Default.Refresh,
                        contentDescription = "Recarregar Drive",
                        onClick = onRefreshDrive
                    )
                    TvIconButton(
                        icon = Icons.Default.Settings,
                        contentDescription = "Configurações",
                        onClick = onOpenSettings
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Featured Hero Presentation
            if (featuredItem != null) {
                Column(modifier = Modifier.padding(vertical = 12.dp)) {
                    Text(
                        text = featuredItem.title,
                        color = Color.White,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Black
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = featuredItem.overview ?: "Disponível no seu Google Drive com reprodução nativa e legendas.",
                        color = CinemaTextMuted,
                        fontSize = 13.sp,
                        maxLines = 2,
                        modifier = Modifier.fillMaxWidth(0.65f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Catalog Rows
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        CircularProgressIndicator(color = CinemaRose)
                        Text(
                            text = "Sincronizando com Google Drive...",
                            color = CinemaTextMuted,
                            fontSize = 14.sp
                        )
                    }
                }
            } else if (mediaList.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Nenhum arquivo de vídeo encontrado. Verifique suas contas em Configurações.",
                        color = CinemaTextMuted,
                        fontSize = 14.sp
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(28.dp),
                    modifier = Modifier.fillMaxSize()
                ) {
                    if (selectedFilter == "all" || selectedFilter == "movie") {
                        item {
                            MediaRow(
                                title = "Filmes no Drive",
                                items = movies,
                                onSelect = onSelectMedia
                            )
                        }
                    }

                    if (selectedFilter == "all" || selectedFilter == "series") {
                        item {
                            MediaRow(
                                title = "Séries e Temporadas",
                                items = series,
                                onSelect = onSelectMedia
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MediaRow(
    title: String,
    items: List<MediaItem>,
    onSelect: (MediaItem) -> Unit
) {
    Column {
        Text(
            text = title,
            color = CinemaTextWhite,
            fontWeight = FontWeight.Bold,
            fontSize = 16.sp,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(end = 40.dp)
        ) {
            items(items, key = { it.id }) { item ->
                TvMediaCard(
                    media = item,
                    onClick = { onSelect(item) }
                )
            }
        }
    }
}

@Composable
fun TvNavButton(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(
                when {
                    isFocused -> Color.White
                    isSelected -> CinemaRose
                    else -> CinemaSurface
                }
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 14.dp, vertical = 6.dp)
    ) {
        Text(
            text = label,
            color = if (isFocused) CinemaBlack else Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
    }
}

@Composable
fun TvIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    contentDescription: String,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(if (isFocused) Color.White else CinemaSurface)
            .border(
                1.dp,
                if (isFocused) Color.White else Color(0xFF27272A),
                RoundedCornerShape(8.dp)
            )
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription,
            tint = if (isFocused) CinemaBlack else Color.White,
            modifier = Modifier.size(18.dp)
        )
    }
}
