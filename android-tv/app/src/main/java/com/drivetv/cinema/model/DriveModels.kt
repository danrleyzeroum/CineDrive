package com.drivetv.cinema.model

import com.google.gson.annotations.SerializedName

enum class MediaType {
    MOVIE, SERIES
}

data class DriveAccount(
    val id: String,
    val email: String,
    val name: String,
    val accessToken: String,
    val label: String,
    val color: String = "rose",
    val selectedFolderId: String? = null
)

data class DriveFileResponse(
    @SerializedName("files") val files: List<DriveFileItem>?,
    @SerializedName("nextPageToken") val nextPageToken: String?
)

data class DriveFileItem(
    val id: String,
    val name: String,
    val mimeType: String,
    val size: String? = null,
    val modifiedTime: String? = null,
    val thumbnailLink: String? = null,
    val webViewLink: String? = null,
    val parents: List<String>? = null
)

data class MediaItem(
    val id: String,
    val title: String,
    val cleanTitle: String,
    val type: MediaType,
    val year: String? = null,
    val quality: String? = null,
    val genres: List<String> = emptyList(),
    val overview: String? = null,
    val posterUrl: String? = null,
    val backdropUrl: String? = null,
    val rating: String? = null,
    val duration: String? = null,
    val movieFile: DriveFileItem? = null,
    val seasons: List<Season> = emptyList(),
    val accountId: String,
    val accountLabel: String
)

data class Season(
    val seasonNumber: Int,
    val episodes: List<Episode>
)

data class Episode(
    val id: String,
    val fileId: String,
    val accountId: String,
    val accountLabel: String,
    val seasonNumber: Int,
    val episodeNumber: Int,
    val title: String,
    val rawFileName: String,
    val quality: String? = null,
    val parents: List<String>? = null
)

data class SubtitleTrack(
    val id: String,
    val label: String,
    val fileName: String,
    val language: String = "pt-BR",
    val format: String = "srt", // srt or vtt
    val fileId: String,
    val accountId: String
)

data class WatchProgress(
    val mediaId: String,
    val fileId: String,
    val positionMillis: Long,
    val durationMillis: Long,
    val percentage: Float
)
