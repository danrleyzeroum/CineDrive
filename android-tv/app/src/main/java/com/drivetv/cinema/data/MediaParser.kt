package com.drivetv.cinema.data

import com.drivetv.cinema.model.MediaType

data class ParsedMediaInfo(
    val title: String,
    val type: MediaType,
    val year: String? = null,
    val season: Int? = null,
    val episode: Int? = null,
    val quality: String? = null
)

object MediaParser {

    private val QUALITY_REGEX = Regex("(?i)(2160p|4k|1080p|720p|480p|bdrip|web-?dl|bluray|hdrip)")
    private val YEAR_REGEX = Regex("\\b(19\\d{2}|20\\d{2})\\b")
    private val SERIES_SEASON_EPISODE_REGEX = Regex("(?i)[sS](\\d{1,2})[eE](\\d{1,3})")
    private val SERIES_ALT_REGEX = Regex("(?i)(\\d{1,2})x(\\d{1,3})")

    fun parseFileName(fileName: String): ParsedMediaInfo {
        // Strip extension
        val nameWithoutExt = fileName.replace(Regex("\\.[a-zA-Z0-9]{2,4}$"), "")

        // Check for season & episode
        val seMatch = SERIES_SEASON_EPISODE_REGEX.find(nameWithoutExt)
            ?: SERIES_ALT_REGEX.find(nameWithoutExt)

        val qualityMatch = QUALITY_REGEX.find(nameWithoutExt)
        val quality = qualityMatch?.value?.uppercase()

        val yearMatch = YEAR_REGEX.find(nameWithoutExt)
        val year = yearMatch?.value

        if (seMatch != null) {
            val season = seMatch.groupValues[1].toIntOrNull() ?: 1
            val episode = seMatch.groupValues[2].toIntOrNull() ?: 1

            // Title is everything before the SxxExx
            val rawTitle = nameWithoutExt.substring(0, seMatch.range.first)
            val cleanTitle = cleanTitleString(rawTitle)

            return ParsedMediaInfo(
                title = cleanTitle.ifBlank { nameWithoutExt },
                type = MediaType.SERIES,
                year = year,
                season = season,
                episode = episode,
                quality = quality
            )
        } else {
            // Likely a movie
            var rawTitle = nameWithoutExt
            if (yearMatch != null) {
                rawTitle = nameWithoutExt.substring(0, yearMatch.range.first)
            } else if (qualityMatch != null) {
                rawTitle = nameWithoutExt.substring(0, qualityMatch.range.first)
            }

            val cleanTitle = cleanTitleString(rawTitle)
            return ParsedMediaInfo(
                title = cleanTitle.ifBlank { nameWithoutExt },
                type = MediaType.MOVIE,
                year = year,
                quality = quality
            )
        }
    }

    private fun cleanTitleString(raw: String): String {
        return raw.replace(Regex("[._\\-\\[\\]()]"), " ")
            .replace(Regex("\\s+"), " ")
            .trim()
    }
}
