package com.drivetv.cinema.data

import com.drivetv.cinema.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.net.URLEncoder

class DriveRepository(private val client: OkHttpClient = OkHttpClient()) {

    suspend fun fetchVideoFiles(account: DriveAccount): List<DriveFileItem> = withContext(Dispatchers.IO) {
        val query = "mimeType contains 'video/' and trashed = false"
        val url = "https://www.googleapis.com/drive/v3/files?" +
                "q=${URLEncoder.encode(query, "UTF-8")}" +
                "&fields=files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,parents)" +
                "&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true"

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer ${account.accessToken}")
            .build()

        try {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext emptyList()
            val json = JSONObject(body)
            val filesArray = json.optJSONArray("files") ?: return@withContext emptyList()

            val list = mutableListOf<DriveFileItem>()
            for (i in 0 until filesArray.length()) {
                val item = filesArray.getJSONObject(i)
                val parentsList = mutableListOf<String>()
                val parentsJson = item.optJSONArray("parents")
                if (parentsJson != null) {
                    for (p in 0 until parentsJson.length()) {
                        parentsList.add(parentsJson.getString(p))
                    }
                }

                list.add(
                    DriveFileItem(
                        id = item.getString("id"),
                        name = item.getString("name"),
                        mimeType = item.getString("mimeType"),
                        size = item.optString("size", null),
                        modifiedTime = item.optString("modifiedTime", null),
                        thumbnailLink = item.optString("thumbnailLink", null),
                        webViewLink = item.optString("webViewLink", null),
                        parents = parentsList
                    )
                )
            }
            list
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun fetchSubtitlesForFile(
        account: DriveAccount,
        fileName: String,
        parents: List<String>?
    ): List<SubtitleTrack> = withContext(Dispatchers.IO) {
        val subtitleFilter = "(name contains '.srt' or name contains '.vtt') and trashed = false"
        val url = "https://www.googleapis.com/drive/v3/files?" +
                "q=${URLEncoder.encode(subtitleFilter, "UTF-8")}" +
                "&fields=files(id,name,parents)&pageSize=40&supportsAllDrives=true&includeItemsFromAllDrives=true"

        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer ${account.accessToken}")
            .build()

        try {
            val response = client.newCall(request).execute()
            val body = response.body?.string() ?: return@withContext emptyList()
            val json = JSONObject(body)
            val filesArray = json.optJSONArray("files") ?: return@withContext emptyList()

            val results = mutableListOf<SubtitleTrack>()
            val baseName = fileName.substringBeforeLast(".").lowercase()

            for (i in 0 until filesArray.length()) {
                val item = filesArray.getJSONObject(i)
                val id = item.getString("id")
                val name = item.getString("name")
                val isVtt = name.lowercase().endsWith(".vtt")

                // Friendly label
                val label = when {
                    name.contains("pt-br", ignoreCase = true) || name.contains("portugues", ignoreCase = true) -> "Português (Brasil)"
                    name.contains(".en.", ignoreCase = true) || name.contains("english", ignoreCase = true) -> "Inglês (English)"
                    name.contains(".es.", ignoreCase = true) || name.contains("espanol", ignoreCase = true) -> "Espanhol (Español)"
                    else -> name.substringBeforeLast(".")
                }

                results.add(
                    SubtitleTrack(
                        id = id,
                        label = label,
                        fileName = name,
                        format = if (isVtt) "vtt" else "srt",
                        fileId = id,
                        accountId = account.id
                    )
                )
            }
            results
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    suspend fun downloadSubtitleContent(accessToken: String, fileId: String): String = withContext(Dispatchers.IO) {
        val url = "https://www.googleapis.com/drive/v3/files/$fileId?alt=media"
        val request = Request.Builder()
            .url(url)
            .addHeader("Authorization", "Bearer $accessToken")
            .build()

        val response = client.newCall(request).execute()
        response.body?.string() ?: ""
    }
}
