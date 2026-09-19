package com.tradepilot.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.DemoAmber
import com.tradepilot.ui.theme.DemoAmberBg

@Composable
fun DemoBadge(
    modifier: Modifier = Modifier,
    showDot: Boolean = true
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(20.dp))
            .background(DemoAmberBg)
            .border(1.dp, DemoAmber.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp)
    ) {
        if (showDot) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .clip(CircleShape)
                    .background(DemoAmber)
            )
        }
        Text(
            text = "DEMO MODE",
            color = DemoAmber,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}
