package com.tradepilot.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.DarkBorder
import com.tradepilot.ui.theme.DarkSurfaceElevated
import com.tradepilot.ui.theme.DemoAmber
import com.tradepilot.ui.theme.TextMuted
import com.tradepilot.ui.theme.TextPrimary

@Composable
fun PaperSafetyBanner(
    modifier: Modifier = Modifier,
    isOffline: Boolean = false,
    dataSource: String = "SIMULATED / CRYPTO_WS"
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(8.dp))
            .padding(8.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Paper Security Lock",
                    tint = DemoAmber,
                    modifier = Modifier.size(14.dp)
                )
                Text(
                    text = "PAPER MODE",
                    color = DemoAmber,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            if (isOffline) {
                Text(
                    text = "SERVER OFFLINE • CACHED",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            } else {
                Text(
                    text = "LIVE READ-ONLY MARKET DATA",
                    color = TextPrimary,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Text(
            text = "SIMULATED PAPER ORDER EXECUTION • Data Source: $dataSource",
            color = TextMuted,
            fontSize = 9.sp
        )
    }
}
