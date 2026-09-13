package com.drivetv.cinema.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
    val scale by animateFloatAsState(if (isFocused) 1.08f else 1.0f, label = "card_scale")

    Column(
        modifier = modifier
            .width(140.dp)
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
    ) {
        Box(
            modifier = Modifier
                .width(140.dp)
                .height(210.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(CinemaCard)
                .then(
                    if (isFocused) {
                        Modifier.border(
                            BorderStroke(2.5.dp, Color.White),
                            RoundedCornerShape(12.dp)
                        )
                    } else {
                        Modifier.border(
                            BorderStroke(1.dp, Color(0xFF27272A)),
                            RoundedCornerShape(12.dp)
                        )
                    }
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

            // Quality & Type Badge
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
                            .padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                } else if (!media.quality.isNullOrBlank()) {
                    Text(
                        text = media.quality,
                        color = Color.White,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier
                            .background(CinemaRose, RoundedCornerShape(4.dp))
                            .padding(horizontal = 4.dp, vertical = 2.dp)
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
                        .background(Color.Black.copy(alpha = 0.8f), RoundedCornerShape(topEnd = 6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Title text
        Text(
            text = media.title,
            color = if (isFocused) Color.White else CinemaTextWhite,
            fontWeight = if (isFocused) FontWeight.Bold else FontWeight.Medium,
            fontSize = 12.sp,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )

        // Year / Account tag
        Text(
            text = listOfNotNull(media.year, media.accountLabel).joinToString(" • "),
            color = CinemaTextMuted,
            fontSize = 10.sp,
            maxLines = 1
        )
    }
}
