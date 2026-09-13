package com.drivetv.cinema.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder

data class TmdbMetadata(
    val title: String,
    val overview: String?,
    val posterUrl: String?,
    val backdropUrl: String?,
    val rating: String?,
    val genres: List<String> = emptyList()
)

class TmdbRepository(
    private val apiKey: String = "4f8f4161a0d7831d10271732e700a0be",
    private val client: OkHttpClient = OkHttpClient()
) {

    suspend fun searchMovie(title: String, year: String? = null): TmdbMetadata? = withContext(Dispatchers.IO) {
        val queryParam = URLEncoder.encode(title, "UTF-8")
        var url = "https://api.themoviedb.org/3/search/movie?api_key=$apiKey&query=$queryParam&language=pt-BR&include_adult=false"
        if (!year.isNullOrBlank()) {
            url += "&year=$year"
        }

        try {
            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext null
            val json = JSONObject(body)
            val results = json.optJSONArray("results") ?: return@withContext null

            if (results.length() > 0) {
                val first = results.getJSONObject(0)
                val posterPath = first.optString("poster_path", null)
                val backdropPath = first.optString("backdrop_path", null)
                val voteAvg = first.optDouble("vote_average", 0.0)

                return@withContext TmdbMetadata(
                    title = first.optString("title", title),
                    overview = first.optString("overview", null),
                    posterUrl = if (posterPath != null) "https://image.tmdb.org/t/p/w500$posterPath" else null,
                    backdropUrl = if (backdropPath != null) "https://image.tmdb.org/t/p/w1280$backdropPath" else null,
                    rating = if (voteAvg > 0) String.format("%.1f", voteAvg) else null
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        null
    }

    suspend fun searchSeries(title: String, year: String? = null): TmdbMetadata? = withContext(Dispatchers.IO) {
        val queryParam = URLEncoder.encode(title, "UTF-8")
        var url = "https://api.themoviedb.org/3/search/tv?api_key=$apiKey&query=$queryParam&language=pt-BR&include_adult=false"
        if (!year.isNullOrBlank()) {
            url += "&first_air_date_year=$year"
        }

        try {
            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext null
            val json = JSONObject(body)
            val results = json.optJSONArray("results") ?: return@withContext null

            if (results.length() > 0) {
                val first = results.getJSONObject(0)
                val posterPath = first.optString("poster_path", null)
                val backdropPath = first.optString("backdrop_path", null)
                val voteAvg = first.optDouble("vote_average", 0.0)

                return@withContext TmdbMetadata(
                    title = first.optString("name", title),
                    overview = first.optString("overview", null),
                    posterUrl = if (posterPath != null) "https://image.tmdb.org/t/p/w500$posterPath" else null,
                    backdropUrl = if (backdropPath != null) "https://image.tmdb.org/t/p/w1280$backdropPath" else null,
                    rating = if (voteAvg > 0) String.format("%.1f", voteAvg) else null
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        null
    }
}
