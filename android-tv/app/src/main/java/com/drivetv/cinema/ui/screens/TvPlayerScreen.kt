package com.drivetv.cinema.ui.screens

import android.view.KeyEvent
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
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
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.key.*
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.zIndex
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import androidx.tv.material3.Text
import com.drivetv.cinema.model.SubtitleTrack
import com.drivetv.cinema.player.TvPlayerManager
import com.drivetv.cinema.ui.theme.*

@OptIn(UnstableApi::class)
@Composable
fun TvPlayerScreen(
    title: String,
    fileId: String,
    accessToken: String,
    subtitles: List<SubtitleTrack>,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val playerManager = remember { TvPlayerManager(context) }
    var selectedSubtitle by remember { mutableStateOf<SubtitleTrack?>(null) }
    var showSubtitleDialog by remember { mutableStateOf(false) }

    val focusRequester = remember { FocusRequester() }

    // Initialize ExoPlayer
    val player = remember(fileId, selectedSubtitle) {
        val activeSubList = if (selectedSubtitle != null) listOf(selectedSubtitle!!) else subtitles
        playerManager.initializePlayer(
            fileId = fileId,
            accessToken = accessToken,
            subtitleTracks = activeSubList
        )
    }

    DisposableEffect(Unit) {
        onDispose {
            playerManager.releasePlayer()
        }
    }

    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .focusRequester(focusRequester)
            .focusable()
            .onKeyEvent { keyEvent ->
                if (keyEvent.type == KeyEventType.KeyDown) {
                    when (keyEvent.nativeKeyEvent.keyCode) {
                        KeyEvent.KEYCODE_DPAD_CENTER,
                        KeyEvent.KEYCODE_ENTER -> {
                            playerManager.togglePlayPause()
                            true
                        }
                        KeyEvent.KEYCODE_DPAD_LEFT -> {
                            playerManager.seekBackward(10000)
                            true
                        }
                        KeyEvent.KEYCODE_DPAD_RIGHT -> {
                            playerManager.seekForward(10000)
                            true
                        }
                        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                            playerManager.togglePlayPause()
                            true
                        }
                        KeyEvent.KEYCODE_MENU -> {
                            showSubtitleDialog = !showSubtitleDialog
                            true
                        }
                        KeyEvent.KEYCODE_BACK,
                        KeyEvent.KEYCODE_ESCAPE -> {
                            if (showSubtitleDialog) {
                                showSubtitleDialog = false
                                true
                            } else {
                                onBack()
                                true
                            }
                        }
                        else -> false
                    }
                } else {
                    false
                }
            }
    ) {
        // ExoPlayer Surface View
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    this.player = player
                    useController = true
                    controllerAutoShow = true
                    layoutParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay Title & Subtitle quick switch button
        Row(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .fillMaxWidth()
                .background(Color.Black.copy(alpha = 0.6f))
                .padding(horizontal = 24.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                TvPlayerIconButton(
                    icon = Icons.Default.ArrowBack,
                    onClick = onBack
                )
                Text(
                    text = title,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            // Subtitles toggle button
            TvPlayerNavButton(
                label = if (selectedSubtitle != null) "Legenda: ${selectedSubtitle!!.label}" else "Legendas (.srt/.vtt)",
                icon = Icons.Default.Subtitles,
                onClick = { showSubtitleDialog = true }
            )
        }

        // Subtitle Selection Dialog for TV
        if (showSubtitleDialog) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    modifier = Modifier
                        .width(420.dp)
                        .background(CinemaSurface, RoundedCornerShape(16.dp))
                        .border(1.5.dp, Color(0xFF3F3F46), RoundedCornerShape(16.dp))
                        .padding(24.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Selecionar Legenda (Google Drive)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        TvPlayerIconButton(
                            icon = Icons.Default.Close,
                            onClick = { showSubtitleDialog = false }
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        item {
                            TvSubItem(
                                label = "Desativar Legendas",
                                isSelected = selectedSubtitle == null,
                                onClick = {
                                    selectedSubtitle = null
                                    showSubtitleDialog = false
                                }
                            )
                        }

                        items(subtitles) { sub ->
                            TvSubItem(
                                label = "${sub.label} (${sub.format.uppercase()})",
                                isSelected = selectedSubtitle?.id == sub.id,
                                onClick = {
                                    selectedSubtitle = sub
                                    showSubtitleDialog = false
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TvSubItem(
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.05f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "sub_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 10.dp else 0.dp,
        label = "sub_shadow"
    )

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .zIndex(if (isFocused) 5f else 1f)
            .scale(scale)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(10.dp),
                spotColor = CinemaRose
            )
            .clip(RoundedCornerShape(10.dp))
            .background(
                when {
                    isFocused -> Color.White
                    isSelected -> CinemaRose
                    else -> CinemaCard
                }
            )
            .border(
                BorderStroke(
                    if (isFocused) 2.5.dp else 1.dp,
                    if (isFocused) Color.White else if (isSelected) CinemaRoseBright else Color(0xFF27272A)
                ),
                RoundedCornerShape(10.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            color = if (isFocused) CinemaBlack else Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 13.sp
        )
        if (isSelected) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = null,
                tint = if (isFocused) CinemaBlack else Color.White
            )
        }
    }
}

@Composable
fun TvPlayerIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.20f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "player_icon_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 10.dp else 0.dp,
        label = "player_icon_shadow"
    )

    Box(
        modifier = Modifier
            .zIndex(if (isFocused) 5f else 1f)
            .scale(scale)
            .size(36.dp)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(8.dp),
                spotColor = Color.White
            )
            .clip(RoundedCornerShape(8.dp))
            .background(if (isFocused) Color.White else CinemaCard)
            .border(
                BorderStroke(
                    if (isFocused) 2.dp else 1.dp,
                    if (isFocused) Color.White else Color(0xFF27272A)
                ),
                RoundedCornerShape(8.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = if (isFocused) CinemaBlack else Color.White,
            modifier = Modifier.size(18.dp)
        )
    }
}

@Composable
fun TvPlayerNavButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.10f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "player_nav_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 8.dp else 0.dp,
        label = "player_nav_shadow"
    )

    Row(
        modifier = Modifier
            .zIndex(if (isFocused) 5f else 1f)
            .scale(scale)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(10.dp),
                spotColor = CinemaRose
            )
            .clip(RoundedCornerShape(10.dp))
            .background(if (isFocused) Color.White else CinemaCard)
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
            imageVector = icon,
            contentDescription = null,
            tint = if (isFocused) CinemaBlack else CinemaRose,
            modifier = Modifier.size(16.dp)
        )
        Text(
            text = label,
            color = if (isFocused) CinemaBlack else Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
    }
}
