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
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import androidx.tv.material3.Text
import com.drivetv.cinema.model.DriveAccount
import com.drivetv.cinema.ui.theme.*

@Composable
fun SettingsScreen(
    accounts: List<DriveAccount>,
    onAddAccount: (String, String) -> Unit,
    onBack: () -> Unit
) {
    var newAccountLabel by remember { mutableStateOf("") }
    var newAccessToken by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(CinemaBlack)
            .padding(horizontal = 48.dp, vertical = 32.dp)
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                TvNavBackButton(onClick = onBack)
                Text(
                    text = "Configurações & Contas Google Drive",
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.spacedBy(36.dp)
            ) {
                // Left: Connected accounts list
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Contas Conectadas (${accounts.size})",
                        color = CinemaTextWhite,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )

                    if (accounts.isEmpty()) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CinemaSurface, RoundedCornerShape(12.dp))
                                .padding(24.dp)
                        ) {
                            Text(
                                text = "Nenhuma conta conectada ainda. Adicione o Token do Google Drive ao lado.",
                                color = CinemaTextMuted,
                                fontSize = 13.sp
                            )
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(accounts) { acc ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(CinemaSurface, RoundedCornerShape(10.dp))
                                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(10.dp))
                                        .padding(14.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.Cloud,
                                            contentDescription = null,
                                            tint = CinemaRose
                                        )
                                        Column {
                                            Text(
                                                text = acc.label,
                                                color = Color.White,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 13.sp
                                            )
                                            Text(
                                                text = acc.email.ifBlank { "Token configurado" },
                                                color = CinemaTextMuted,
                                                fontSize = 11.sp
                                            )
                                        }
                                    }
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = null,
                                        tint = Color(0xFF10B981)
                                    )
                                }
                            }
                        }
                    }
                }

                // Right: Add Account Box
                Column(
                    modifier = Modifier
                        .weight(1.2f)
                        .background(CinemaSurface, RoundedCornerShape(16.dp))
                        .border(1.dp, Color(0xFF27272A), RoundedCornerShape(16.dp))
                        .padding(24.dp)
                ) {
                    Text(
                        text = "Conectar Nova Conta Google Drive",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Nome da Conta (Ex: Filmes 4K ou Drive 2):",
                        color = CinemaTextMuted,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newAccountLabel,
                        onValueChange = { newAccountLabel = it },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = CinemaRose,
                            unfocusedBorderColor = Color(0xFF3F3F46)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Text(
                        text = "Token de Acesso (Google Drive Bearer Token):",
                        color = CinemaTextMuted,
                        fontSize = 12.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = newAccessToken,
                        onValueChange = { newAccessToken = it },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = CinemaRose,
                            unfocusedBorderColor = Color(0xFF3F3F46)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(18.dp))

                    TvSaveButton(
                        text = "Salvar Conta no TV Box",
                        onClick = {
                            if (newAccountLabel.isNotBlank() && newAccessToken.isNotBlank()) {
                                onAddAccount(newAccountLabel, newAccessToken)
                                newAccountLabel = ""
                                newAccessToken = ""
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun TvSaveButton(text: String, onClick: () -> Unit) {
    val interactionSource = remember { MutableInteractionSource() }
    val isFocused by interactionSource.collectIsFocusedAsState()

    val scale by animateFloatAsState(
        targetValue = if (isFocused) 1.05f else 1.0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "save_btn_scale"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isFocused) 12.dp else 0.dp,
        label = "save_btn_shadow"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .scale(scale)
            .shadow(
                elevation = shadowElevation,
                shape = RoundedCornerShape(12.dp),
                spotColor = CinemaRoseBright
            )
            .clip(RoundedCornerShape(12.dp))
            .background(if (isFocused) Color.White else CinemaRose)
            .border(
                BorderStroke(
                    if (isFocused) 2.5.dp else 1.dp,
                    if (isFocused) Color.White else CinemaRoseBright
                ),
                RoundedCornerShape(12.dp)
            )
            .focusable(interactionSource = interactionSource)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                onClick = onClick
            )
            .padding(vertical = 14.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            text = text,
            color = if (isFocused) CinemaBlack else Color.White,
            fontWeight = FontWeight.Bold,
            fontSize = 14.sp
        )
    }
}
