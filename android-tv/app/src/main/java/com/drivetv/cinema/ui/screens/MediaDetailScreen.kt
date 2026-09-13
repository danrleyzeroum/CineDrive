package com.drivetv.cinema.ui.screens

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.drivetv.cinema.model.Episode
import com.drivetv.cinema.model.MediaItem
import com.drivetv.cinema.model.MediaType
import com.drivetv.cinema.ui.theme.*

@Composable
fun MediaDetailScreen(
    media: MediaItem,
    onPlayMovie: (MediaItem) -> Unit,
    onPlayEpisode: (MediaItem, Episode) -> Unit,
    onBack: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CinemaBlack)
    ) {
        // High-res backdrop with gradient mask
        if (!media.backdropUrl.isNullOrBlank()) {
            AsyncImage(
                model = media.backdropUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.horizontalGradient(
                            colors = listOf(
                                CinemaBlack,
                                CinemaBlack.copy(alpha = 0.92f),
                                CinemaBlack.copy(alpha = 0.5f)
                            )
                        )
                    )
            )
        }

        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 48.dp, vertical = 32.dp),
            horizontalArrangement = Arrangement.spacedBy(36.dp)
        ) {
            // Left: Poster
            Box(
                modifier = Modifier
                    .width(220.dp)
                    .height(330.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .border(2.dp, Color(0xFF27272A), RoundedCornerShape(16.dp))
                    .background(CinemaCard)
            ) {
                if (!media.posterUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = media.posterUrl,
                        contentDescription = media.title,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }
            }

            // Right: Metadata & Actions
            Column(modifier = Modifier.weight(1f)) {
                // Back Button
                TvNavBackButton(onClick = onBack)

                Spacer(modifier = Modifier.height(16.dp))

                // Title
                Text(
                    text = media.title,
                    color = Color.White,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Black
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Badges (Year, Quality, Rating, Account)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!media.year.isNullOrBlank()) {
                        DetailBadge(text = media.year, bg = CinemaSurface)
                    }
                    if (!media.quality.isNullOrBlank()) {
                        DetailBadge(text = media.quality, bg = CinemaRose)
                    }
                    if (!media.rating.isNullOrBlank()) {
                        DetailBadge(text = "★ ${media.rating}", bg = Color(0xFF854D0E))
                    }
                    DetailBadge(text = media.accountLabel, bg = Color(0xFF1E293B))
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Overview
                Text(
                    text = media.overview ?: "Sinopse não disponível.",
                    color = CinemaTextMuted,
                    fontSize = 13.sp,
                    lineHeight = 20.sp,
                    maxLines = 4,
                    modifier = Modifier.fillMaxWidth(0.85f)
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Play Movie Button
                if (media.type == MediaType.MOVIE) {
                    TvBigPlayButton(
                        text = "Assistir Agora (ExoPlayer)",
                        onClick = { onPlayMovie(media) }
                    )
                } else {
                    // Series Episodes List
                    Text(
                        text = "Episódios Disponíveis:",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    val episodes = media.seasons.flatMap { it.episodes }
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                    ) {
                        items(episodes, key = { it.id }) { ep ->
                            TvEpisodeItem(
                                episode = ep,
                                onPlay = { onPlayEpisode(media, ep) }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DetailBadge(text: String, bg: Color) {
    Box(
        modifier = Modifier
            .background(bg, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun TvBigPlayButton(text: String, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.08f else 1.0f,
        animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
        label = "play_btn_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 16.dp else 2.dp,
        label = "play_btn_shadow"
    )

    Row(
        modifier = Modifier
            .zIndex(if (isFocused) 5f else 1f)
            .scale(scale)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(14.dp),
                spotColor = CinemaRoseBright
            )
            .clip(RoundedCornerShape(14.dp))
            .background(if (isFocused) Color.White else CinemaRose)
            .border(
                BorderStroke(
                    if (isFocused) 3.dp else 1.5.dp,
                    if (isFocused) Color.White else CinemaRoseBright
                ),
                RoundedCornerShape(14.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 26.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = Icons.Default.PlayArrow,
            contentDescription = null,
            tint = if (isFocused) CinemaBlack else Color.White,
            modifier = Modifier.size(24.dp)
        )
        Text(
            text = text,
            color = if (isFocused) CinemaBlack else Color.White,
            fontWeight = FontWeight.Black,
            fontSize = 15.sp
        )
    }
}

@Composable
fun TvEpisodeItem(
    episode: Episode,
    onPlay: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.04f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "ep_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 10.dp else 0.dp,
        label = "ep_shadow"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth(0.92f)
            .zIndex(if (isFocused) 5f else 1f)
            .scale(scale)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(12.dp),
                spotColor = CinemaRose
            )
            .clip(RoundedCornerShape(12.dp))
            .background(if (isFocused) Color.White else CinemaSurface)
            .border(
                BorderStroke(
                    if (isFocused) 2.5.dp else 1.dp,
                    if (isFocused) Color.White else Color(0xFF27272A)
                ),
                RoundedCornerShape(12.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onPlay
            )
            .padding(horizontal = 18.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Box(
                modifier = Modifier
                    .background(
                        if (isFocused) CinemaRose else Color(0xFF334155),
                        RoundedCornerShape(8.dp)
                    )
                    .padding(horizontal = 10.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "S%02dE%02d".format(episode.seasonNumber, episode.episodeNumber),
                    color = Color.White,
                    fontWeight = FontWeight.Black,
                    fontSize = 11.sp
                )
            }

            Text(
                text = episode.title,
                color = if (isFocused) CinemaBlack else Color.White,
                fontWeight = if (isFocused) FontWeight.Bold else FontWeight.SemiBold,
                fontSize = 14.sp
            )
        }

        Icon(
            imageVector = Icons.Default.PlayArrow,
            contentDescription = "Reproduzir",
            tint = if (isFocused) CinemaBlack else CinemaRoseBright,
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
fun TvNavBackButton(onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.10f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "back_scale"
    )

    Row(
        modifier = Modifier
            .scale(scale)
            .clip(RoundedCornerShape(10.dp))
            .background(if (isFocused) Color.White else CinemaSurface)
            .border(
                BorderStroke(
                    if (isFocused) 2.dp else 1.dp,
                    if (isFocused) Color.White else Color(0xFF27272A)
                ),
                RoundedCornerShape(10.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            imageVector = Icons.Default.ArrowBack,
            contentDescription = "Voltar",
            tint = if (isFocused) CinemaBlack else CinemaTextMuted,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = "Voltar ao Catálogo",
            color = if (isFocused) CinemaBlack else CinemaTextMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}
