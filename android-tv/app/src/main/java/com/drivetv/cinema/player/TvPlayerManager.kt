package com.drivetv.cinema.player

import android.content.Context
import android.net.Uri
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import com.drivetv.cinema.model.SubtitleTrack
import okhttp3.OkHttpClient

@OptIn(UnstableApi::class)
class TvPlayerManager(private val context: Context) {

    var exoPlayer: ExoPlayer? = null
        private set

    private val okHttpClient = OkHttpClient.Builder().build()

    fun initializePlayer(
        fileId: String,
        accessToken: String,
        subtitleTracks: List<SubtitleTrack> = emptyList(),
        startPositionMs: Long = 0L
    ): ExoPlayer {
        releasePlayer()

        // 1. Google Drive direct stream URL
        val mediaUri = Uri.parse("https://www.googleapis.com/drive/v3/files/$fileId?alt=media")

        // 2. Custom OkHttp DataSource with Authorization Bearer header
        val dataSourceFactory = OkHttpDataSource.Factory(okHttpClient)
            .setDefaultRequestProperties(mapOf("Authorization" to "Bearer $accessToken"))

        val mediaSourceFactory = DefaultMediaSourceFactory(context)
            .setDataSourceFactory(dataSourceFactory)

        // 3. Configure MediaItem with direct stream & optional external subtitles (.srt / .vtt)
        val mediaItemBuilder = MediaItem.Builder()
            .setUri(mediaUri)

        // Build sidecar subtitle configurations
        val subtitleConfigurations = subtitleTracks.map { track ->
            val subUri = Uri.parse("https://www.googleapis.com/drive/v3/files/${track.fileId}?alt=media")
            val mimeType = if (track.format == "vtt") MimeTypes.TEXT_VTT else MimeTypes.APPLICATION_SUBRIP

            MediaItem.SubtitleConfiguration.Builder(subUri)
                .setMimeType(mimeType)
                .setLanguage(track.language)
                .setLabel(track.label)
                .setSelectionFlags(C.SELECTION_FLAG_DEFAULT)
                .build()
        }

        if (subtitleConfigurations.isNotEmpty()) {
            mediaItemBuilder.setSubtitleConfigurations(subtitleConfigurations)
        }

        // 4. Build Player with TV optimizations
        val player = ExoPlayer.Builder(context)
            .setMediaSourceFactory(mediaSourceFactory)
            .setSeekBackIncrementMs(10000)
            .setSeekForwardIncrementMs(10000)
            .build()

        player.setMediaItem(mediaItemBuilder.build())
        player.prepare()
        if (startPositionMs > 0) {
            player.seekTo(startPositionMs)
        }
        player.playWhenReady = true

        this.exoPlayer = player
        return player
    }

    fun seekForward(ms: Long = 10000) {
        exoPlayer?.let {
            val next = (it.currentPosition + ms).coerceAtMost(it.duration)
            it.seekTo(next)
        }
    }

    fun seekBackward(ms: Long = 10000) {
        exoPlayer?.let {
            val prev = (it.currentPosition - ms).coerceAtLeast(0)
            it.seekTo(prev)
        }
    }

    fun togglePlayPause() {
        exoPlayer?.let {
            if (it.isPlaying) it.pause() else it.play()
        }
    }

    fun releasePlayer() {
        exoPlayer?.release()
        exoPlayer = null
    }
}
