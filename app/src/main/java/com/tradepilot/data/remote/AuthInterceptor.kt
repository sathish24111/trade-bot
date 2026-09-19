package com.tradepilot.data.remote

import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    @Volatile
    var authToken: String? = null

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val builder = original.newBuilder()

        val token = authToken
        if (!token.isNullOrBlank()) {
            builder.header("Authorization", "Bearer $token")
        }

        builder.header("Accept", "application/json")
        builder.header("Content-Type", "application/json")

        return chain.proceed(builder.build())
    }
}
