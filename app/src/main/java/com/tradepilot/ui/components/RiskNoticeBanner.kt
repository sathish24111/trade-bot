package com.tradepilot.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tradepilot.ui.theme.DarkBorder
import com.tradepilot.ui.theme.DarkSurfaceElevated
import com.tradepilot.ui.theme.DemoAmber
import com.tradepilot.ui.theme.TextMuted

@Composable
fun RiskNoticeBanner(
    modifier: Modifier = Modifier,
    text: String = "Trading involves risk. Demo performance does not guarantee future results."
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(DarkSurfaceElevated)
            .border(1.dp, DarkBorder, RoundedCornerShape(10.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = "Risk Notice",
            tint = DemoAmber,
            modifier = Modifier.size(18.dp)
        )
        Text(
            text = text,
            color = TextMuted,
            fontSize = 11.sp,
            lineHeight = 15.sp
        )
    }
}
