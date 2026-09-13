package com.drivetv.cinema.ui.components

import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import com.drivetv.cinema.model.MediaItem
import com.drivetv.cinema.model.MediaType
import com.drivetv.cinema.ui.theme.*

@Composable
fun TvMediaCard(
    media: MediaItem,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    // Smooth TV scale animation (zoom 1.12x when focused via remote D-Pad)
    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.12f else 1.0f,
        animationSpec = tween(durationMillis = 200, easing = FastOutSlowInEasing),
        label = "tv_card_scale"
    )

    // Dynamic border width & glowing shadow elevation on focus
    val borderWidth by animateDpAsState(
        targetValue = if (isFocused) 3.dp else 1.dp,
        animationSpec = tween(durationMillis = 200),
        label = "tv_border_width"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 16.dp else 2.dp,
        animationSpec = tween(durationMillis = 200),
        label = "tv_shadow"
    )

    val borderColor by animateColorAsState(
        targetValue = if (isFocused) Color.White else Color(0xFF27272A),
        animationSpec = tween(durationMillis = 200),
        label = "tv_border_color"
    )

    Column(
        modifier = modifier
            .width(145.dp)
            .zIndex(if (isFocused) 10f else 1f)
            .scale(scale)
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        Box(
            modifier = Modifier
                .width(145.dp)
                .height(218.dp)
                .shadow(
                    elevation = shadowElevation,
                    shape = RoundedCornerShape(14.dp),
                    spotColor = if (isFocused) CinemaRose.copy(alpha = 0.6f) else Color.Black
                )
                .clip(RoundedCornerShape(14.dp))
                .background(CinemaCard)
                .border(
                    BorderStroke(borderWidth, borderColor),
                    RoundedCornerShape(14.dp)
                )
        ) {
            // Poster Image
            if (!media.posterUrl.isNullOrBlank()) {
                AsyncImage(
                    model = media.posterUrl,
                    contentDescription = media.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Fallback Card Content
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(CinemaCard, CinemaSurface)
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = media.title.take(15),
                        color = CinemaTextMuted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(8.dp)
                    )
                }
            }

            // Top Badges (Quality & Type)
            Row(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(6.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (media.type == MediaType.SERIES) {
                    Text(
                        text = "SÉRIE",
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier
                            .background(Color(0xFF6366F1), RoundedCornerShape(4.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                } else if (!media.quality.isNullOrBlank()) {
                    Text(
                        text = media.quality,
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier
                            .background(CinemaRose, RoundedCornerShape(4.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
            }

            // Rating Badge (Bottom Left)
            if (!media.rating.isNullOrBlank()) {
                Text(
                    text = "★ ${media.rating}",
                    color = Color(0xFFFBBF24),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .background(Color.Black.copy(alpha = 0.85f), RoundedCornerShape(topEnd = 6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }

            // Subtle focus overlay sheen
            if (isFocused) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.12f),
                                    Color.Transparent,
                                    Color.Black.copy(alpha = 0.2f)
                                )
                            )
                        )
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Title text with focus glow & color highlight
        Text(
            text = media.title,
            color = if (isFocused) Color.White else CinemaTextWhite,
            fontWeight = if (isFocused) FontWeight.Black else FontWeight.SemiBold,
            fontSize = if (isFocused) 13.sp else 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        // Year / Account tag
        Text(
            text = listOfNotNull(media.year, media.accountLabel).joinToString(" • "),
            color = if (isFocused) CinemaRoseBright else CinemaTextMuted,
            fontWeight = if (isFocused) FontWeight.Bold else FontWeight.Normal,
            fontSize = 10.sp,
            maxLines = 1
        )
    }
}
