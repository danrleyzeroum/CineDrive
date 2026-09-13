package com.drivetv.cinema

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.lifecycle.lifecycleScope
import com.drivetv.cinema.data.DriveRepository
import com.drivetv.cinema.data.MediaParser
import com.drivetv.cinema.data.TmdbRepository
import com.drivetv.cinema.model.*
import com.drivetv.cinema.ui.screens.*
import com.drivetv.cinema.ui.theme.DriveCinemaTvTheme
import kotlinx.coroutines.launch

enum class TvScreen {
    HOME, DETAIL, PLAYER, SETTINGS
}

class MainActivity : ComponentActivity() {

    private val driveRepo = DriveRepository()
    private val tmdbRepo = TmdbRepository()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            DriveCinemaTvTheme {
                var currentScreen by remember { mutableStateOf(TvScreen.HOME) }
                var selectedMedia by remember { mutableStateOf<MediaItem?>(null) }
                var activePlayTitle by remember { mutableStateOf("") }
                var activePlayFileId by remember { mutableStateOf("") }
                var activePlayAccessToken by remember { mutableStateOf("") }
                var activeSubtitles by remember { mutableStateOf<List<SubtitleTrack>>(emptyList()) }

                var accounts by remember {
                    mutableStateOf(
                        listOf(
                            DriveAccount(
                                id = "acc_primary",
                                email = "user@drive.com",
                                name = "Conta Principal",
                                accessToken = "",
                                label = "Drive Pessoal"
                            )
                        )
                    )
                }

                var mediaList by remember { mutableStateOf<List<MediaItem>>(emptyList()) }
                var isLoading by remember { mutableStateOf(false) }

                // Scan Google Drive across accounts
                val scanDrive: () -> Unit = {
                    lifecycleScope.launch {
                        isLoading = true
                        val newMediaItems = mutableListOf<MediaItem>()

                        for (acc in accounts) {
                            if (acc.accessToken.isBlank()) continue
                            val files = driveRepo.fetchVideoFiles(acc)

                            for (file in files) {
                                val parsed = MediaParser.parseFileName(file.name)
                                val tmdb = if (parsed.type == MediaType.MOVIE) {
                                    tmdbRepo.searchMovie(parsed.title, parsed.year)
                                } else {
                                    tmdbRepo.searchSeries(parsed.title, parsed.year)
                                }

                                if (parsed.type == MediaType.MOVIE) {
                                    newMediaItems.add(
                                        MediaItem(
                                            id = file.id,
                                            title = tmdb?.title ?: parsed.title,
                                            cleanTitle = parsed.title,
                                            type = MediaType.MOVIE,
                                            year = parsed.year,
                                            quality = parsed.quality ?: "1080P",
                                            overview = tmdb?.overview,
                                            posterUrl = tmdb?.posterUrl ?: file.thumbnailLink,
                                            backdropUrl = tmdb?.backdropUrl,
                                            rating = tmdb?.rating,
                                            movieFile = file,
                                            accountId = acc.id,
                                            accountLabel = acc.label
                                        )
                                    )
                                } else {
                                    // Series item with season/episode
                                    val episode = Episode(
                                        id = file.id,
                                        fileId = file.id,
                                        accountId = acc.id,
                                        accountLabel = acc.label,
                                        seasonNumber = parsed.season ?: 1,
                                        episodeNumber = parsed.episode ?: 1,
                                        title = "Episódio ${parsed.episode ?: 1}",
                                        rawFileName = file.name,
                                        quality = parsed.quality,
                                        parents = file.parents
                                    )

                                    val existingSeries = newMediaItems.find {
                                        it.cleanTitle.equals(parsed.title, ignoreCase = true)
                                    }

                                    if (existingSeries != null) {
                                        // Append episode
                                        val seasons = existingSeries.seasons.toMutableList()
                                        val seasonIdx = seasons.indexOfFirst { it.seasonNumber == (parsed.season ?: 1) }
                                        if (seasonIdx != -1) {
                                            val eps = seasons[seasonIdx].episodes.toMutableList()
                                            eps.add(episode)
                                            seasons[seasonIdx] = seasons[seasonIdx].copy(episodes = eps.sortedBy { it.episodeNumber })
                                        } else {
                                            seasons.add(Season(parsed.season ?: 1, listOf(episode)))
                                        }
                                        val idx = newMediaItems.indexOf(existingSeries)
                                        newMediaItems[idx] = existingSeries.copy(seasons = seasons.sortedBy { it.seasonNumber })
                                    } else {
                                        newMediaItems.add(
                                            MediaItem(
                                                id = "series_${parsed.title.hashCode()}",
                                                title = tmdb?.title ?: parsed.title,
                                                cleanTitle = parsed.title,
                                                type = MediaType.SERIES,
                                                year = parsed.year,
                                                quality = parsed.quality,
                                                overview = tmdb?.overview,
                                                posterUrl = tmdb?.posterUrl ?: file.thumbnailLink,
                                                backdropUrl = tmdb?.backdropUrl,
                                                rating = tmdb?.rating,
                                                seasons = listOf(Season(parsed.season ?: 1, listOf(episode))),
                                                accountId = acc.id,
                                                accountLabel = acc.label
                                            )
                                        )
                                    }
                                }
                            }
                        }

                        mediaList = newMediaItems
                        isLoading = false
                    }
                }

                // Handle Back Button on TV Remote
                BackHandler(enabled = currentScreen != TvScreen.HOME) {
                    when (currentScreen) {
                        TvScreen.PLAYER -> currentScreen = if (selectedMedia != null) TvScreen.DETAIL else TvScreen.HOME
                        TvScreen.DETAIL -> currentScreen = TvScreen.HOME
                        TvScreen.SETTINGS -> currentScreen = TvScreen.HOME
                        else -> {}
                    }
                }

                // Screen Navigation
                when (currentScreen) {
                    TvScreen.HOME -> {
                        HomeScreen(
                            mediaList = mediaList,
                            isLoading = isLoading,
                            onSelectMedia = {
                                selectedMedia = it
                                currentScreen = TvScreen.DETAIL
                            },
                            onRefreshDrive = scanDrive,
                            onOpenSettings = { currentScreen = TvScreen.SETTINGS }
                        )
                    }

                    TvScreen.DETAIL -> {
                        selectedMedia?.let { media ->
                            MediaDetailScreen(
                                media = media,
                                onPlayMovie = { m ->
                                    val acc = accounts.find { it.id == m.accountId } ?: accounts.firstOrNull()
                                    if (acc != null && m.movieFile != null) {
                                        activePlayTitle = m.title
                                        activePlayFileId = m.movieFile.id
                                        activePlayAccessToken = acc.accessToken

                                        // Fetch subtitles in background
                                        lifecycleScope.launch {
                                            activeSubtitles = driveRepo.fetchSubtitlesForFile(
                                                account = acc,
                                                fileName = m.movieFile.name,
                                                parents = m.movieFile.parents
                                            )
                                        }
                                        currentScreen = TvScreen.PLAYER
                                    }
                                },
                                onPlayEpisode = { m, ep ->
                                    val acc = accounts.find { it.id == ep.accountId } ?: accounts.firstOrNull()
                                    if (acc != null) {
                                        activePlayTitle = "${m.title} - S%02dE%02d".format(ep.seasonNumber, ep.episodeNumber)
                                        activePlayFileId = ep.fileId
                                        activePlayAccessToken = acc.accessToken

                                        lifecycleScope.launch {
                                            activeSubtitles = driveRepo.fetchSubtitlesForFile(
                                                account = acc,
                                                fileName = ep.rawFileName,
                                                parents = ep.parents
                                            )
                                        }
                                        currentScreen = TvScreen.PLAYER
                                    }
                                },
                                onBack = { currentScreen = TvScreen.HOME }
                            )
                        }
                    }

                    TvScreen.PLAYER -> {
                        TvPlayerScreen(
                            title = activePlayTitle,
                            fileId = activePlayFileId,
                            accessToken = activePlayAccessToken,
                            subtitles = activeSubtitles,
                            onBack = {
                                currentScreen = if (selectedMedia != null) TvScreen.DETAIL else TvScreen.HOME
                            }
                        )
                    }

                    TvScreen.SETTINGS -> {
                        SettingsScreen(
                            accounts = accounts,
                            onAddAccount = { label, token ->
                                val newAcc = DriveAccount(
                                    id = "acc_${System.currentTimeMillis()}",
                                    email = "",
                                    name = label,
                                    accessToken = token,
                                    label = label
                                )
                                accounts = accounts + newAcc
                                scanDrive()
                            },
                            onBack = { currentScreen = TvScreen.HOME }
                        )
                    }
                }
            }
        }
    }
}
